/**
 * Hostility configuration between PMC factions and AI groups.
 * Forces PMCs to treat other AI and player factions as enemies.
 */
export const defaultHostility = [
<<<<<<< Updated upstream
  {
    AlwaysEnemies: [
      "bossTest",
      "followerTest",
      "bossKilla",
      "bossKojaniy",
      "followerKojaniy",
      "cursedAssault",
      "bossGluhar",
      "followerGluharAssault",
      "followerGluharSecurity",
      "followerGluharScout",
      "followerGluharSnipe",
      "followerSanitar",
      "bossSanitar",
      "test",
      "assaultGroup",
      "sectantWarrior",
      "sectantPriest",
      "bossTagilla",
      "followerTagilla",
      "bossKnight",
      "followerBigPipe",
      "followerBirdEye",
      "bossBoar",
      "followerBoar",
      "arenaFighter",
      "arenaFighterEvent",
      "bossBoarSniper",
      "crazyAssaultEvent",
      "sectactPriestEvent",
      "followerBoarClose1",
      "followerBoarClose2",
      "bossKolontay",
      "followerKolontayAssault",
      "followerKolontaySecurity",
      "bossPartisan",
      "spiritWinter",
      "spiritSpring",
      "peacemaker",
      "skier",
      "assault",
      "marksman",
      "pmcUSEC",
      "exUsec",
      "pmcBot",
      "bossBully",
    ],
    AlwaysFriends: [
      "bossZryachiy",
      "followerZryachiy",
      "peacefullZryachiyEvent",
      "ravangeZryachiyEvent",
      "gifter",
    ],
    BearEnemyChance: 100,
    BearPlayerBehaviour: "AlwaysEnemies",
    BotRole: "pmcBEAR",
    ChancedEnemies: [],
    Neutral: ["shooterBTR"],
    SavagePlayerBehaviour: "AlwaysEnemies",
    UsecEnemyChance: 100,
    UsecPlayerBehaviour: "AlwaysEnemies",
    Warn: ["sectactPriestEvent"],
  },
  {
    AlwaysEnemies: [
      "bossTest",
      "followerTest",
      "bossKilla",
      "bossKojaniy",
      "followerKojaniy",
      "cursedAssault",
      "bossGluhar",
      "followerGluharAssault",
      "followerGluharSecurity",
      "followerGluharScout",
      "followerGluharSnipe",
      "followerSanitar",
      "bossSanitar",
      "test",
      "assaultGroup",
      "sectantWarrior",
      "sectantPriest",
      "bossTagilla",
      "followerTagilla",
      "bossKnight",
      "followerBigPipe",
      "followerBirdEye",
      "bossBoar",
      "followerBoar",
      "arenaFighter",
      "arenaFighterEvent",
      "bossBoarSniper",
      "crazyAssaultEvent",
      "sectactPriestEvent",
      "followerBoarClose1",
      "followerBoarClose2",
      "bossKolontay",
      "followerKolontayAssault",
      "followerKolontaySecurity",
      "bossPartisan",
      "spiritWinter",
      "spiritSpring",
      "peacemaker",
      "skier",
      "assault",
      "marksman",
      "pmcBEAR",
      "exUsec",
      "pmcBot",
      "bossBully",
    ],
    AlwaysFriends: [
      "bossZryachiy",
      "followerZryachiy",
      "peacefullZryachiyEvent",
      "ravangeZryachiyEvent",
      "gifter",
    ],
    BearEnemyChance: 100,
    BearPlayerBehaviour: "AlwaysEnemies",
    BotRole: "pmcUSEC",
    ChancedEnemies: [],
    Neutral: ["shooterBTR"],
    SavagePlayerBehaviour: "AlwaysEnemies",
    UsecEnemyChance: 100,
    UsecPlayerBehaviour: "AlwaysEnemies",
    Warn: ["sectactPriestEvent"],
  },
=======
    {
        BotRole: "pmcBEAR",
        AlwaysEnemies: [
            "bossTest", "followerTest", "bossKilla", "bossKojaniy", "followerKojaniy",
            "cursedAssault", "bossGluhar", "followerGluharAssault", "followerGluharSecurity",
            "followerGluharScout", "followerGluharSnipe", "followerSanitar", "bossSanitar",
            "test", "assaultGroup", "sectantWarrior", "sectantPriest", "bossTagilla",
            "followerTagilla", "bossKnight", "followerBigPipe", "followerBirdEye",
            "bossBoar", "followerBoar", "arenaFighter", "arenaFighterEvent",
            "bossBoarSniper", "crazyAssaultEvent", "sectactPriestEvent", "followerBoarClose1",
            "followerBoarClose2", "bossKolontay", "followerKolontayAssault", "followerKolontaySecurity",
            "bossPartisan", "spiritWinter", "spiritSpring", "peacemaker", "skier",
            "assault", "marksman", "pmcUSEC", "exUsec", "pmcBot", "bossBully"
        ],
        AlwaysFriends: [
            "bossZryachiy", "followerZryachiy", "peacefullZryachiyEvent", "ravangeZryachiyEvent", "gifter"
        ],
        BearEnemyChance: 100,
        UsecEnemyChance: 100,
        BearPlayerBehaviour: "AlwaysEnemies",
        UsecPlayerBehaviour: "AlwaysEnemies",
        SavagePlayerBehaviour: "AlwaysEnemies",
        ChancedEnemies: [],
        Neutral: ["shooterBTR"],
        Warn: ["sectactPriestEvent"]
    },
    {
        BotRole: "pmcUSEC",
        AlwaysEnemies: [
            "bossTest", "followerTest", "bossKilla", "bossKojaniy", "followerKojaniy",
            "cursedAssault", "bossGluhar", "followerGluharAssault", "followerGluharSecurity",
            "followerGluharScout", "followerGluharSnipe", "followerSanitar", "bossSanitar",
            "test", "assaultGroup", "sectantWarrior", "sectantPriest", "bossTagilla",
            "followerTagilla", "bossKnight", "followerBigPipe", "followerBirdEye",
            "bossBoar", "followerBoar", "arenaFighter", "arenaFighterEvent",
            "bossBoarSniper", "crazyAssaultEvent", "sectactPriestEvent", "followerBoarClose1",
            "followerBoarClose2", "bossKolontay", "followerKolontayAssault", "followerKolontaySecurity",
            "bossPartisan", "spiritWinter", "spiritSpring", "peacemaker", "skier",
            "assault", "marksman", "pmcBEAR", "exUsec", "pmcBot", "bossBully"
        ],
        AlwaysFriends: [
            "bossZryachiy", "followerZryachiy", "peacefullZryachiyEvent", "ravangeZryachiyEvent", "gifter"
        ],
        BearEnemyChance: 100,
        UsecEnemyChance: 100,
        BearPlayerBehaviour: "AlwaysEnemies",
        UsecPlayerBehaviour: "AlwaysEnemies",
        SavagePlayerBehaviour: "AlwaysEnemies",
        ChancedEnemies: [],
        Neutral: ["shooterBTR"],
        Warn: ["sectactPriestEvent"]
    }
>>>>>>> Stashed changes
];

