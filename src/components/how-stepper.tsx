"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName } from "./icons";
import { AmbientModule } from "./ambient-module";

const steps = [
  {
    title: "Connect identity",
    short: "Wallet",
    icon: "wallet" as IconName,
    description: "Choose a supported wallet and EVM network through Reown AppKit. No profile is created behind the scenes.",
    signal: "Wallet address + network",
  },
  {
    title: "Choose a context",
    short: "Room",
    icon: "group" as IconName,
    description: "Pick a room and explicitly join its presence channel. Only connected wallets that join become visible.",
    signal: "Real joined wallet presence",
  },
  {
    title: "Accumulate focus time",
    short: "30 minutes",
    icon: "timer" as IconName,
    description: "Joining starts the timer automatically. It keeps advancing while you remain joined, so research, coding, and coursework in other tabs still count.",
    signal: "Joined-room elapsed time",
  },
  {
    title: "Create wallet activity",
    short: "Local proof",
    icon: "check" as IconName,
    description: "When you leave after 30 minutes, choose whether to save the exact duration as a wallet-scoped browser record.",
    signal: "Wallet + timestamp + duration + room",
  },
  {
    title: "Sign a demo badge",
    short: "Signature",
    icon: "shield" as IconName,
    description: "Eligible badges request a real wallet message signature. The signed receipt stays local and is not an NFT.",
    signal: "Wallet signature + local receipt",
  },
];

export function HowStepper() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
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
        <motion.div
          className="step-detail-copy"
          key={`${active.title}-copy`}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
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
        </motion.div>
        <motion.div
          className="step-schematic"
          key={`${active.title}-schematic`}
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="schematic-index">{String(activeIndex + 1).padStart(2, "0")}</span>
          <AmbientModule
            variant={activeIndex === 0 ? "identity" : activeIndex === 1 ? "room" : activeIndex === 2 ? "time" : activeIndex === 3 ? "proof" : "signature"}
            size="panel"
          />
          <span className="schematic-signal">{active.signal}</span>
        </motion.div>
      </div>
    </div>
  );
}
