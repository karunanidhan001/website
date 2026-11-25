import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function CustomersPage() {
  return (
    <PagePlaceholder
      title="Customers"
      description="Customers derived from registered products, with contact and activity history."
      icon={Users}
    />
  );
}
