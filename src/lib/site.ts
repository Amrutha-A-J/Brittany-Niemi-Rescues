export const site = {
  name: "Brittany Niemi Rescues",
  shortName: "BNR",
  city: "Moose Jaw",
  region: "Saskatchewan",
  regionCode: "SK",
  country: "CA",
  timeZone: "America/Regina",
  // Saskatchewan does not observe daylight saving time.
  utcOffset: "-06:00",
  instagram: "brittany.niemi.rescues",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Cat rescue in Moose Jaw, Saskatchewan. We rescue, foster and rehome cats of every age, from bottle babies to golden-years seniors and the ones who need a little extra care.",
};

export const instagramUrl = `https://www.instagram.com/${site.instagram}/`;
