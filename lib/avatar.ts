export const AVATAR_OPTIONS = {
  base: [
    "poster-cub",
    "speed-striker",
    "royal-guardian",
    "tech-tactician",
    "cosmic-dreamer",
  ],
  hair: [
    "sunburst-mane",
    "fraction-braids",
    "graph-swoop",
    "royal-crown-mane",
    "lightning-mane",
    "compass-puffs",
    "starlight-curls",
    "time-twists",
  ],
  outfit: [
    "fraction-robes",
    "graph-guardian",
    "geometry-armor",
    "measurement-jacket",
    "number-ninja",
    "place-value-royal",
    "division-scout",
    "clockwork-captain",
  ],
  shoes: [
    "rocket-sneaks",
    "compass-boots",
    "cube-hoppers",
    "lightning-runners",
    "royal-paws",
    "graph-gliders",
    "meter-marchers",
    "time-skates",
  ],
  weapon: [
    "plus-saber",
    "fraction-shield",
    "graph-blaster",
    "angle-hammer",
    "ruler-lance",
    "number-wand",
    "division-bow",
    "clock-boomerang",
  ],
  companion: [
    "star-cub",
    "number-orb",
    "cube-bot",
    "chalk-firefly",
    "mini-guardian",
    "rocket-puff",
    "compass-comet",
    "clock-sprite",
  ],
} as const;

export type AvatarCategory = keyof typeof AVATAR_OPTIONS;
export type AvatarOption<T extends AvatarCategory> = (typeof AVATAR_OPTIONS)[T][number];

export type StudentAvatar = {
  base: AvatarOption<"base">;
  hair: AvatarOption<"hair">;
  outfit: AvatarOption<"outfit">;
  shoes: AvatarOption<"shoes">;
  weapon: AvatarOption<"weapon">;
  companion: AvatarOption<"companion">;
};

type AvatarOptionMeta = {
  label: string;
  poster: string;
  blurb: string;
  vibe: string;
  mathFocus: string;
  specialMove: string;
  rarity: "Core" | "Rare" | "Epic" | "Legend";
};

export const DEFAULT_AVATAR: StudentAvatar = {
  base: "poster-cub",
  hair: "sunburst-mane",
  outfit: "fraction-robes",
  shoes: "rocket-sneaks",
  weapon: "plus-saber",
  companion: "star-cub",
};

export const AVATAR_LABELS: Record<AvatarCategory, string> = {
  base: "Hero Type",
  hair: "Mane Style",
  outfit: "Poster Suit",
  shoes: "Math Kicks",
  weapon: "Math Tool",
  companion: "Sidekick",
};

