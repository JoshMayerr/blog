import type { RoomState, ObjectId } from "@/lib/race/core";

/** Public room flags only. No puzzle contents or inferred agent locations. */
export function RoomMap({
  room,
  target,
  failed = false,
}: {
  room: RoomState;
  target?: ObjectId;
  failed?: boolean;
}) {
  return (
    <svg
      className="escape-room-map"
      viewBox="0 0 480 280"
      role="img"
      aria-label={`Room: note ${room.deskRead ? "read" : "unread"}, books ${room.booksRead ? "inspected" : "uninspected"}, cabinet ${room.cabinetOpen ? "open" : "locked"}, key ${room.hasKey ? "collected" : "not collected"}, exit ${room.doorOpen ? "open" : "locked"}`}
    >
      <rect
        className="room-floor"
        x="14"
        y="14"
        width="452"
        height="252"
        rx="12"
      />
      <path
        className="room-grid"
        d="M14 77H466M14 140H466M14 203H466M104 14V266M194 14V266M284 14V266M374 14V266"
      />
      {target && (
        <rect
          className={`room-action-target ${failed ? "failed" : ""}`}
          {...{
            desk: { x: 31, y: 32, width: 136, height: 108 },
            bookshelf: { x: 31, y: 157, width: 136, height: 94 },
            cabinet: { x: 280, y: 29, width: 115, height: 111 },
            door: { x: 396, y: 145, width: 66, height: 119 },
          }[target]}
          rx="10"
        />
      )}
      <g className={`room-item ${room.deskRead ? "complete" : ""}`}>
        <rect x="40" y="42" width="118" height="58" rx="7" />
        <path d="M50 101V114M148 101V114" />
        <rect x="79" y="52" width="40" height="37" rx="3" />
        <path d="M88 63H110M88 72H105M88 81H109" />
        <text x="99" y="133">
          {room.deskRead ? "Note read ✓" : "Desk · unread"}
        </text>
      </g>
      <g className={`room-item ${room.booksRead ? "complete" : ""}`}>
        <rect x="40" y="170" width="118" height="51" rx="5" />
        <path d="M49 213H148M54 180V210M64 184V210M75 178V210M86 182V210M97 179V210M110 182L118 210M130 179V210M141 184V210" />
        <text x="99" y="242">
          {room.booksRead ? "Books inspected ✓" : "Books · uninspected"}
        </text>
      </g>
      <g className={`room-item ${room.cabinetOpen ? "complete" : ""}`}>
        <rect x="289" y="39" width="96" height="61" rx="5" />
        {room.cabinetOpen ? (
          <>
            <path d="M290 40L313 51V113L290 99ZM338 40V98" />
            {!room.hasKey && (
              <>
                <path d="M350 71H373M358 71V79" />
                <circle cx="346" cy="71" r="5" />
              </>
            )}
          </>
        ) : (
          <>
            <path d="M337 40V98" />
            <circle cx="329" cy="69" r="2" />
            <circle cx="346" cy="69" r="2" />
          </>
        )}
        <text x="337" y="133">
          {room.cabinetOpen ? "Cabinet open ✓" : "Cabinet · locked"}
        </text>
      </g>
      <g className={`room-item room-exit ${room.doorOpen ? "complete" : ""}`}>
        <rect x="405" y="155" width="44" height="76" rx="3" />
        {room.doorOpen ? (
          <>
            <path d="M406 156L430 170V245L406 230Z" />
            <path d="M441 191H459M453 185L459 191L453 197" />
          </>
        ) : (
          <circle cx="437" cy="195" r="2" />
        )}
        <text x="427" y="258">
          {room.doorOpen ? "Escaped!" : "Exit"}
        </text>
      </g>
      <g className={`room-item ${room.hasKey ? "complete" : ""}`}>
        <rect x="233" y="183" width="104" height="46" rx="23" />
        <circle cx="265" cy="205" r="8" />
        <path d="M273 205H307M297 205V212M306 205V211" />
        <text x="285" y="250">
          {room.hasKey ? "Key collected ✓" : "No key yet"}
        </text>
      </g>
      <g className={`room-status ${room.doorOpen ? "complete" : ""}`}>
        <circle cx="224" cy="126" r="23" />
        {room.doorOpen ? (
          <path d="M214 126L221 133L235 118" />
        ) : (
          <>
            <rect x="212" y="118" width="24" height="18" rx="5" />
            <path d="M224 118V113M218 125V128M230 125V128" />
          </>
        )}
        <text x="224" y="165">
          {room.doorOpen ? "ESCAPED" : "IN ROOM"}
        </text>
      </g>
    </svg>
  );
}
