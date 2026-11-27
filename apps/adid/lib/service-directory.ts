export const PUBLIC_SERVICES = [
  {
    id: "ausdis",
    name: "Australian Disability Ltd",
    href: "https://www.ausdis.com.au/",
    description: "Membership, advocacy and support.",
  },
  {
    id: "mapable",
    name: "MapAble",
    href: "https://mapable.com.au/",
    description: "Accessible places, employment and everyday supports.",
  },
  {
    id: "disapedia",
    name: "Australian Disapedia",
    href: "https://disapedia.au/index.php/Main_Page",
    description: "Read and contribute to the disability encyclopaedia.",
  },
  {
    id: "accessibooks",
    name: "AccessiBooks",
    href: "https://accessibooks.org/",
    description: "Discover accessible books and audiobooks.",
  },
] as const;

export const communityService = {
  name: "CripSquare",
  href: "https://cripsquare.au/",
};
export const supportHref = "https://www.ausdis.com.au/contact-3";
const approvedLandingPages = new Set<string>([
  ...PUBLIC_SERVICES.map((service) => service.href),
  communityService.href,
  "https://disapedia.au/",
  "https://accessibooks.com.au/",
]);

export function verifiedPublicHref(raw: unknown) {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    return approvedLandingPages.has(url.href) ? url.href : null;
  } catch {
    return null;
  }
}

export function claimsOk(issuer: unknown, subject: unknown) {
  if (
    typeof issuer !== "string" ||
    typeof subject !== "string" ||
    !subject.trim() ||
    subject.length > 255
  )
    return false;
  try {
    const url = new URL(issuer);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.hash &&
      !url.search
    );
  } catch {
    return false;
  }
}

export function serviceFor(value: unknown) {
  return PUBLIC_SERVICES.find((s) => s.id === value);
}

export function serviceEntry(id: (typeof PUBLIC_SERVICES)[number]["id"]) {
  switch (id) {
    case "ausdis":
      return "https://www.ausdis.com.au/";
    case "mapable":
      return "https://mapable.com.au/login";
    case "disapedia":
      return "https://disapedia.au/index.php/Special:UserLogin";
    case "accessibooks":
      return "https://accessibooks.org/account";
  }
}
