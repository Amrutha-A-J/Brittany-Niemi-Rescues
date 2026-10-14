import { ApplicationsList } from "@/components/admin/ApplicationsList";
import { DemoApplications } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";

export const metadata = { title: "Adoption applications" };

export default function Page({ searchParams }: PageProps<"/admin/applications/adopt">) {
  if (isDemo) return <DemoApplications type="adopt" />;
  return <ApplicationsList type="adopt" searchParams={searchParams} />;
}
