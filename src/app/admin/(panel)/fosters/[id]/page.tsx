import { notFound } from "next/navigation";
import { DemoFoster } from "@/components/demo/DemoFosters";
import { FosterDetail } from "@/components/admin/Fosters";
import { addPlacement, deleteFoster, endPlacement, removePlacement, updateFoster } from "@/lib/admin/foster-actions";
import { requireStaff } from "@/lib/admin/session";
import { FOSTER_SQL, all, first, toFoster } from "@/lib/db";
import { isDemo } from "@/lib/demo/config";

export const metadata = { title: "Foster" };

/**
 * The static demo has one page per screen; the record id comes from `?id=`.
 * Only the demo defines this: with it, the live site would treat the page as static
 * and fail when the login check reads the session cookie.
 */
export const generateStaticParams = isDemo ? async () => [{ id: "_" }] : undefined;

export default async function FosterPage({ params }: PageProps<"/admin/fosters/[id]">) {
  const { id } = await params;
  if (isDemo) return <DemoFoster id={id} />;
  await requireStaff();
  const [data, cats] = await Promise.all([
    first(`${FOSTER_SQL} where f.id = ?`, id),
    all<{ id: string; name: string }>("select id, name from cats where status != 'adopted' order by name"),
  ]);
  if (!data) notFound();
  return (
    <FosterDetail
      foster={toFoster(data)}
      cats={cats}
      actions={{ save: updateFoster, addPlacement, endPlacement, removePlacement, remove: deleteFoster }}
    />
  );
}
