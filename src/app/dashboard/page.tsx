import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="page-enter inner-page page-frame dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="section-label">Your real prototype state</span>
          <h1>Dashboard</h1>
        </div>
        <p>
          Wallet status, active focus time, and session records created in this
          browser. Local records are never presented as on-chain reputation.
        </p>
      </header>
      <DashboardClient />
    </div>
  );
}
