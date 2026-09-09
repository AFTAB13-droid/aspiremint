export type AvatarCategory = "ALL" | "MEN" | "WOMEN" | "BOYS_GIRLS" | "SENIORS" | "SPECIAL";

export interface AvatarItem {
  id: string;
  name: string;
  category: "MEN" | "WOMEN" | "BOYS_GIRLS" | "SENIORS" | "SPECIAL";
  path: string;
  description: string;
}

export const AVAILABLE_AVATARS: AvatarItem[] = [
  // Boys & Teens
  {
    id: "boy-1",
    name: "Street Cap Boy",
    category: "BOYS_GIRLS",
    path: "/avatars/boy-1.svg",
    description: "Sporty boy with a backward cap & casual hoodie"
  },
  {
    id: "boy-2",
    name: "Gamer Teen",
    category: "BOYS_GIRLS",
    path: "/avatars/boy-2.svg",
    description: "Teen gamer with modern headset & cyan accents"
  },
  {
    id: "boy-3",
    name: "Smart Scholar",
    category: "BOYS_GIRLS",
    path: "/avatars/boy-3.svg",
    description: "Young student with round glasses & school tie"
  },

  // Girls & Teens
  {
    id: "girl-1",
    name: "Cheerful Ponytail",
    category: "BOYS_GIRLS",
    path: "/avatars/girl-1.svg",
    description: "Energetic girl with high ponytail & denim jacket"
  },
  {
    id: "girl-2",
    name: "School Bobcut",
    category: "BOYS_GIRLS",
    path: "/avatars/girl-2.svg",
    description: "Cute school girl with classic bob haircut & clips"
  },
  {
    id: "girl-3",
    name: "Creative Beanie",
    category: "BOYS_GIRLS",
    path: "/avatars/girl-3.svg",
    description: "Artistic girl with mustard beanie & cozy scarf"
  },

  // Men
  {
    id: "man-1",
    name: "Modern Tech Pro",
    category: "MEN",
    path: "/avatars/man-1.svg",
    description: "Smart professional with trimmed beard & clean fade"
  },
  {
    id: "man-2",
    name: "Corporate Leader",
    category: "MEN",
    path: "/avatars/man-2.svg",
    description: "Executive in sharp navy suit & business tie"
  },
  {
    id: "man-3",
    name: "Casual Wavy",
    category: "MEN",
    path: "/avatars/man-3.svg",
    description: "Approachable young man with wavy hair & casual polo"
  },
  {
    id: "man-4",
    name: "Sporty Athlete",
    category: "MEN",
    path: "/avatars/man-4.svg",
    description: "Fitness enthusiast with athletic headband & gym tank"
  },

  // Women
  {
    id: "woman-1",
    name: "Business Leader",
    category: "WOMEN",
    path: "/avatars/woman-1.svg",
    description: "Polished executive in emerald blazer with gold accents"
  },
  {
    id: "woman-2",
    name: "Tech Specialist",
    category: "WOMEN",
    path: "/avatars/woman-2.svg",
    description: "Modern specialist with stylish glasses & purple blazer"
  },
  {
    id: "woman-3",
    name: "Creative Designer",
    category: "WOMEN",
    path: "/avatars/woman-3.svg",
    description: "Artistic woman with natural curls & big gold hoops"
  },
  {
    id: "woman-4",
    name: "Casual Chic",
    category: "WOMEN",
    path: "/avatars/woman-4.svg",
    description: "Warm smiling woman with flowing hair & sunny sweater"
  },

  // Seniors
  {
    id: "senior-man-1",
    name: "Silver Scholar",
    category: "SENIORS",
    path: "/avatars/senior-man-1.svg",
    description: "Distinguished gentleman with silver beard & spectacles"
  },
  {
    id: "senior-man-2",
    name: "Smiling Grandfather",
    category: "SENIORS",
    path: "/avatars/senior-man-2.svg",
    description: "Warm grandfather with cozy sweater & kind smile"
  },
  {
    id: "senior-woman-1",
    name: "Elegant Matriarch",
    category: "SENIORS",
    path: "/avatars/senior-woman-1.svg",
    description: "Graceful senior lady with pearl earrings & silver waves"
  },
  {
    id: "senior-woman-2",
    name: "Kind Grandmother",
    category: "SENIORS",
    path: "/avatars/senior-woman-2.svg",
    description: "Loving grandmother with gray bun & cat-eye glasses"
  },

  // Champions & Special
  {
    id: "champion-1",
    name: "Mint Champion",
    category: "SPECIAL",
    path: "/avatars/champion-1.svg",
    description: "AspireMint royal green & gold crowned winner avatar"
  },
  {
    id: "champion-2",
    name: "Gold Master",
    category: "SPECIAL",
    path: "/avatars/champion-2.svg",
    description: "Prestigious golden persona with star radiance"
  }
];

export const AVATAR_CATEGORIES: { id: AvatarCategory; label: string }[] = [
  { id: "ALL", label: "All Personas (20)" },
  { id: "MEN", label: "Men" },
  { id: "WOMEN", label: "Women" },
  { id: "BOYS_GIRLS", label: "Boys & Girls" },
  { id: "SENIORS", label: "Seniors / Elders" },
  { id: "SPECIAL", label: "Champions" }
];

/**
 * Returns the valid avatar URL or falls back to a deterministic avatar based on the seed string (name, email, or id)
 */
export function getUserAvatar(avatarPathOrId?: string | null, fallbackSeed?: string | null): string {
  if (avatarPathOrId) {
    const found = AVAILABLE_AVATARS.find(a => a.id === avatarPathOrId || a.path === avatarPathOrId);
    if (found) return found.path;
    if (avatarPathOrId.startsWith("/avatars/")) return avatarPathOrId;
  }

  // Deterministic fallback based on fallbackSeed hash
  if (fallbackSeed && fallbackSeed.length > 0) {
    let hash = 0;
    for (let i = 0; i < fallbackSeed.length; i++) {
      hash = (hash << 5) - hash + fallbackSeed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % AVAILABLE_AVATARS.length;
    return AVAILABLE_AVATARS[index].path;
  }

  return AVAILABLE_AVATARS[0].path;
}
