// src/dashboard/components/DashboardHeader.jsx

function DashboardHeader({ ownerName, onAddField }) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <h1 className="dashboard-page-title">Owner Dashboard</h1>
        <p className="dashboard-page-subtitle">
          Monitor your fields, bookings, and earnings in real-time.
        </p>
      </div>

      <div className="dashboard-header-right">
        <div className="dashboard-date-pill">{formattedDate}</div>

        <button
          className="dashboard-primary-btn"
          onClick={onAddField}
        >
          <span>＋</span>
          <span>Add New Field</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