export const AVATAR_OPTION_META: Record<AvatarCategory, Record<string, AvatarOptionMeta>> = {
  base: {
    "poster-cub": { label: "Poster Cub", poster: "All Posters", blurb: "Balanced hero build with a classic lion silhouette.", vibe: "Starter hero", mathFocus: "All-around math", specialMove: "Poster Pop", rarity: "Core" },
    "speed-striker": { label: "Speed Striker", poster: "Multiply Mane", blurb: "A lean runner pose built for fast math races and quick finishes.", vibe: "Fast racer", mathFocus: "Facts fluency", specialMove: "Turbo Sprint", rarity: "Rare" },
    "royal-guardian": { label: "Royal Guardian", poster: "Measure King", blurb: "A proud upright champion pose with big presence and captain energy.", vibe: "Big champion", mathFocus: "Measurement", specialMove: "King Shield", rarity: "Epic" },
    "tech-tactician": { label: "Tech Tactician", poster: "Graph Guardian", blurb: "A sharper, gadget-first silhouette for graph brains and mission planners.", vibe: "Smart strategist", mathFocus: "Data and logic", specialMove: "Grid Scan", rarity: "Epic" },
    "cosmic-dreamer": { label: "Cosmic Dreamer", poster: "Timely Tamer", blurb: "A floaty magical silhouette for starry missions and imagination-heavy worlds.", vibe: "Space mage", mathFocus: "Patterns and time", specialMove: "Nebula Drift", rarity: "Legend" },
  },
  hair: {
    "sunburst-mane": { label: "Sunburst Mane", poster: "Fraction Paw", blurb: "Classic bright lion mane with hero volume.", vibe: "Sunny hero", mathFocus: "Fractions", specialMove: "Sunbeam Split", rarity: "Core" },
    "fraction-braids": { label: "Fraction Braids", poster: "Fraction Paw", blurb: "Braided streaks with split-color fraction flair.", vibe: "Smart and calm", mathFocus: "Equal parts", specialMove: "Half-and-Half Twist", rarity: "Core" },
    "graph-swoop": { label: "Graph Swoop", poster: "Graph Guardian", blurb: "Sharp side sweep like a rising graph line.", vibe: "Cool explorer", mathFocus: "Graphs", specialMove: "Line Launch", rarity: "Rare" },
    "royal-crown-mane": { label: "Royal Crown Mane", poster: "Measure King", blurb: "A proud mane shaped for the king of numbers.", vibe: "Royal champion", mathFocus: "Measurement", specialMove: "Crown Count", rarity: "Epic" },
    "lightning-mane": { label: "Lightning Mane", poster: "Multiply Mane", blurb: "Pointed streaks made for fast fact battles.", vibe: "Fast striker", mathFocus: "Multiplication", specialMove: "Flash Facts", rarity: "Epic" },
    "compass-puffs": { label: "Compass Puffs", poster: "Geo Cub", blurb: "Round puffs with clean geometry symmetry.", vibe: "Geo genius", mathFocus: "Shapes", specialMove: "North Star Spin", rarity: "Epic" },
    "starlight-curls": { label: "Starlight Curls", poster: "Timely Tamer", blurb: "Bouncy curls with star sparkle energy.", vibe: "Dreamy star hero", mathFocus: "Patterns", specialMove: "Wish Curl Burst", rarity: "Legend" },
    "time-twists": { label: "Time Twists", poster: "Timely Tamer", blurb: "Twisted mane pieces with clockwork style.", vibe: "Time captain", mathFocus: "Elapsed time", specialMove: "Clock Coil Dash", rarity: "Legend" },
  },
  outfit: {
    "fraction-robes": { label: "Fraction Robes", poster: "Fraction Paw", blurb: "Blue robe with bright fraction sash.", vibe: "Poster starter", mathFocus: "Parts of a whole", specialMove: "Slice Shield", rarity: "Core" },
    "graph-guardian": { label: "Graph Guardian Suit", poster: "Graph Guardian", blurb: "Smart suit with chart-board chest plate.", vibe: "Data defender", mathFocus: "Charts", specialMove: "Axis Armor", rarity: "Rare" },
    "geometry-armor": { label: "Geometry Armor", poster: "Geo Cub", blurb: "Armor panels built from shapes and angles.", vibe: "Shape knight", mathFocus: "Angles", specialMove: "Polygon Pulse", rarity: "Rare" },
    "measurement-jacket": { label: "Measurement Jacket", poster: "Measure King", blurb: "Royal jacket with ruler trim and badges.", vibe: "Precise leader", mathFocus: "Length", specialMove: "Ruler Rush", rarity: "Epic" },
    "number-ninja": { label: "Number Ninja", poster: "Place Value Prince", blurb: "Swift tunic for sneaky number missions.", vibe: "Silent speedster", mathFocus: "Place value", specialMove: "Digit Dash", rarity: "Epic" },
    "place-value-royal": { label: "Place Value Royal", poster: "Place Value Prince", blurb: "Gold-and-coral hero wear for number nobles.", vibe: "Number royalty", mathFocus: "Expanded form", specialMove: "Royal Regroup", rarity: "Epic" },
    "division-scout": { label: "Division Scout", poster: "Divide Roar", blurb: "Explorer uniform for splitting challenges.", vibe: "Trailblazer", mathFocus: "Division", specialMove: "Equal Group Quest", rarity: "Legend" },
    "clockwork-captain": { label: "Clockwork Captain", poster: "Timely Tamer", blurb: "Time-command jacket with glowing trim.", vibe: "Time boss", mathFocus: "Schedules", specialMove: "Minute Master", rarity: "Legend" },
  },
  shoes: {
    "rocket-sneaks": { label: "Rocket Sneaks", poster: "Multiply Mane", blurb: "Fast sneakers for zooming through facts.", vibe: "Starter speed", mathFocus: "Fast facts", specialMove: "Zoom Solve", rarity: "Core" },
    "compass-boots": { label: "Compass Boots", poster: "Geo Cub", blurb: "Explorer boots that point the right way.", vibe: "Adventure steps", mathFocus: "Direction", specialMove: "North Hop", rarity: "Rare" },
    "cube-hoppers": { label: "Cube Hoppers", poster: "Place Value Prince", blurb: "Chunky jumps with blocky cube soles.", vibe: "Bouncy block hero", mathFocus: "Base ten", specialMove: "Cube Bounce", rarity: "Rare" },
    "lightning-runners": { label: "Lightning Runners", poster: "Multiply Mane", blurb: "Speed shoes built for score races.", vibe: "Race champion", mathFocus: "Multiplication", specialMove: "Table Turbo", rarity: "Epic" },
    "royal-paws": { label: "Royal Paws", poster: "Measure King", blurb: "Golden paw shoes for champion walks.", vibe: "Golden winner", mathFocus: "Units", specialMove: "Majesty March", rarity: "Epic" },
    "graph-gliders": { label: "Graph Gliders", poster: "Graph Guardian", blurb: "Smooth steps with chart-line glow.", vibe: "Sky skater", mathFocus: "Coordinate plane", specialMove: "Slope Slide", rarity: "Epic" },
    "meter-marchers": { label: "Meter Marchers", poster: "Measure King", blurb: "Measured steps with ruler striping.", vibe: "Steady finisher", mathFocus: "Distance", specialMove: "Perfect Pace", rarity: "Legend" },
    "time-skates": { label: "Time Skates", poster: "Timely Tamer", blurb: "Clock-powered skates for finishing fast.", vibe: "Time racer", mathFocus: "Time", specialMove: "Second Surge", rarity: "Legend" },
  },
  weapon: {
    "plus-saber": { label: "Plus Saber", poster: "Fraction Paw", blurb: "A glowing plus-sign saber for brave answers.", vibe: "Bright striker", mathFocus: "Addition", specialMove: "Sum Slash", rarity: "Core" },
    "fraction-shield": { label: "Fraction Shield", poster: "Fraction Paw", blurb: "Circular shield split into colorful parts.", vibe: "Shield tank", mathFocus: "Fractions", specialMove: "Part Protect", rarity: "Rare" },
    "graph-blaster": { label: "Graph Blaster", poster: "Graph Guardian", blurb: "Shoots chart beams and line boosts.", vibe: "Future tech", mathFocus: "Data", specialMove: "Bar Beam", rarity: "Rare" },
    "angle-hammer": { label: "Angle Hammer", poster: "Geo Cub", blurb: "A shape hammer for smashing wrong angles.", vibe: "Heavy hitter", mathFocus: "Geometry", specialMove: "Corner Crash", rarity: "Epic" },
    "ruler-lance": { label: "Ruler Lance", poster: "Measure King", blurb: "Long measuring lance with champion trim.", vibe: "Royal lancer", mathFocus: "Measurement", specialMove: "Exact Strike", rarity: "Epic" },
    "number-wand": { label: "Number Wand", poster: "Place Value Prince", blurb: "Casts digit power and place value sparks.", vibe: "Magic scholar", mathFocus: "Numbers", specialMove: "Digit Drift", rarity: "Epic" },
    "division-bow": { label: "Division Bow", poster: "Divide Roar", blurb: "Bow that splits targets into equal groups.", vibe: "Target master", mathFocus: "Division", specialMove: "Split Shot", rarity: "Legend" },
    "clock-boomerang": { label: "Clock Boomerang", poster: "Timely Tamer", blurb: "Time ring that loops back in a flash.", vibe: "Trickster ace", mathFocus: "Time", specialMove: "Loop Return", rarity: "Legend" },
  },
  companion: {
    "star-cub": { label: "Star Cub", poster: "All Posters", blurb: "A tiny lion cub with sparkly courage.", vibe: "Best buddy", mathFocus: "Cheer boosts", specialMove: "Bravery Spark", rarity: "Core" },
    "number-orb": { label: "Number Orb", poster: "Place Value Prince", blurb: "Floating orb that whispers number hints.", vibe: "Helper brain", mathFocus: "Number sense", specialMove: "Hint Halo", rarity: "Rare" },
    "cube-bot": { label: "Cube Bot", poster: "Place Value Prince", blurb: "A cute robot made from counting cubes.", vibe: "Block pal", mathFocus: "Base ten", specialMove: "Stack Pop", rarity: "Rare" },
    "chalk-firefly": { label: "Chalk Firefly", poster: "Graph Guardian", blurb: "Little glow bug that writes math trails.", vibe: "Tiny artist", mathFocus: "Show your work", specialMove: "Glow Trace", rarity: "Epic" },
    "mini-guardian": { label: "Mini Guardian", poster: "Graph Guardian", blurb: "Pocket protector with chart shield power.", vibe: "Protective pal", mathFocus: "Data defense", specialMove: "Chart Guard", rarity: "Epic" },
    "rocket-puff": { label: "Rocket Puff", poster: "Multiply Mane", blurb: "Speedy puff cloud with zoom energy.", vibe: "Hyper helper", mathFocus: "Speed drills", specialMove: "Boost Burst", rarity: "Epic" },
    "compass-comet": { label: "Compass Comet", poster: "Geo Cub", blurb: "A comet pet that points to the answer.", vibe: "Space guide", mathFocus: "Direction", specialMove: "Star Point", rarity: "Legend" },
    "clock-sprite": { label: "Clock Sprite", poster: "Timely Tamer", blurb: "Tiny timer spirit for race-day missions.", vibe: "Tick-tock buddy", mathFocus: "Timing", specialMove: "Minute Blink", rarity: "Legend" },
  },
};

