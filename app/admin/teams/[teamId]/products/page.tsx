import Link from "next/link";
import { redirect } from "next/navigation";
import AdminTeamProductsEditor from "../../../../../components/AdminTeamProductsEditor";
import { getAdminSessionFromCookies } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export default async function AdminTeamProductsPage({
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
    select: {
      id: true,
      name: true,
      sharePin: true,
      enabledProducts: true
    }
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
        <Link href={`/admin/teams/${team.id}/edit`} className="text-ira-navy underline">
          Edit Roster
        </Link>
        <Link href="/roster" className="text-ira-navy underline">
          Back to Home
        </Link>
      </div>
      <AdminTeamProductsEditor
        teamId={team.id}
        teamName={team.name}
        sharePin={team.sharePin}
        initialEnabledProducts={team.enabledProducts}
      />
    </div>
  );
}
