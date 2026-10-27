import { icsFile } from "@/lib/calendar";
import { meetingEvent, type MeetingRow } from "@/lib/admin/meetings";
import { assertStaff } from "@/lib/admin/session";
import { MEETING_SQL, first, toMeeting } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/admin/meetings/[id]/ics">) {
  const { id } = await ctx.params;
  await assertStaff();
  const data = await first(`${MEETING_SQL} where m.id = ?`, id);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(icsFile(meetingEvent(toMeeting(data) as MeetingRow)), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="meet-and-greet.ics"`,
    },
  });
}
