import { Sidebar } from "@/components/portal/sidebar";
import { Topbar } from "@/components/portal/topbar";
import { PortalGate } from "@/components/portal/portal-gate";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGate>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </PortalGate>
  );
}
