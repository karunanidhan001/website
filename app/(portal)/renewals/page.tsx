import { CalendarClock } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function RenewalsPage() {
  return (
    <PagePlaceholder
      title="Renewals"
      description="Track warranties expiring soon and manage renewal outreach."
      icon={CalendarClock}
    />
  );
}
