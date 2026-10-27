import { DemoCatEditor } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import { CatForm } from "@/components/admin/CatForm";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { all } from "@/lib/db";

export const metadata = { title: "Add a cat" };

export default async function NewCatPage() {
  if (isDemo) return <DemoCatEditor />;
  await requireStaff();
  const otherCats = await all<{ id: string; name: string }>("select id, name from cats where status != 'adopted'");
  return (
    <>
      <PageHeader title="Add a cat" back={{ href: "/admin/cats", label: "Cats" }} />
      <CatForm otherCats={otherCats} />
    </>
  );
}
