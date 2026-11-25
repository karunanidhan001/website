import { Boxes } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function AssetsPage() {
  return (
    <PagePlaceholder
      title="Assets"
      description="Browse and manage every registered product and its warranty status."
      icon={Boxes}
    />
  );
}
