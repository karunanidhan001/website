import { BarChart3 } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function AnalyticsPage() {
  return (
    <PagePlaceholder
      title="Analytics"
      description="Claim trends, approval rate, top-selling products, and protected asset value."
      icon={BarChart3}
    />
  );
}
