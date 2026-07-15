"use client";

import { useState } from "react";
import Link from "next/link";
import { UsersThree } from "@phosphor-icons/react";
import { useRoomOccupancy } from "@/hooks/use-room-occupancy";
import { rooms, type RoomType } from "@/lib/rooms";
import { Icon } from "./icons";
import { RoomVisual } from "./room-visual";

type Filter = "All" | RoomType;
const filters: Filter[] = ["All", "Learning", "Co-working", "Hackathon"];

export function RoomDirectory() {
  const [filter, setFilter] = useState<Filter>("All");
  const { counts } = useRoomOccupancy(rooms.map((room) => room.slug));
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
        {visibleRooms.map((room) => {
          const liveCount = counts[room.slug] ?? 0;
          const isFull = liveCount >= room.capacity;
          return <Link className={isFull ? "directory-card full" : "directory-card"} href={`/rooms/${room.slug}`} key={room.slug}>
            <RoomVisual room={room} />
            <div className="directory-content">
              <div className="directory-meta">
                <span className="type-pill">{room.type}</span>
                <span className={isFull ? "open-pill full" : "open-pill"}>
                  <UsersThree size={15} /> {liveCount}/{room.capacity} live
                </span>
              </div>
              <span className="room-index">R-{String(rooms.indexOf(room) + 1).padStart(2, "0")}</span>
              <h2>{room.name}</h2>
              <p>{room.description}</p>
              <span className="card-link">{isFull ? "View full room" : "Enter room"} <Icon name="arrow" size={18} /></span>
            </div>
          </Link>;
        })}
      </div>
    </>
  );
}
