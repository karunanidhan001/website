import { ScrollText } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function AuditLogPage() {
  return (
    <PagePlaceholder
      title="Audit log"
      description="Every action taken on this company's data, who did it, and when."
      icon={ScrollText}
    />
  );
}
