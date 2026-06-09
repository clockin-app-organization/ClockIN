import { Badge } from "./Badge";
import type { EventStatus, SessionStatus } from "@/lib/types";

const map: Record<string, { label: string; variant: "success"|"warning"|"muted"|"danger"|"info" }> = {
  upcoming: { label: "Upcoming",  variant: "info"    },
  active:   { label: "Live",      variant: "success" },
  ended:    { label: "Ended",     variant: "muted"   },
  archived: { label: "Archived",  variant: "muted"   },
  pending:  { label: "Pending",   variant: "warning" },
};

export function StatusBadge({ status }: { status: EventStatus | SessionStatus }) {
  const { label, variant } = map[status] ?? { label: status, variant: "muted" };
  return (
    <Badge variant={variant}>
      {status === "active" && (
        <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
      )}
      {label}
    </Badge>
  );
}