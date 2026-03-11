import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getSessionFromCookies } from "../../../lib/auth";
import RosterEditor from "../../../components/RosterEditor";

export default async function EditRosterPage() {
  const session = getSessionFromCookies();
  if (!session) {
    redirect("/roster/update");
  }

  const team = await prisma.team.findUnique({
    where: { id: session.teamId },
    include: { players: { orderBy: { createdAt: "asc" } } }
  });

  if (!team) {
    redirect("/roster/update");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <Link href="/roster" className="text-ira-navy underline">
          Back to Home
        </Link>
        <Link href="/roster/update" className="text-ira-navy underline">
          Back to Team Login
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-ira-navy mb-1">
          Edit Roster
        </h1>
        <p className="text-sm text-slate-600">
          Team: <span className="font-medium">{team.name}</span>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Need to add or remove product categories? Contact the Team Manager to
          update product settings in Admin.
        </p>
      </div>
      <RosterEditor
        teamId={team.id}
        teamName={team.name}
        rosterTemplate={team.rosterTemplate}
        sharePin={team.sharePin}
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
