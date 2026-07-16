import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="page-enter inner-page page-frame dashboard-page">
      <header className="dashboard-header product-dashboard-header">
        <div>
          <span className="section-label">Wallet-scoped on-chain activity</span>
          <h1>Your focus record.</h1>
        </div>
        <p>
          Confirmed values come from the BlockRoom contract. They are
          wallet-signed self-attestations, not blockchain proof of productivity.
        </p>
      </header>
      <DashboardClient />
    </div>
  );
}
