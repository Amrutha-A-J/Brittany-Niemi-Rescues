import { CatForm } from "@/components/admin/CatForm";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Add a cat" };

export default function NewCatPage() {
  return (
    <>
      <PageHeader title="Add a cat" back={{ href: "/admin/cats", label: "Cats" }} />
      <CatForm />
    </>
  );
}
