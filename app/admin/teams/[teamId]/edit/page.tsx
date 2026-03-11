import Link from "next/link";
import { redirect } from "next/navigation";
import RosterEditor from "../../../../../components/RosterEditor";
import { getAdminSessionFromCookies } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export default async function AdminTeamEditPage({
  params
}: {
  params: { teamId: string };
}) {
  const adminSession = getAdminSessionFromCookies();
  if (!adminSession) {
    redirect("/admin/login");
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
    redirect("/admin/teams");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-ira-navy/20 bg-blue-50 px-3 py-2 text-xs font-semibold text-ira-navy">
        Admin Mode
      </div>
      <div className="flex gap-4 text-sm">
        <Link href="/admin/teams" className="text-ira-navy underline">
          Back to teams
        </Link>
        <Link href={`/admin/teams/${team.id}/products`} className="text-ira-navy underline">
          Configure Products
        </Link>
      </div>

      <RosterEditor
        teamId={team.id}
        teamName={team.name}
        rosterTemplate={team.rosterTemplate}
        sharePin={team.sharePin}
        allowEditExisting
        saveEndpoint={`/api/admin/teams/${team.id}/save`}
        enabledProducts={team.enabledProducts}
        initialRosterName={team.rosterName}
        initialPlayers={team.players.map((p) => ({
          id: p.id,
          name: p.name,
          jerseyNumber: p.jerseyNumber,
          gender: p.gender,
          sleeveType: p.sleeveType,
          sizeUS: p.sizeUS,
          playingTShirtQty: p.playingTShirtQty,
          trousersSizeUS: p.trousersSizeUS,
          trousersQty: p.trousersQty,
          trainingTShirtSizeUS: p.trainingTShirtSizeUS,
          trainingTShirtQty: p.trainingTShirtQty,
          shortsSizeUS: p.shortsSizeUS,
          shortsQty: p.shortsQty,
          jacketSizeUS: p.jacketSizeUS,
          jacketQty: p.jacketQty,
          travelTrousersSizeUS: p.travelTrousersSizeUS,
          travelTrousersQty: p.travelTrousersQty,
          sleevelessJacketSizeUS: p.sleevelessJacketSizeUS,
          sleevelessJacketQty: p.sleevelessJacketQty,
          hoodieSizeUS: p.hoodieSizeUS,
          hoodieQty: p.hoodieQty,
          travelPoloSizeUS: p.travelPoloSizeUS,
          travelPoloQty: p.travelPoloQty,
          hatQty: p.hatQty,
          capQty: p.capQty
        }))}
      />
    </div>
  );
}
