"use client";

import { useState } from "react";
import { Icon, type IconName } from "./icons";

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
      "A session must accumulate 30 visible minutes in its joined room before completion unlocks and Dashboard activity changes.",
    points: ["Visible-room time only", "Many sessions per day", "Browser-local records are labelled local"],
  },
];

export function AboutExplorer() {
  const [activeId, setActiveId] = useState(concepts[0].id);
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
        <div className="concept-copy">
          <span className="section-label">{active.label}</span>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
          <ul className="check-list">
            {active.points.map((point) => (
              <li key={point}><Icon name="check" size={18} /> {point}</li>
            ))}
          </ul>
        </div>
        <div className={`concept-diagram concept-diagram-${active.id}`} aria-hidden="true">
          <div className="diagram-axis axis-x" />
          <div className="diagram-axis axis-y" />
          <div className="diagram-center"><Icon name={active.icon} size={34} /></div>
          <div className="diagram-node diagram-node-a" />
          <div className="diagram-node diagram-node-b" />
          <div className="diagram-node diagram-node-c" />
          <span className="diagram-caption">{active.label}</span>
        </div>
      </div>
    </section>
  );
}
