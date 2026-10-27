import { DemoCatEditor } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import { CatForm } from "@/components/admin/CatForm";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { toCatView, toPickerCat } from "@/lib/cats";
import { CAT_SQL, all, toCat } from "@/lib/db";

export const metadata = { title: "Add a cat" };

export default async function NewCatPage() {
  if (isDemo) return <DemoCatEditor />;
  await requireStaff();
  const otherCats = (await all(`${CAT_SQL} where c.status != 'adopted' order by c.name`)).map((r) => toPickerCat(toCatView(toCat(r))));
  return (
    <>
      <PageHeader title="Add a cat" back={{ href: "/admin/cats", label: "Cats" }} />
      <CatForm otherCats={otherCats} />
    </>
  );
}
