import { ApplicationsList } from "@/components/admin/ApplicationsList";
import { DemoApplications } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";

export const metadata = { title: "Adoption applications" };

/** /admin/applications shows adoption applications; foster ones live at /admin/applications/foster. */
export default function Page({ searchParams }: PageProps<"/admin/applications">) {
  if (isDemo) return <DemoApplications type="adopt" />;
  return <ApplicationsList type="adopt" searchParams={searchParams} />;
}
