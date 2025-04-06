import { EPlayerSide } from "@spt-aki/models/enums/EPlayerSide";
import { EBotType } from "@spt-aki/models/enums/EBotType";

/**
 * Valid bot side types (converted to EFT enum-safe numbers).
 */
export type Side = EPlayerSide;

/**
 * Valid bot categories as defined in EFT/SPT (e.g. assault, pmcBot, bossKilla).
 */
export type Category = EBotType;

/**
 * Parses a string into a valid EPlayerSide enum value.
 * Defaults to Savage if unrecognized.
 */
export function parseSide(value: string): EPlayerSide {
    switch (value.toLowerCase()) {
        case "usec":
            return EPlayerSide.Usec;
        case "bear":
            return EPlayerSide.Bear;
        case "scav":
        case "savage":
            return EPlayerSide.Savage;
        default:
            console.warn(`[MOAR] Unknown side '${value}', defaulting to Savage`);
            return EPlayerSide.Savage;
    }
}

/**
 * Parses a string into a valid EBotType category value.
 * Defaults to "assault" if unrecognized.
 */
export function parseCategory(value: string): EBotType {
    const lower = value.toLowerCase();
    const values = Object.values(EBotType) as string[];
    if (values.includes(lower)) {
        return lower as EBotType;
    }

    console.warn(`[MOAR] Unknown category '${value}', defaulting to 'assault'`);
    return EBotType.assault;
}

/**
 * Core MOAR config structure, representing values from config.json.
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

    debug: {
        enabled: boolean;
        logSpawnData: boolean;
        logBossOverrides: boolean;
    };
}

/**
 * A config preset that partially overrides the base config.
 */
export interface MOARPresetConfig extends Partial<MOARConfig> {
    label?: string;
    description?: string;
    enabled?: boolean;
}

/**
 * Health stats for a single body part.
 */
export interface HealthPart {
    Current: number;
    Maximum: number;
}

/**
 * Full health structure for a bot.
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
 * Boss override configuration (per boss).
 */
export interface BossChanceOverrides {
    [bossName: string]: {
        BossChance?: number;
        BossEscortAmountOverride?: number;
        BossEnabled?: boolean;
    };
}

/**
 * Optional map-specific tuning overrides.
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
 * Configuration for boss performance overrides.
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
