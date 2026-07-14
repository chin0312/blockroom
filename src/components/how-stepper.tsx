"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./icons";

const steps = [
  {
    title: "Connect identity",
    short: "Wallet",
    icon: "wallet" as IconName,
    description: "Connect MetaMask and confirm Monad Testnet. No profile is created behind the scenes.",
    signal: "Wallet address + network",
  },
  {
    title: "Choose a context",
    short: "Room",
    icon: "group" as IconName,
    description: "Pick a learning, co-working, or hackathon room. Every prototype room begins empty.",
    signal: "Room type + honest state",
  },
  {
    title: "Accumulate focus time",
    short: "30 minutes",
    icon: "timer" as IconName,
    description: "Start the timer. It advances only while the matching room page is open and the tab is visible.",
    signal: "Visible-room seconds",
  },
  {
    title: "Create a local record",
    short: "Local proof",
    icon: "check" as IconName,
    description: "After 30 minutes, completion creates a real local browser record for this MVP demo.",
    signal: "Timestamp + duration + room",
  },
  {
    title: "Write on-chain in Phase 3",
    short: "Monad",
    icon: "cube" as IconName,
    description: "The eligible action will call checkIn(), wait for confirmation, then refresh the real contract count.",
    signal: "Transaction receipt + count",
  },
];

export function HowStepper() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  return (
    <div className="how-stepper">
      <div className="step-rail" role="tablist" aria-label="How BlockRoom works">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls="how-step-panel"
            className={activeIndex === index ? "rail-step active" : "rail-step"}
            onClick={() => setActiveIndex(index)}
          >
            <span className="rail-number">{String(index + 1).padStart(2, "0")}</span>
            <span>{step.short}</span>
          </button>
        ))}
      </div>
      <div className="step-detail" id="how-step-panel" role="tabpanel">
        <div className="step-detail-copy">
          <span className="section-label">Step {activeIndex + 1} of {steps.length}</span>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
          <div className="signal-row">
            <span>What the interface proves</span>
            <strong>{active.signal}</strong>
          </div>
          <div className="step-actions">
            {activeIndex > 0 && (
              <button className="button button-secondary" type="button" onClick={() => setActiveIndex(activeIndex - 1)}>
                Previous
              </button>
            )}
            {activeIndex < steps.length - 1 ? (
              <button className="button button-primary" type="button" onClick={() => setActiveIndex(activeIndex + 1)}>
                Next step <Icon name="arrow" size={18} />
              </button>
            ) : (
              <Link className="button button-primary" href="/rooms">Explore rooms <Icon name="arrow" size={18} /></Link>
            )}
          </div>
        </div>
        <div className="step-schematic" aria-hidden="true">
          <span className="schematic-index">{String(activeIndex + 1).padStart(2, "0")}</span>
          <div className="schematic-ring ring-outer" />
          <div className="schematic-ring ring-inner" />
          <div className="schematic-icon"><Icon name={active.icon} size={38} /></div>
          <div className="schematic-line" />
          <span className="schematic-signal">{active.signal}</span>
        </div>
      </div>
    </div>
  );
}
