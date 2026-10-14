import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicantOption } from "@/components/admin/AdoptionForm";

const statusLabel: Record<string, string> = { approved: "approved", meet_scheduled: "meet & greet", new: "new", rejected: "rejected" };

/** Applications to pick an adopter from: this cat's first, approved first. */
export async function applicantOptions(supabase: SupabaseClient, catId: string): Promise<ApplicantOption[]> {
  const { data } = await supabase
    .from("applications")
    .select("id, name, email, phone, city, status, cat_id, cats(name)")
    .eq("type", "adopt")
    .or(`cat_id.eq.${catId},status.eq.approved`)
    .order("created_at", { ascending: false })
    .limit(100);
  const rank = (a: { cat_id: string | null; status: string }) => (a.cat_id === catId ? 0 : 2) + (a.status === "approved" ? 0 : 1);
  return (data ?? [])
    .sort((a, b) => rank(a) - rank(b))
    .map((a) => {
      const cat = (Array.isArray(a.cats) ? a.cats[0] : a.cats) as { name: string } | null;
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        city: a.city,
        label: `${a.name} (${statusLabel[a.status]}${cat && a.cat_id !== catId ? `, applied for ${cat.name}` : ""})`,
      };
    });
}