/**
 * Config map keys (used in config.json, bossConfig.json, etc.).
 */
export const configLocations = [
<<<<<<< Updated upstream
  "customs",
  "factoryDay",
  "factoryNight",
  "interchange",
  "laboratory",
  "lighthouse",
  "rezervbase",
  "shoreline",
  "tarkovstreets",
  "woods",
  "gzLow",
  "gzHigh",
=======
    "customs", "factoryDay", "factoryNight", "interchange", "laboratory",
    "lighthouse", "rezervbase", "shoreline", "tarkovstreets", "woods", "gzLow", "gzHigh"
>>>>>>> Stashed changes
];

/**
 * Internal location IDs from Tarkov's location list.
 */
export const originalMapList = [
<<<<<<< Updated upstream
  "bigmap",
  "factory4_day",
  "factory4_night",
  "interchange",
  "laboratory",
  "lighthouse",
  "rezervbase",
  "shoreline",
  "tarkovstreets",
  "woods",
  "sandbox",
  "sandbox_high",
];

export const bossesToRemoveFromPool = new Set([
  "assault",
  "pmcBEAR",
  "pmcUSEC",
  "infectedAssault",
  "infectedTagilla",
  "infectedLaborant",
  "infectedCivil",
=======
    "bigmap", "factory4_day", "factory4_night", "interchange", "laboratory",
    "lighthouse", "rezervbase", "shoreline", "tarkovstreets", "woods", "sandbox", "sandbox_high"
];

/**
 * Bot types that should never be included in boss pools.
 */
export const bossesToRemoveFromPool = new Set<string>([
    "assault", "pmcBEAR", "pmcUSEC",
    "infectedAssault", "infectedTagilla", "infectedLaborant", "infectedCivil"
>>>>>>> Stashed changes
]);

/**
 * Primary boss types for spawn balancing and pool logic.
 */
export const mainBossNameList = [
<<<<<<< Updated upstream
  "bossKojaniy",
  "bossGluhar",
  "bossSanitar",
  "bossKilla",
  "bossTagilla",
  "bossKnight",
  "bossBoar",
  "bossKolontay",
  "bossPartisan",
  "bossBully",
];

export const defaultEscapeTimes = {
  customs: 40,
  factoryDay: 20,
  factoryNight: 25,
  interchange: 40,
  laboratory: 35,
  lighthouse: 40,
  rezervbase: 40,
  shoreline: 45,
  tarkovstreets: 50,
  woods: 40,
  gzLow: 35,
  gzHigh: 35,
};

export const bossPerformanceHash = {
  bossZryachiy: {
    BossChance: 50,
    BossEscortAmount: "0",
  },
  exUsec: {
    BossEscortAmount: "1",
    BossChance: 35,
  },
  skier: {
    BossEscortAmount: "2,2,3,3",
  },
  sectantPriest: {
    BossEscortAmount: "1,2,2",
  },
  bossBully: {
    BossEscortAmount: "2,3",
  },
  bossBoar: {
    BossEscortAmount: "1,2,2,2",
  },
  bossBoarSniper: {
    BossEscortAmount: "1",
  },
  bossKojaniy: {
    BossEscortAmount: "1,2,2",
  },
  bossPartisan: {
    BossEscortType: "assault",
    BossEscortAmount: "1,1,2",
    DependKarma: false,
    TriggerId: "",
    TriggerName: "",
    RandomTimeSpawn: true,
  },
  bossSanitar: {
    BossEscortAmount: "1,2,3",
  },
  peacemaker: {
    BossChance: 25,
    BossEscortAmount: "2,2,3,3,3,4",
  },
=======
    "bossKojaniy", "bossGluhar", "bossSanitar", "bossKilla", "bossTagilla",
    "bossKnight", "bossBoar", "bossKolontay", "bossPartisan", "bossBully"
];

/**
 * Default escape time (in minutes) per map.
 */
export const defaultEscapeTimes: Record<string, number> = {
    customs: 40,
    factoryDay: 20,
    factoryNight: 25,
    interchange: 40,
    laboratory: 35,
    lighthouse: 40,
    rezervbase: 40,
    shoreline: 45,
    tarkovstreets: 50,
    woods: 40,
    gzLow: 35,
    gzHigh: 35
};

/**
 * Optional boss spawn tuning by bot name.
 */
export const bossPerformanceHash: Record<string, Partial<{
    BossEscortAmount: string;
    BossEscortType: string;
    BossChance: number;
    DependKarma: boolean;
    TriggerId: string;
    TriggerName: string;
    RandomTimeSpawn: boolean;
}>> = {
    bossZryachiy: {
        BossChance: 50,
        BossEscortAmount: "0"
    },
    exUsec: {
        BossChance: 35,
        BossEscortAmount: "1"
    },
    skier: {
        BossEscortAmount: "2,2,3,3"
    },
    sectantPriest: {
        BossEscortAmount: "1,2,2"
    },
    bossBully: {
        BossEscortAmount: "2,3"
    },
    bossBoar: {
        BossEscortAmount: "1,2,2,2"
    },
    bossBoarSniper: {
        BossEscortAmount: "1"
    },
    bossKojaniy: {
        BossEscortAmount: "1,2,2"
    },
    bossPartisan: {
        BossEscortAmount: "1,1,2",
        BossEscortType: "assault",
        DependKarma: false,
        TriggerId: "",
        TriggerName: "",
        RandomTimeSpawn: true
    },
    bossSanitar: {
        BossEscortAmount: "1,2,3"
    },
    peacemaker: {
        BossChance: 25,
        BossEscortAmount: "2,2,3,3,3,4"
    }
>>>>>>> Stashed changes
};
