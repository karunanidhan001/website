import { Upload } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function ImportPage() {
  return (
    <PagePlaceholder
      title="Import"
      description="Bulk-import product and customer records from a spreadsheet or integration."
      icon={Upload}
    />
  );
}
