export type Sex = "female" | "male";
export type CatStatus = "available" | "pending" | "adopted";
export type YesNoUnknown = "yes" | "no" | "unknown";
export type CatCategory = "kitten" | "teenager" | "young-adult" | "adult" | "senior" | "special";

export type CatPhoto = {
  id: string;
  path: string;
  alt: string;
  position: number;
};

/** A row from the `cats` table with its photos. */
export type Cat = {
  id: string;
  slug: string;
  name: string;
  sex: Sex;
  birth_date: string;
  color: string;
  breed: string;
  status: CatStatus;
  special_needs: boolean;
  special_needs_notes: string;
  description: string;
  personality: string[];
  good_with_kids: YesNoUnknown;
  good_with_cats: YesNoUnknown;
  good_with_dogs: YesNoUnknown;
  spayed_neutered: boolean;
  vaccinated: boolean;
  microchipped: boolean;
  adoption_fee: number | null;
  created_at: string;
  updated_at: string;
  cat_photos: CatPhoto[];
};

/** A cat ready for display: derived fields are computed on the server. */
export type CatView = Omit<Cat, "cat_photos"> & {
  photos: { url: string; alt: string }[];
  ageMonths: number;
  ageLabel: string;
  category: CatCategory;
};

export type ApplicationType = "adopt" | "foster";
export type ApplicationStatus = "new" | "meet_scheduled" | "approved" | "rejected";

export type Application = {
  id: string;
  type: ApplicationType;
  cat_id: string | null;
  status: ApplicationStatus;
  name: string;
  email: string;
  phone: string;
  city: string;
  answers: Record<string, string | string[]>;
  admin_notes: string;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export type Meeting = {
  id: string;
  application_id: string;
  starts_at: string;
  duration_minutes: number;
  location: string;
  notes: string;
  status: MeetingStatus;
  created_at: string;
};

export type Adoption = {
  id: string;
  cat_id: string;
  application_id: string | null;
  adopted_on: string;
  adopter_name: string;
  adopter_email: string;
  adopter_phone: string;
  adopter_address: string;
  fee_paid: number | null;
  microchip_number: string;
  follow_up_on: string | null;
  notes: string;
  created_at: string;
};

export type Foster = {
  id: string;
  application_id: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  can_foster: string[];
  notes: string;
  on_break: boolean;
  created_at: string;
  updated_at: string;
};

export type FosterPlacement = {
  id: string;
  foster_id: string;
  cat_id: string | null;
  cat_name: string;
  started_on: string;
  ended_on: string | null;
  notes: string;
  created_at: string;
};

export type FosterWithPlacements = Foster & { foster_placements: FosterPlacement[] };
