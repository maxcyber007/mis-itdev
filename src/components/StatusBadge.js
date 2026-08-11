import { STATUS_CLASSES, STATUS_DOT, STATUS_LABELS } from "@/lib/labels";

export default function StatusBadge({ status }) {
  const pulsing = status === "pending";

  return (
    <span className={`badge ${STATUS_CLASSES[status] || STATUS_CLASSES.cancelled}`}>
      <span className="relative flex h-1.5 w-1.5">
        {pulsing ? (
          <span
            className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full ${STATUS_DOT[status]}`}
          />
        ) : null}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            STATUS_DOT[status] || STATUS_DOT.cancelled
          }`}
        />
      </span>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
