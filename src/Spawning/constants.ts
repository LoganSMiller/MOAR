import { IBotType } from "@spt/models/eft/common/tables/IBotType";
import { BossPerformanceOverride } from "../types";

/**
 * Hostility configuration between PMC factions and AI groups.
 * Forces PMCs to treat other AI and player factions as enemies.
 */
export const defaultHostility: IBotType["defaultSettings"]["BotHostility"] = [
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
];

/** Config map keys used across config.json and mapConfig.json */
export const configLocations = [
    "customs", "factoryDay", "factoryNight", "interchange", "laboratory",
    "lighthouse", "rezervbase", "shoreline", "tarkovstreets", "woods", "gzLow", "gzHigh"
] as const;

export type ConfigMapName = typeof configLocations[number];

/** Tarkov's internal location IDs used in location files */
export const originalMapList = [
    "bigmap", "factory4_day", "factory4_night", "interchange", "laboratory",
    "lighthouse", "rezervbase", "shoreline", "tarkovstreets", "woods", "sandbox", "sandbox_high"
] as const;

/** Bot types excluded from boss pool logic */
export const bossesToRemoveFromPool: Set<string> = new Set([
    "assault", "pmcBEAR", "pmcUSEC",
    "infectedAssault", "infectedTagilla", "infectedLaborant", "infectedCivil"
]);

/** All main boss types used for spawn logic */
export const mainBossNameList = [
    "bossKojaniy", "bossGluhar", "bossSanitar", "bossKilla", "bossTagilla",
    "bossKnight", "bossBoar", "bossKolontay", "bossPartisan", "bossBully"
] as const;

/** Default map escape durations in minutes */
export const defaultEscapeTimes: Record<ConfigMapName, number> = {
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

/** Optional tuning overrides for individual boss types */
export const bossPerformanceHash: Record<string, BossPerformanceOverride> = {
    bossZryachiy: { BossChance: 50, BossEscortAmount: "0" },
    exUsec:       { BossChance: 35, BossEscortAmount: "1" },
    skier:        { BossEscortAmount: "2,2,3,3" },
    sectantPriest:{ BossEscortAmount: "1,2,2" },
    bossBully:    { BossEscortAmount: "2,3" },
    bossBoar:     { BossEscortAmount: "1,2,2,2" },
    bossBoarSniper: { BossEscortAmount: "1" },
    bossKojaniy:  { BossEscortAmount: "1,2,2" },
    bossSanitar:  { BossEscortAmount: "1,2,3" },
    bossPartisan: {
        BossEscortAmount: "1,1,2",
        BossEscortType: "assault",
        DependKarma: false,
        TriggerId: "",
        TriggerName: "",
        RandomTimeSpawn: true
    },
    peacemaker: {
        BossChance: 25,
        BossEscortAmount: "2,2,3,3,3,4"
    }
};
