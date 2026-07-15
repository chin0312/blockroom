"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName } from "./icons";
import { AmbientModule } from "./ambient-module";

const concepts = [
  {
    id: "identity",
    label: "Wallet identity",
    icon: "wallet" as IconName,
    title: "One address. No invented profile.",
    description:
      "BlockRoom uses a connected wallet as the only identity layer. Until a wallet connects, the interface stays honestly anonymous.",
    points: ["No username database", "Address shown only after connection", "Current EVM network is explicit"],
  },
  {
    id: "rooms",
    label: "Focus rooms",
    icon: "group" as IconName,
    title: "A room is a context, not a crowd counter.",
    description:
      "Rooms are real-time contexts. Presence appears only after a connected wallet explicitly joins, and disappears when that client leaves.",
    points: ["Supabase Presence", "Live status controls", "No fake participants"],
  },
  {
    id: "proof",
    label: "Session proof",
    icon: "shield" as IconName,
    title: "Time first. Proof second.",
    description:
      "A session starts when the wallet joins and keeps time while that room connection remains active. After 30 minutes, the leave prompt can save it to Dashboard activity.",
    points: ["Work across browser tabs", "Many sessions per day", "Browser-local records are labelled local"],
  },
];

export function AboutExplorer() {
  const [activeId, setActiveId] = useState(concepts[0].id);
  const reduceMotion = useReducedMotion();
  const active = concepts.find((concept) => concept.id === activeId) ?? concepts[0];

  return (
    <section className="concept-explorer" aria-label="Explore BlockRoom concepts">
      <div className="concept-tabs" role="tablist" aria-label="BlockRoom concepts">
        {concepts.map((concept) => (
          <button
            key={concept.id}
            type="button"
            role="tab"
            aria-selected={active.id === concept.id}
            aria-controls="concept-panel"
            className={active.id === concept.id ? "concept-tab active" : "concept-tab"}
            onClick={() => setActiveId(concept.id)}
          >
            <span className="tab-index">0{concepts.indexOf(concept) + 1}</span>
            <Icon name={concept.icon} size={20} />
            <span>{concept.label}</span>
          </button>
        ))}
      </div>

      <div className="concept-panel" id="concept-panel" role="tabpanel">
        <motion.div
          className="concept-copy"
          key={`${active.id}-copy`}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="section-label">{active.label}</span>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
          <ul className="check-list">
            {active.points.map((point) => (
              <li key={point}><Icon name="check" size={18} /> {point}</li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          className={`concept-diagram concept-diagram-${active.id}`}
          key={`${active.id}-diagram`}
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          <AmbientModule
            variant={active.id === "identity" ? "identity" : active.id === "proof" ? "proof" : "room"}
            size="panel"
          />
          <span className="diagram-caption">{active.label}</span>
        </motion.div>
      </div>
    </section>
  );
}
