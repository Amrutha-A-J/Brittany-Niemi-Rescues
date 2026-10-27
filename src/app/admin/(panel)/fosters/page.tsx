import Link from "next/link";
import { DemoFosters } from "@/components/demo/DemoFosters";
import { FosterList } from "@/components/admin/Fosters";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { FOSTER_SQL, all, toFoster } from "@/lib/db";
import { isDemo } from "@/lib/demo/config";

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
  await requireStaff();
  const data = await all(`${FOSTER_SQL} order by f.name`);
  return (
    <>
      {fostersHeader}
      <FosterList fosters={data.map(toFoster)} />
    </>
  );
}
