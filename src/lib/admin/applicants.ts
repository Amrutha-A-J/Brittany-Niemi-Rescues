import "server-only";
import type { ApplicantOption } from "@/components/admin/AdoptionForm";
import { all } from "@/lib/db";

const statusLabel: Record<string, string> = { approved: "approved", meet_scheduled: "meet & greet", new: "new", rejected: "rejected" };

/** Applications to pick an adopter from: this cat's first, approved first. */
export async function applicantOptions(catId: string): Promise<ApplicantOption[]> {
  const data = await all<{ id: string; name: string; email: string; phone: string; city: string; status: string; cat_id: string | null; cat_name: string | null; for_this_cat: number }>(
    `select a.id, a.name, a.email, a.phone, a.city, a.status, a.cat_id, c.name as cat_name,
       exists (select 1 from application_cats x where x.application_id = a.id and x.cat_id = ?) as for_this_cat
     from applications a left join cats c on c.id = a.cat_id
     where a.type = 'adopt' and (for_this_cat or a.status = 'approved')
     order by a.created_at desc limit 100`,
    catId,
  );
  const rank = (a: { for_this_cat: number; status: string }) => (a.for_this_cat ? 0 : 2) + (a.status === "approved" ? 0 : 1);
  return data
    .sort((a, b) => rank(a) - rank(b))
    .map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      city: a.city,
      label: `${a.name} (${statusLabel[a.status]}${a.cat_name && !a.for_this_cat ? `, applied for ${a.cat_name}` : ""})`,
    }));
}
