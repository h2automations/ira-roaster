import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function AdminTeamsPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const adminSession = getAdminSessionFromCookies();
  if (!adminSession) {
    redirect("/admin/login");
  }

  const query = (searchParams?.q || "").trim();
  const queryNormalized = query.toLowerCase();

  const teams = await prisma.team.findMany({
    where: {
      managerEmail: {
        equals: adminSession.email,
        mode: "insensitive"
      },
      ...(query
        ? {
            nameNormalized: {
              startsWith: queryNormalized
            }
          }
        : {})
    },
    orderBy: { nameNormalized: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      managerName: true,
      managerEmail: true,
      enabledProducts: true
    }
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-ira-navy/20 bg-blue-50 px-3 py-2 text-xs font-semibold text-ira-navy">
        Admin Mode
      </div>
      <div className="flex gap-4 text-sm">
        <Link href="/roster" className="text-ira-navy underline">
          Back to Home
        </Link>
        <Link href="/admin/login" className="text-ira-navy underline">
          Back to Admin Login
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-ira-navy">Admin Teams</h1>
        <p className="text-sm text-slate-600">
          Search teams and configure enabled products.
        </p>
      </div>

      <form className="ira-card p-4 flex gap-2" action="/admin/teams" method="GET">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by team prefix"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
        />
        <button type="submit" className="ira-button-primary">Search</button>
      </form>

      <div className="ira-card p-4">
        {teams.length === 0 ? (
          <p className="text-sm text-slate-600">No teams found.</p>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-ira-navy">{team.name}</p>
                <p className="text-xs text-slate-500">
                  Manager: {team.managerName} ({team.managerEmail})
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Enabled products: {team.enabledProducts.length ? team.enabledProducts.join(", ") : "None"}
                </p>
                <Link
                  href={`/admin/teams/${team.id}/products`}
                  className="inline-block mt-2 text-sm text-ira-navy underline"
                >
                  Configure Products
                </Link>
                <span className="mx-2 text-slate-400">|</span>
                <Link
                  href={`/admin/teams/${team.id}/edit`}
                  className="inline-block mt-2 text-sm text-ira-navy underline"
                >
                  Edit Roster
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
