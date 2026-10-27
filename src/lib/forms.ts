import type { ApplicationType } from "./types";
import { site } from "./site";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "radio" | "checkboxes";
  options?: string[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Only shown when another field has one of these values. */
  showIf?: { field: string; values: string[] };
  /** "cat" fields are shown under the cat choice instead of in the home section. */
  group?: "cat";
};

/** Contact fields stored in their own columns on `applications`. */
export const contactFields: FieldDef[] = [
  { name: "name", label: "Full name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true },
  { name: "city", label: "Town or city", type: "text", required: true, placeholder: site.city },
];

const homeFields: FieldDef[] = [
  { name: "home_type", label: "What kind of home do you live in?", type: "radio", options: ["House", "Apartment", "Condo / townhouse", "Farm / acreage", "Other"], required: true },
  { name: "own_or_rent", label: "Do you own or rent?", type: "radio", options: ["Own", "Rent"], required: true },
  { name: "landlord_ok", label: "Does your landlord allow cats?", type: "radio", options: ["Yes", "No", "Not sure"], required: true, showIf: { field: "own_or_rent", values: ["Rent"] } },
  { name: "household", label: "Who lives in your home?", type: "textarea", required: true, hint: "Number of adults, and the ages of any children." },
  { name: "other_pets", label: "Tell us about any other pets", type: "textarea", hint: "Species, age, and whether they're spayed/neutered and vaccinated. Leave blank if none." },
];

export const applicationFields: Record<ApplicationType, FieldDef[]> = {
  adopt: [
    ...homeFields,
    { name: "indoor_only", label: "Will your cat be kept indoors?", type: "radio", options: ["Yes, indoor only", "Indoor with a catio or supervised outdoor time", "Indoor/outdoor"], required: true },
    { name: "hours_alone", label: "How many hours a day would the cat usually be alone?", type: "select", options: ["Less than 4", "4–8", "8–10", "More than 10"], required: true },
    { name: "experience", label: "What experience do you have with cats?", type: "textarea", required: true },
    { name: "vet", label: "Your current or planned vet clinic", type: "text", hint: "Optional, but it helps speed things up." },
    { name: "why", label: "Why do you think this cat is a good fit for your home?", type: "textarea", required: true },
  ],
  foster: [
    {
      name: "preferences",
      label: "Any preferences?",
      type: "textarea",
      group: "cat",
      hint: "For example: kittens or adults, how many at once, or anything you'd rather not take on.",
      showIf: { field: "cat", values: [""] },
    },
    ...homeFields,
    { name: "space", label: "Where would your foster cat stay?", type: "radio", options: ["A spare room", "A bathroom or laundry room", "Free roam of the home"], required: true },
    { name: "can_foster", label: "Which cats could you take?", type: "checkboxes", options: ["Kittens", "Bottle babies", "Moms with litters", "Adult cats", "Seniors", "Medical / special needs"], required: true },
    { name: "duration", label: "How long could you foster?", type: "select", options: ["2–4 weeks", "1–3 months", "As long as needed", "Short-term emergencies only"], required: true },
    { name: "meds", label: "Are you comfortable giving medication?", type: "radio", options: ["Yes", "Willing to learn", "No"], required: true },
    { name: "transport", label: "Can you drive your foster to vet appointments?", type: "radio", options: ["Yes", "Sometimes", "No"], required: true },
    { name: "notes", label: "Anything else we should know?", type: "textarea" },
  ],
};

/** The answers shown at a glance on an application's page (short labels); the rest are under "All answers". */
export const keyAnswers: Record<ApplicationType, { name: string; label: string }[]> = {
  adopt: [
    { name: "home_type", label: "Home" },
    { name: "own_or_rent", label: "Own or rent" },
    { name: "landlord_ok", label: "Landlord allows cats" },
    { name: "household", label: "Household" },
    { name: "other_pets", label: "Other pets" },
    { name: "indoor_only", label: "Indoors" },
    { name: "hours_alone", label: "Hours alone" },
  ],
  foster: [
    { name: "home_type", label: "Home" },
    { name: "own_or_rent", label: "Own or rent" },
    { name: "household", label: "Household" },
    { name: "other_pets", label: "Other pets" },
    { name: "space", label: "Foster space" },
    { name: "can_foster", label: "Can take" },
    { name: "duration", label: "How long" },
    { name: "meds", label: "Medication" },
  ],
};

export const applicationTypeLabel: Record<ApplicationType, string> = {
  adopt: "Adoption",
  foster: "Foster",
};
