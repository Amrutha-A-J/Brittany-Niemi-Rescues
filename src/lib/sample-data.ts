import type { Cat } from "./types";

// Shown on the public site until Supabase is connected.
function bornAgo(months: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.round(months * 30.4375));
  return d.toISOString().slice(0, 10);
}

type Seed = Partial<Cat> & Pick<Cat, "name" | "sex" | "color"> & { months: number };

const seeds: Seed[] = [
  { name: "Pickle", sex: "female", months: 10 / 4.345, color: "Grey tabby", personality: ["Playful", "Curious", "Loves feather toys"], description: "Pickle is a tiny tornado who will chase anything that moves, then fall asleep in your lap." },
  { name: "Bean", sex: "male", months: 12 / 4.345, color: "Black", personality: ["Cuddly", "Chatty"], description: "Bean is a little black panther with a big purr. He loves being carried around like a baby." },
  { name: "Juniper", sex: "female", months: 8, color: "Calico", personality: ["Independent", "Smart"], description: "Juniper is clever, a little sassy, and loves a sunny windowsill." },
  { name: "Otis", sex: "male", months: 24, color: "Orange tabby", status: "pending", personality: ["Gentle", "Laid-back"], description: "Otis is a big orange sweetheart who gets along with everyone." },
  { name: "Willow", sex: "female", months: 18, color: "Tortoiseshell", personality: ["Shy at first", "Affectionate"], description: "Willow takes a few days to warm up, then she'll follow you from room to room." },
  { name: "Marmalade", sex: "male", months: 60, color: "Orange & white", personality: ["Easy-going", "Food motivated"], description: "Marmalade is a classic couch cat who has never met a snack he didn't like." },
  { name: "Clover", sex: "female", months: 132, color: "Grey & white", personality: ["Calm", "Lap cat"], description: "Clover is a dignified senior looking for a quiet home and a warm blanket." },
  { name: "Gus", sex: "male", months: 156, color: "Black & white", personality: ["Sweet", "Talkative"], description: "Gus is a gentle old gentleman who still enjoys a good chin scratch." },
  { name: "Pip", sex: "male", months: 36, color: "White", special_needs: true, special_needs_notes: "Pip is deaf. He does best as an indoor-only cat and responds well to hand signals and vibrations.", personality: ["Bold", "Playful"], description: "Pip doesn't let deafness slow him down. He's fearless and full of fun." },
  { name: "Rosie", sex: "female", months: 72, color: "Brown tabby", special_needs: true, special_needs_notes: "Rosie has diabetes, managed with twice-daily insulin. We'll teach you everything.", personality: ["Loving", "Gentle"], description: "Rosie is a sweet, easy-going girl who just needs a family comfortable with a little routine." },
];

export const sampleCats: Cat[] = seeds.map((s, i) => {
  const { months, ...rest } = s;
  const created = new Date(Date.now() - i * 86_400_000).toISOString();
  return {
    id: `sample-${i}`,
    slug: s.name.toLowerCase(),
    breed: "Domestic shorthair",
    status: "available",
    special_needs: false,
    special_needs_notes: "",
    description: "",
    personality: [],
    good_with_kids: "unknown",
    good_with_cats: "yes",
    good_with_dogs: "unknown",
    spayed_neutered: months >= 6,
    vaccinated: true,
    microchipped: months >= 6,
    adoption_fee: months < 6 ? 250 : months >= 120 ? 75 : 200,
    created_at: created,
    updated_at: created,
    cat_photos: [],
    ...rest,
    birth_date: bornAgo(months),
  };
});
