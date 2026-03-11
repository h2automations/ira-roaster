import Link from "next/link";
import { Suspense } from "react";

function ModalContent() {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
      <div className="ira-card max-w-md w-full p-6 relative">
        <h1 className="text-xl font-semibold text-ira-navy mb-2">
          Team Roster Management System
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Create a brand-new roster or securely update an existing team roster.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/roster/create" className="ira-button-primary w-full">
            Create New Roster
          </Link>
          <Link href="/roster/update" className="ira-button-secondary w-full">
            Update Existing Roster
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RosterEntryPage() {
  return (
    <div className="relative">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold text-ira-navy mb-3">
          Team Roster Management System
        </h2>
        <p className="text-sm text-slate-600">
          Use this tool to manage team rosters quickly and accurately.
          Anyone with the link can create a roster; existing rosters are
          protected by Team Name and PIN.
        </p>
      </div>
      <Suspense>
        <ModalContent />
      </Suspense>
    </div>
  );
}
