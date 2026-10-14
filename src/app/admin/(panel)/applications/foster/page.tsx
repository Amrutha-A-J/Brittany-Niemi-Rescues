import { ApplicationsList } from "@/components/admin/ApplicationsList";
import { DemoApplications } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";

export const metadata = { title: "Foster applications" };

export default function Page({ searchParams }: PageProps<"/admin/applications/foster">) {
  if (isDemo) return <DemoApplications type="foster" />;
  return <ApplicationsList type="foster" searchParams={searchParams} />;
}
