import { DemoNewFoster } from "@/components/demo/DemoFosters";
import { FosterDetailsForm } from "@/components/admin/Fosters";
import { Card, PageHeader } from "@/components/admin/ui";
import { createFoster } from "@/lib/admin/foster-actions";
import { isDemo } from "@/lib/demo/config";

export const metadata = { title: "Add a foster" };

export default function NewFosterPage() {
  if (isDemo) return <DemoNewFoster />;
  return (
    <>
      <PageHeader
        title="Add a foster"
        description="For someone who has fostered before, or who you've arranged with directly."
        back={{ href: "/admin/fosters", label: "Fosters" }}
      />
      <Card className="max-w-xl">
        <FosterDetailsForm action={createFoster} submitLabel="Add foster" />
      </Card>
    </>
  );
}
