import { STATUS_CLASSES, STATUS_LABELS } from "@/lib/labels";

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_CLASSES[status] || "text-bg-secondary"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
