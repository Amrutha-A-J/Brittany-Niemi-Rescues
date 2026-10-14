import type { ApplicationStatus, ApplicationType } from "@/lib/types";

export const APPLICATION_TABS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "meet_scheduled", label: "Meet & greets" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export const applicationListMeta: Record<ApplicationType, { title: string; description: string; href: string }> = {
  adopt: {
    title: "Adoption applications",
    description: "People applying to adopt a cat.",
    href: "/admin/applications/adopt",
  },
  foster: {
    title: "Foster applications",
    description: "People offering to foster.",
    href: "/admin/applications/foster",
  },
};
