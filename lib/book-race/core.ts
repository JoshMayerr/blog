import { randomUUID, timingSafeEqual } from "node:crypto";
import { RaceError } from "../race/core";
import { bookInfo } from "./book";
export { RaceError };
export type Phase = "lobby" | "running" | "finished";
export type Finding = {
  id: string;
  label: string;
  value: string;
  unit: string;
  page: number;
  excerpt?: string;
  createdAt: number;
};
export type Submission = {
  answer: string;
  explanation: string;
  citations: number[];
  submittedAt: number;
  grading: "correct" | "incorrect";
};
export type Event = {
  id: string;
  participantId: string;
  at: number;
  operation: string;
  message: string;
  page?: number;
  query?: string;
};
export type Participant = {
  id: string;
  name: string;
  interface: string;
  token: string;
  joinedAt: number;
  currentPage: number;
  lastAction: string;
  findings: Finding[];
  submission: Submission | null;
  requests: Record<string, { fingerprint: string; result: unknown }>;
};
export type ParticipantView = Omit<Participant, "token" | "requests">;
export type Session = {
  id: string;
  createdAt: number;
  phase: Phase;
  startedAt: number | null;
  endedAt: number | null;
  revealed: boolean;
  participants: Participant[];
  events: Event[];
};
export function freshSession(): Session {
  return {
    id: randomUUID(),
    createdAt: Date.now(),
    phase: "running",
    startedAt: null,
    endedAt: null,
    revealed: true,
    participants: [],
    events: [],
  };
}
export function participantView(p: Participant): ParticipantView {
  const { token: _token, requests: _requests, ...view } = p;
  void _token;
  void _requests;
  return view;
}
export function sessionView(s: Session, p?: Participant) {
  return {
    sessionId: s.id,
    phase: s.phase,
    createdAt: s.createdAt,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    revealed: s.revealed,
    task: null,
    book: p ? bookInfo() : null,
    participant: p ? participantView(p) : null,
  };
}
export type SessionView = ReturnType<typeof sessionView>;
export function publicSession(s: Session) {
  return {
    ...sessionView(s),
    participants: s.participants.map(participantView),
    events: s.events,
  };
}
export type PublicSession = ReturnType<typeof publicSession>;
export function authenticate(
  s: Session,
  participantId?: string,
  token?: string,
) {
  const p = s.participants.find((x) => x.id === participantId);
  if (
    !p ||
    !token ||
    Buffer.byteLength(token) !== Buffer.byteLength(p.token) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(p.token))
  )
    throw new RaceError(403, "Invalid participant credentials.");
  return p;
}
export function assertSession(s: Session, id?: string) {
  if (s.id !== id)
    throw new RaceError(
      409,
      "The session has been reset. Register in the current session again.",
    );
}
export function addEvent(
  s: Session,
  p: Participant,
  operation: string,
  message: string,
  details: { page?: number; query?: string } = {},
) {
  p.lastAction = message;
  s.events.push({
    id: randomUUID(),
    participantId: p.id,
    at: Date.now(),
    operation,
    message,
    ...details,
  });
  if (s.events.length > 2000) s.events.splice(0, s.events.length - 2000);
}
