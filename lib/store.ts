export type StoreItemType = "helmet" | "cape" | "trail";

export type StoreItem = {
  key: string;
  name: string;
  cost: number;
  type: StoreItemType;
  color: string;
  description: string;
  missionThemeClass: string;
  missionThemeTitle: string;
  missionThemeFlavor: string;
};

export const STORE_ITEMS: StoreItem[] = [
  {
    key: "comet-helmet",
    name: "Comet Helmet",
    cost: 120,
    type: "helmet",
    color: "from-cyan-300 to-blue-500",
    description: "A shiny math pilot helmet for fast problem solvers.",
    missionThemeClass: "mission-theme-comet",
    missionThemeTitle: "Comet Command Deck",
    missionThemeFlavor: "Pilot panels, bright thrusters, and comet lights reshape the mission board.",
  },
  {
    key: "crown-visor",
    name: "Crown Visor",
    cost: 210,
    type: "helmet",
    color: "from-amber-300 to-rose-400",
    description: "A royal visor for lion leaders who rule the mission map.",
    missionThemeClass: "mission-theme-royal",
    missionThemeTitle: "Royal Lion Court",
    missionThemeFlavor: "Gold glow, champion banners, and palace energy take over the board.",
  },
  {
    key: "galaxy-cape",
    name: "Galaxy Cape",
    cost: 180,
    type: "cape",
    color: "from-fuchsia-300 to-pink-500",
    description: "A cosmic cape for champions of fractions and graphs.",
    missionThemeClass: "mission-theme-galaxy",
    missionThemeTitle: "Galaxy Cape Sky",
    missionThemeFlavor: "Deep space color and floating stars turn every mission into a cosmic quest.",
  },
  {
    key: "neon-cape",
    name: "Neon Cape",
    cost: 230,
    type: "cape",
    color: "from-lime-300 to-cyan-400",
    description: "A glowing cape that lights up the whole mission board.",
    missionThemeClass: "mission-theme-neon",
    missionThemeTitle: "Neon Hero Grid",
    missionThemeFlavor: "Arcade strips and glowing lanes make the board feel fast and electric.",
  },
  {
    key: "turbo-trail",
    name: "Turbo Trail",
    cost: 150,
    type: "trail",
    color: "from-lime-300 to-emerald-500",
    description: "A bright speed trail for math heroes who finish strong.",
    missionThemeClass: "mission-theme-turbo",
    missionThemeTitle: "Turbo Trail Arena",
    missionThemeFlavor: "Speed lanes and race-day glow push the mission map into overdrive.",
  },
  {
    key: "star-trail",
    name: "Star Trail",
    cost: 240,
    type: "trail",
    color: "from-violet-300 to-indigo-500",
    description: "A starry trail that turns every mission into a cosmic parade.",
    missionThemeClass: "mission-theme-star",
    missionThemeTitle: "Star Trail Galaxy",
    missionThemeFlavor: "Soft starbursts and dreamy sky trails make every node feel magical.",
  },
];

export function getStoreItem(key: string) {
  return STORE_ITEMS.find((item) => item.key === key) ?? null;
}
