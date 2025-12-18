import { listIncidentRecords } from "@/lib/incident/storage";
import IncidentDashboard from "@/components/dashboard/IncidentDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const incidents = await listIncidentRecords(25);

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
        <IncidentDashboard incidents={incidents} />
      </div>
    </main>
  );
}
