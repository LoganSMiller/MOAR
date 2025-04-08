/**
 * Core MOAR config structure, sourced from config.json
 */
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

/**
 * Config preset override, partially extending base config
 */
export interface MOARPresetConfig extends Partial<MOARConfig> {
    [key: string]: unknown;
    label?: string;
    description?: string;
    enabled?: boolean;
}

/**
 * Health model for a single body part
 */
export interface HealthPart {
    Current: number;
    Maximum: number;
}

/**
 * Full body part health breakdown
 */
export interface HealthPartList {
    Head: HealthPart;
    Chest: HealthPart;
    Stomach: HealthPart;
    LeftArm: HealthPart;
    RightArm: HealthPart;
    LeftLeg: HealthPart;
    RightLeg: HealthPart;
}

/**
 * Per-boss override structure, e.g. per-map boss tuning
 */
export interface BossChanceOverrides {
    [bossName: string]: {
        BossChance?: number;
        BossEscortAmountOverride?: number;
        BossEnabled?: boolean;
    };
}

/**
 * Configurable values specific to one map
 */
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
}

/**
 * Optional boss performance tuning patch
 */
export interface BossPerformanceOverride {
    BossChance?: number;
    BossEscortAmount?: string;
    BossEscortType?: string;
    DependKarma?: boolean;
    TriggerId?: string;
    TriggerName?: string;
    RandomTimeSpawn?: boolean;
}

/**
 * Bot side types (used in ISpawnPointParam.Sides)
 */
export type Side = "Savage" | "Usec" | "Bear";

/**
 * Template roles used by MOAR for spawn logic
 */
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

/**
 * Difficulty modes applied to BossDifficult/BossEscortDifficult/etc.
 */
export type Difficulty = "easy" | "normal" | "hard" | "impossible";