export const AVATAR_UNLOCKS: Record<AvatarCategory, Record<string, number>> = {
  base: {
    "poster-cub": 0,
    "speed-striker": 35,
    "royal-guardian": 90,
    "tech-tactician": 140,
    "cosmic-dreamer": 210,
  },
  hair: {
    "sunburst-mane": 0,
    "fraction-braids": 0,
    "graph-swoop": 35,
    "royal-crown-mane": 70,
    "lightning-mane": 105,
    "compass-puffs": 140,
    "starlight-curls": 180,
    "time-twists": 230,
  },
  outfit: {
    "fraction-robes": 0,
    "graph-guardian": 25,
    "geometry-armor": 55,
    "measurement-jacket": 85,
    "number-ninja": 120,
    "place-value-royal": 155,
    "division-scout": 195,
    "clockwork-captain": 240,
  },
  shoes: {
    "rocket-sneaks": 0,
    "compass-boots": 20,
    "cube-hoppers": 50,
    "lightning-runners": 80,
    "royal-paws": 115,
    "graph-gliders": 150,
    "meter-marchers": 190,
    "time-skates": 235,
  },
  weapon: {
    "plus-saber": 0,
    "fraction-shield": 30,
    "graph-blaster": 65,
    "angle-hammer": 95,
    "ruler-lance": 130,
    "number-wand": 165,
    "division-bow": 205,
    "clock-boomerang": 250,
  },
  companion: {
    "star-cub": 0,
    "number-orb": 25,
    "cube-bot": 60,
    "chalk-firefly": 100,
    "mini-guardian": 135,
    "rocket-puff": 175,
    "compass-comet": 215,
    "clock-sprite": 260,
  },
};

