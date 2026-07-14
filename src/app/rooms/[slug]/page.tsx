import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { RoomSessionPanel } from "@/components/room-session-panel";
import { RoomVisual } from "@/components/room-visual";
import { getRoom, rooms } from "@/lib/rooms";

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export default async function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  return (
    <div className="page-enter room-detail-page page-frame">
      <div className="room-breadcrumb">
        <Link href="/rooms"><Icon name="arrow" size={17} /> All rooms</Link>
        <span>/</span><span>{room.name}</span>
      </div>
      <header className="room-detail-hero">
        <div className="room-detail-copy">
          <div className="directory-meta">
            <span className="type-pill">{room.type}</span>
            <span className="empty-pill"><Icon name="empty" size={15} /> Empty room</span>
          </div>
          <h1>{room.name}</h1>
          <p>{room.description}</p>
          <div className="room-intention"><span>Suggested use</span><strong>{room.intention}</strong></div>
        </div>
        <RoomVisual room={room} />
      </header>
      <section className="empty-room-state">
        <div>
          <span className="section-label">Current room state</span>
          <h2>You are the only person here.</h2>
          <p>
            That is intentional. Real-time presence is not built yet, so the
            interface shows a useful empty state instead of fictional learners.
          </p>
        </div>
        <div className="empty-seat-map" aria-hidden="true">
          <span className="seat-map-line" />
          <span className="seat-marker marker-one" />
          <span className="seat-marker marker-two" />
          <span className="seat-marker marker-three" />
          <span className="you-marker">YOU</span>
        </div>
      </section>
      <RoomSessionPanel room={room} />
    </div>
  );
}
