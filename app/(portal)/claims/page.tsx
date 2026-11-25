import { FileWarning } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function ClaimsPage() {
  return (
    <PagePlaceholder
      title="Claims"
      description="Review, approve, reject, and track warranty claims end to end."
      icon={FileWarning}
    />
  );
}
