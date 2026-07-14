"use client";

import { useState } from "react";
import Link from "next/link";
import { rooms, type RoomType } from "@/lib/rooms";
import { Icon } from "./icons";
import { RoomVisual } from "./room-visual";

type Filter = "All" | RoomType;
const filters: Filter[] = ["All", "Learning", "Co-working", "Hackathon"];

export function RoomDirectory() {
  const [filter, setFilter] = useState<Filter>("All");
  const visibleRooms = filter === "All" ? rooms : rooms.filter((room) => room.type === filter);

  return (
    <>
      <div className="room-filter" role="group" aria-label="Filter rooms by type">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            className={filter === item ? "filter-button active" : "filter-button"}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="room-directory-grid" aria-live="polite">
        {visibleRooms.map((room, index) => (
          <Link className="directory-card" href={`/rooms/${room.slug}`} key={room.slug}>
            <RoomVisual room={room} />
            <div className="directory-content">
              <div className="directory-meta">
                <span className="type-pill">{room.type}</span>
                <span className="open-pill">Join to view live presence</span>
              </div>
              <span className="room-index">R-{String(index + 1).padStart(2, "0")}</span>
              <h2>{room.name}</h2>
              <p>{room.description}</p>
              <span className="card-link">Enter room <Icon name="arrow" size={18} /></span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
