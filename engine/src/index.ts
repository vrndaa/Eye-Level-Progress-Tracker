// Public surface of the engine.
export * from "./types.ts";
export { parseTitle } from "./parser.ts";
export { generateTitle } from "./generator.ts";
export * as curriculum from "./curriculum.ts";
export { suggestNext } from "./position.ts";
export type { HistoryItem, Suggestion } from "./position.ts";

// Application layer (fake-student + session, the seam under the future UI/Google).
export { TRACK_INFO, enrolledSubjects } from "./tracks.ts";
export { FakeClassroomSource } from "./fakeClassroom.ts";
export type { ClassroomSource, ClassroomPost, LogMetadata } from "./source.ts";
export { buildSession, logWork, logSuggestedNext } from "./session.ts";
export type { SessionView, TrackSession, LogRequest } from "./session.ts";
