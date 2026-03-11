import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { buildRosterWorkbook } from "../../../../../../lib/excel";

export async function GET(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  const adminSession = getAdminSessionFromCookies();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await prisma.team.findFirst({
    where: {
      id: params.teamId,
      managerEmail: {
        equals: adminSession.email,
        mode: "insensitive"
      }
    },
    include: { players: { orderBy: { createdAt: "asc" } } }
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const buffer = await buildRosterWorkbook({
    team,
    players: team.players
  });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${team.name}-roster.xlsx"`
    }
  });
}
