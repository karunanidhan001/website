import { LayoutDashboard } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Stats, recent registrations, recent claims, and warranty activity at a glance."
      icon={LayoutDashboard}
    />
  );
}
