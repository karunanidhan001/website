import { UsersRound } from "lucide-react";
import { PagePlaceholder } from "@/components/portal/page-placeholder";

export default function TeamPage() {
  return (
    <PagePlaceholder
      title="Team"
      description="Manage who on your team has access to this company's enterprise portal."
      icon={UsersRound}
    />
  );
}
