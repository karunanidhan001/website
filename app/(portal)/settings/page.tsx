import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Company profile, branding, and notification preferences."
      icon={Settings}
    />
  );
}
