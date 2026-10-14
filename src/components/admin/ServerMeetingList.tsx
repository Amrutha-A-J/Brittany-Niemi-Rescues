import { setMeetingStatus } from "@/lib/admin/application-actions";
import type { MeetingRow } from "@/lib/admin/meetings";
import { MeetingList } from "./MeetingList";

/** MeetingList wired to the real backend. */
export function ServerMeetingList({ meetings, showApplicant }: { meetings: MeetingRow[]; showApplicant?: boolean }) {
  return (
    <MeetingList
      meetings={meetings}
      showApplicant={showApplicant}
      setStatus={setMeetingStatus}
    />
  );
}
