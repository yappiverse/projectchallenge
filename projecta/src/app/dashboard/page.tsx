import { listIncidentRecords } from "@/lib/incident/storage";
import IncidentDashboard from "@/components/dashboard/IncidentDashboard";
import ThemeSelector from "@/components/theme/ThemeSelector";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const incidents = await listIncidentRecords(25);

  return (
    <main className="page-bg min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto w-full max-w-full px-4 pb-16 pt-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="space-y-8">
          <div className="sticky top-4 z-30 flex justify-center sm:justify-end">
            <ThemeSelector />
          </div>
          <IncidentDashboard incidents={incidents} />
        </div>
      </div>
    </main>
  );
}
