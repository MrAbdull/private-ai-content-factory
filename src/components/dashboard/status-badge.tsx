import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/types";

const STATUS_MAP: Record<ContentStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  generating: { label: "Generating", variant: "warning" },
  review: { label: "Review", variant: "warning" },
  scheduled: { label: "Scheduled", variant: "default" },
  published: { label: "Published", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const config = STATUS_MAP[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
