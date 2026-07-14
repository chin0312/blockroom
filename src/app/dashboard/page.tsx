import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="page-enter inner-page page-frame dashboard-page">
      <header className="dashboard-header product-dashboard-header">
        <div>
          <span className="section-label">Wallet-scoped local activity</span>
          <h1>Your focus record.</h1>
        </div>
        <p>
          Every value comes from eligible sessions completed by the connected
          wallet in this browser. Nothing here is sample data.
        </p>
      </header>
      <DashboardClient />
    </div>
  );
}
