import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  if (!query) return NextResponse.json([]);

  const teams = await prisma.team.findMany({
    where: {
      nameNormalized: {
        startsWith: query
      }
    },
    orderBy: { nameNormalized: "asc" },
    take: 20,
    select: { id: true, name: true, nameNormalized: true }
  });
  return NextResponse.json(teams);
}
