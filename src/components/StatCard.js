export default function StatCard({ label, value, hint, accent = "primary" }) {
  return (
    <div className="card mis-stat-card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-secondary small">{label}</div>
            <div className={`mis-stat-value text-${accent}`}>{value}</div>
          </div>
        </div>
        {hint ? <div className="small text-secondary mt-2">{hint}</div> : null}
      </div>
    </div>
  );
}
