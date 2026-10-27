import { icsFile } from "@/lib/calendar";
import { meetingInviteEvent, type MeetingRow } from "@/lib/admin/meetings";
import { MEETING_SQL, first, toMeeting } from "@/lib/db";

/**
 * /calendar/<meeting id>.ics: the applicant's calendar file, linked as "Add to Apple Calendar"
 * in the invite. Public, but the id is a random UUID and the file only repeats the invite email.
 */
export async function GET(_req: Request, ctx: RouteContext<"/calendar/[file]">) {
  const id = (await ctx.params).file.replace(/\.ics$/, "");
  const data = await first(`${MEETING_SQL} where m.id = ? and m.status != 'cancelled'`, id);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(icsFile(meetingInviteEvent(toMeeting(data) as MeetingRow)), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="meet-and-greet.ics"`,
      "cache-control": "private, no-store",
    },
  });
}
