import {
  BookOpen,
  DoorClosed,
  DoorOpen,
  FileText,
  KeyRound,
  LockKeyhole,
  Archive,
} from "lucide-react";
import type { RoomState } from "@/lib/race/core";
export function RoomScene({ room }: { room: RoomState }) {
  return (
    <div
      className={`escape-scene ${room.doorOpen ? "escaped" : ""}`}
      aria-label="Room status"
    >
      <div className={`escape-object ${room.deskRead ? "discovered" : ""}`}>
        <FileText aria-hidden />
        <strong>Desk</strong>
        <span>{room.deskRead ? "Note discovered" : "Unexplored"}</span>
      </div>
      <div className={`escape-object ${room.booksRead ? "discovered" : ""}`}>
        <BookOpen aria-hidden />
        <strong>Bookshelf</strong>
        <span>{room.booksRead ? "Books examined" : "Unexplored"}</span>
      </div>
      <div className={`escape-object ${room.cabinetOpen ? "discovered" : ""}`}>
        {room.cabinetOpen ? (
          <Archive aria-hidden />
        ) : (
          <LockKeyhole aria-hidden />
        )}
        <strong>Cabinet</strong>
        <span>{room.cabinetOpen ? "Open" : "Locked"}</span>
      </div>
      <div className={`escape-object ${room.hasKey ? "discovered" : ""}`}>
        <KeyRound aria-hidden />
        <strong>Inventory</strong>
        <span>{room.hasKey ? "Exit key acquired" : "Empty"}</span>
      </div>
      <div className={`escape-object ${room.doorOpen ? "discovered" : ""}`}>
        {room.doorOpen ? <DoorOpen aria-hidden /> : <DoorClosed aria-hidden />}
        <strong>Exit</strong>
        <span>{room.doorOpen ? "Escaped!" : "Locked"}</span>
      </div>
    </div>
  );
}
