/**
 * === MOAR Mod Types ===
 * Shared types for config structure, spawn templates,
 * health overrides, wave building, and map-specific settings.
 */

// === Core Config ===
export interface MOARConfig {
    defaultPreset: string;
    enableBotSpawning: boolean;
    spawnSmoothing: boolean;
    randomSpawns: boolean;
    startingPmcs: boolean;

    smoothingDistribution: number;
    spawnMinDistance: number;
    spawnMaxDistance: number;
    spawnRadius: number;
    spawnDelay: number;

    pmcDifficulty: number;
    scavDifficulty: number;
    zombieHealth: number;

    pmcWaveQuantity: number;
    scavWaveQuantity: number;
    zombieWaveQuantity: number;

    pmcWaveDistribution: number;
    scavWaveDistribution: number;
    zombieWaveDistribution: number;

    pmcGroupChance: number;
    scavGroupChance: number;
    sniperGroupChance: number;

    pmcMaxGroupSize: number;
    scavMaxGroupSize: number;
    sniperMaxGroupSize: number;

    maxBotCap: number;
    maxBotPerZone: number;

    bossOpenZones: boolean;
    disableBosses: boolean;
    mainBossChanceBuff: number;
    bossInvasion: boolean;
    bossInvasionSpawnChance: number;
    gradualBossInvasion: boolean;
    enableBossOverrides: boolean;

    randomRaiderGroup: boolean;
    randomRaiderGroupChance: number;
    randomRogueGroup: boolean;
    randomRogueGroupChance: number;

    zombiesEnabled: boolean;
    forceHotzonesOnly: boolean;

    scavMarksmenEnabled?: boolean;
    pmcWavesEnabled?: boolean;

    debug?: {
        enabled: boolean;
        logSpawnData: boolean;
        logBossOverrides: boolean;
    };
}

// === Config Preset Override ===
export interface MOARPresetConfig extends Partial<MOARConfig> {
    label?: string;
    description?: string;
    enabled?: boolean;
    [key: string]: unknown;
}

// === Health Types ===
export interface HealthPart {
    Current: number;
    Maximum: number;
}

export interface HealthPartList {
    Head: HealthPart;
    Chest: HealthPart;
    Stomach: HealthPart;
    LeftArm: HealthPart;
    RightArm: HealthPart;
    LeftLeg: HealthPart;
    RightLeg: HealthPart;
}

// === Per-boss override (used in bossConfig) ===
export interface BossChanceOverrides {
    [bossName: string]: {
        BossChance?: number;
        BossEscortAmountOverride?: number;
        BossEnabled?: boolean;
    };
}

// === Boss performance override logic ===
export interface BossPerformanceOverride {
    BossChance?: number;
    BossEscortAmount?: string;
    BossEscortType?: string;
    DependKarma?: boolean;
    TriggerId?: string;
    TriggerName?: string;
    RandomTimeSpawn?: boolean;
}

// === Map-specific configuration overrides ===
export interface MapSettings {
    sniperQuantity?: number;
    initialSpawnDelay?: number;
    mapCullingNearPointValuePlayer?: number;
    mapCullingNearPointValue?: number;
    spawnMinDistance?: number;
    maxBotCapOverride?: number;
    maxBotPerZoneOverride?: number;
    pmcWaveCount?: number;
    scavWaveCount?: number;
    zombieWaveCount?: number;
    scavHotZones?: string[];
    pmcHotZones?: string[];
    escapeTimeOverride?: number;
    allowPmcOnMap?: boolean;
    sniperGroupChance?: number;
    sniperMaxGroupSize?: number;
}

// === Types used in wave + spawn building ===
export type Side = "Savage" | "Usec" | "Bear";

export type Difficulty = "easy" | "normal" | "hard" | "impossible";

export type Category =
    | "assault"
    | "pmcbot"
    | "exusec"
    | "bossBully"
    | "bossGluhar"
    | "bossKilla"
    | "bossKojaniy"
    | "bossSanitar"
    | "bossTagilla"
    | "followerBully"
    | "followerGluharAssault"
    | "followerGluharSecurity"
    | "followerGluharScout"
    | "followerKojaniy"
    | "followerSanitar"
    | "followerTagilla"
    | "marksman"
    | "cursedassault"
    | "arenafighter"
    | "arenafighterevent"
    | "crazyassaultevent";
