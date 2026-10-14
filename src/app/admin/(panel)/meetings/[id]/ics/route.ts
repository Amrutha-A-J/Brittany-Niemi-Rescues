import { icsFile } from "@/lib/calendar";
import { MEETING_SELECT, meetingEvent, type MeetingRow } from "@/lib/admin/meetings";
import { staffClient } from "@/lib/admin/session";

export async function GET(_req: Request, ctx: RouteContext<"/admin/meetings/[id]/ics">) {
  const { id } = await ctx.params;
  const supabase = await staffClient();
  const { data } = await supabase.from("meetings").select(MEETING_SELECT).eq("id", id).maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(icsFile(meetingEvent(data as MeetingRow)), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="meet-and-greet.ics"`,
    },
  });
}
