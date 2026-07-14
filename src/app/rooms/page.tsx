import { RoomDirectory } from "@/components/room-directory";

export default function RoomsPage() {
  return (
    <div className="page-enter inner-page page-frame rooms-page">
      <header className="editorial-header room-directory-header">
        <span className="page-code">03 / ROOMS</span>
        <div>
          <span className="section-label">Choose a focus context</span>
          <h1>Four rooms.<br />Zero fake crowds.</h1>
        </div>
        <p>
          Each room is currently empty and interactive. Enter one to start your
          own 30-minute focus session; no participants are simulated.
        </p>
      </header>
      <RoomDirectory />
    </div>
  );
}
