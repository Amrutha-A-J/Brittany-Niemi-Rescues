import Link from "next/link";
import { DemoFosters } from "@/components/demo/DemoFosters";
import { FosterList } from "@/components/admin/Fosters";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { isDemo } from "@/lib/demo/config";
import type { FosterWithPlacements } from "@/lib/types";

export const metadata = { title: "Fosters" };

const fostersHeader = (
  <PageHeader
    title="Fosters"
    description="Everyone who fosters for the rescue, and every cat they've taken in."
    actions={
      <Link href="/admin/fosters/new" className="btn-primary">
        + Add a foster
      </Link>
    }
  />
);

export default async function FostersPage() {
  if (isDemo) return <DemoFosters />;
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("fosters").select("*, foster_placements(*)").order("name");
  return (
    <>
      {fostersHeader}
      <FosterList fosters={(data ?? []) as FosterWithPlacements[]} />
    </>
  );
}
