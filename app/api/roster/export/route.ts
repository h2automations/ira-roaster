import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionFromCookies } from "../../../../lib/auth";
import { buildRosterWorkbook } from "../../../../lib/excel";

export async function GET(_req: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await prisma.team.findUnique({
    where: { id: session.teamId },
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
      "Content-Disposition": 'attachment; filename="team-roster.xlsx"'
    }
  });
}
