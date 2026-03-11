import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionFromCookies } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { PRODUCT_OPTIONS, isValidProductKey } from "../../../../../../lib/products";

const schema = z.object({
  enabledProducts: z.array(z.string())
});

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const adminSession = getAdminSessionFromCookies();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid products payload." }, { status: 400 });
    }

    const enabledProducts = parsed.data.enabledProducts.filter(isValidProductKey);
    const disabledFields = PRODUCT_OPTIONS.filter(
      (product) => !enabledProducts.includes(product.key)
    )
      .flatMap((product) => {
        const fields: string[] = [];
        if ("sizeField" in product) fields.push(product.sizeField);
        if ("qtyField" in product) fields.push(product.qtyField);
        return fields;
      });

    const updated = await prisma.$transaction(async (tx) => {
      const ownedTeam = await tx.team.findFirst({
        where: {
          id: params.teamId,
          managerEmail: {
            equals: adminSession.email,
            mode: "insensitive"
          }
        },
        select: { id: true }
      });

      if (!ownedTeam) {
        return null;
      }

      const team = await tx.team.update({
        where: { id: ownedTeam.id },
        data: { enabledProducts },
        select: { id: true, enabledProducts: true }
      });

      if (disabledFields.length > 0) {
        const clearData = Object.fromEntries(
          disabledFields.map((field) => [field, null])
        ) as Record<string, null>;

        await tx.player.updateMany({
          where: { teamId: ownedTeam.id },
          data: clearData
        });
      }

      return team;
    });

    if (!updated) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, team: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to update team products." },
      { status: 500 }
    );
  }
}
