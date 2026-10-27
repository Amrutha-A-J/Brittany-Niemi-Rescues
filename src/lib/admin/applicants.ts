import "server-only";
import type { ApplicantOption } from "@/components/admin/AdoptionForm";
import { all } from "@/lib/db";

const statusLabel: Record<string, string> = { approved: "approved", meet_scheduled: "meet & greet", new: "new", rejected: "rejected" };

/** Applications to pick an adopter from: this cat's first, approved first. */
export async function applicantOptions(catId: string): Promise<ApplicantOption[]> {
  const data = await all<{ id: string; name: string; email: string; phone: string; city: string; status: string; cat_id: string | null; cat_name: string | null }>(
    `select a.id, a.name, a.email, a.phone, a.city, a.status, a.cat_id, c.name as cat_name
     from applications a left join cats c on c.id = a.cat_id
     where a.type = 'adopt' and (a.cat_id = ? or a.status = 'approved')
     order by a.created_at desc limit 100`,
    catId,
  );
  const rank = (a: { cat_id: string | null; status: string }) => (a.cat_id === catId ? 0 : 2) + (a.status === "approved" ? 0 : 1);
  return data
    .sort((a, b) => rank(a) - rank(b))
    .map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      city: a.city,
      label: `${a.name} (${statusLabel[a.status]}${a.cat_name && a.cat_id !== catId ? `, applied for ${a.cat_name}` : ""})`,
    }));
}