export const AVATAR_LEVELS = [
  { level: 1, title: "Poster Cub", minXp: 0 },
  { level: 2, title: "Fraction Scout", minXp: 40 },
  { level: 3, title: "Graph Guardian", minXp: 90 },
  { level: 4, title: "Measurement Champ", minXp: 150 },
  { level: 5, title: "Poster Legend", minXp: 220 },
] as const;

function normalizeCategory<K extends AvatarCategory>(category: K, value: unknown): StudentAvatar[K] {
  if (typeof value === "string" && (AVATAR_OPTIONS[category] as readonly string[]).includes(value)) {
    return value as StudentAvatar[K];
  }
  return DEFAULT_AVATAR[category];
}

export function normalizeAvatar(value: unknown): StudentAvatar {
  const input = (value && typeof value === "object" ? value : {}) as Partial<Record<AvatarCategory, string>>;

  return {
    base: normalizeCategory("base", input.base),
    hair: normalizeCategory("hair", input.hair),
    outfit: normalizeCategory("outfit", input.outfit),
    shoes: normalizeCategory("shoes", input.shoes),
    weapon: normalizeCategory("weapon", input.weapon),
    companion: normalizeCategory("companion", input.companion),
  };
}

export function getAvatarOptionMeta(category: AvatarCategory, option: string) {
  return AVATAR_OPTION_META[category][option] ?? {
    label: option.replaceAll("-", " "),
    poster: "Poster World",
    blurb: "",
    vibe: "Math Hero",
    mathFocus: "Mission Power",
    specialMove: "Poster Burst",
    rarity: "Core",
  };
}

export function getAvatarLevel(xp: number) {
  return [...AVATAR_LEVELS].reverse().find((entry) => xp >= entry.minXp) ?? AVATAR_LEVELS[0];
}

export function isAvatarOptionUnlocked(category: AvatarCategory, option: string, xp: number) {
  return xp >= (AVATAR_UNLOCKS[category][option] ?? 0);
}

export function normalizeAvatarForXp(value: unknown, xp: number): StudentAvatar {
  const avatar = normalizeAvatar(value);

  return {
    base: isAvatarOptionUnlocked("base", avatar.base, xp) ? avatar.base : DEFAULT_AVATAR.base,
    hair: isAvatarOptionUnlocked("hair", avatar.hair, xp) ? avatar.hair : DEFAULT_AVATAR.hair,
    outfit: isAvatarOptionUnlocked("outfit", avatar.outfit, xp) ? avatar.outfit : DEFAULT_AVATAR.outfit,
    shoes: isAvatarOptionUnlocked("shoes", avatar.shoes, xp) ? avatar.shoes : DEFAULT_AVATAR.shoes,
    weapon: isAvatarOptionUnlocked("weapon", avatar.weapon, xp) ? avatar.weapon : DEFAULT_AVATAR.weapon,
    companion: isAvatarOptionUnlocked("companion", avatar.companion, xp) ? avatar.companion : DEFAULT_AVATAR.companion,
  };
}
