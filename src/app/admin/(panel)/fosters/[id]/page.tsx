import { notFound } from "next/navigation";
import { DemoFoster } from "@/components/demo/DemoFosters";
import { FosterDetail } from "@/components/admin/Fosters";
import { addPlacement, deleteFoster, endPlacement, removePlacement, updateFoster } from "@/lib/admin/foster-actions";
import { requireStaff } from "@/lib/admin/session";
import { isDemo } from "@/lib/demo/config";
import type { FosterWithPlacements } from "@/lib/types";

export const metadata = { title: "Foster" };

/** The static demo has one page per screen; the record id comes from `?id=`. */
export async function generateStaticParams() {
  return isDemo ? [{ id: "_" }] : [];
}

export default async function FosterPage({ params }: PageProps<"/admin/fosters/[id]">) {
  const { id } = await params;
  if (isDemo) return <DemoFoster id={id} />;
  const { supabase } = await requireStaff();
  const [{ data }, { data: cats }] = await Promise.all([
    supabase.from("fosters").select("*, foster_placements(*)").eq("id", id).maybeSingle(),
    supabase.from("cats").select("id, name").neq("status", "adopted").order("name"),
  ]);
  if (!data) notFound();
  return (
    <FosterDetail
      foster={data as FosterWithPlacements}
      cats={cats ?? []}
      actions={{ save: updateFoster, addPlacement, endPlacement, removePlacement, remove: deleteFoster }}
    />
  );
}
