"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export function SessionAction() {
  const { isConnected } = useAccount();
  const [message, setMessage] = useState("");

  function handleCompleteSession() {
    // TODO(Phase 3): Replace this placeholder with the BlockRoomCheckIn
    // contract write and wait for the Monad Testnet transaction receipt.
    setMessage(
      "Contract connection arrives in Phase 3. No transaction was sent.",
    );
  }

  return (
    <div className="session-action">
      <button
        type="button"
        className="button button-primary session-button"
        onClick={handleCompleteSession}
        disabled={!isConnected}
      >
        Complete Learning Session
      </button>
      <p className="action-helper" aria-live="polite">
        {message ||
          (isConnected
            ? "Phase 1 preview — this will not send a transaction yet."
            : "Connect your wallet to preview this action.")}
      </p>
    </div>
  );
}
