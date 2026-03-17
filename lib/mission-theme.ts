export type MissionTheme = {
  rootClassName: string;
  title: string;
  flavor: string;
};

export function getMissionTheme(equippedItemKeys: string[]): MissionTheme {
  if (equippedItemKeys.includes("star-trail")) {
    return {
      rootClassName: "mission-theme-star",
      title: "Star Trail Galaxy",
      flavor: "Sparkly star paths and dreamy nebula color make every math quest feel huge.",
    };
  }

  if (equippedItemKeys.includes("neon-cape")) {
    return {
      rootClassName: "mission-theme-neon",
      title: "Neon Hero Grid",
      flavor: "Bright arcade glow and racing color turn the board into a math light show.",
    };
  }

  if (equippedItemKeys.includes("crown-visor")) {
    return {
      rootClassName: "mission-theme-royal",
      title: "Royal Lion Court",
      flavor: "Gold ribbons and champion color make the mission board feel like a hero palace.",
    };
  }

  if (equippedItemKeys.includes("turbo-trail")) {
    return {
      rootClassName: "mission-theme-turbo",
      title: "Turbo Trail Arena",
      flavor: "Bright speed lanes and neon math energy push the mission board forward.",
    };
  }

  if (equippedItemKeys.includes("galaxy-cape")) {
    return {
      rootClassName: "mission-theme-galaxy",
      title: "Galaxy Cape Sky",
      flavor: "Cosmic lights, deep space color, and star trails wrap the whole quest map.",
    };
  }

  if (equippedItemKeys.includes("comet-helmet")) {
    return {
      rootClassName: "mission-theme-comet",
      title: "Comet Command Deck",
      flavor: "Clean pilot lines and comet sparks turn every level into a launch mission.",
    };
  }

  return {
    rootClassName: "mission-theme-default",
    title: "Poster Quest Field",
    flavor: "The classic lion poster world with bright math energy and heroic color.",
  };
}
