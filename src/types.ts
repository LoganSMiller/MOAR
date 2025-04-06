/**
 * Core MOAR config structure, representing values from config.json.
 */
export interface MOARConfig {
    // === Preset toggles ===
    defaultPreset: string;
    enableBotSpawning: boolean;
    spawnSmoothing: boolean;
    randomSpawns: boolean;
    startingPmcs: boolean;

    // === Spawn control ===
    smoothingDistribution: number;
    spawnMinDistance: number;
    spawnMaxDistance: number;
    spawnRadius: number;
    spawnDelay: number;

    // === Difficulty tuning ===
    pmcDifficulty: number;
    scavDifficulty: number;
    zombieHealth: number;

    // === Wave quantity and distribution ===
    pmcWaveQuantity: number;
    scavWaveQuantity: number;
    zombieWaveQuantity: number;
    pmcWaveDistribution: number;
    scavWaveDistribution: number;
    zombieWaveDistribution: number;

    // === Grouping logic ===
    pmcGroupChance: number;
    scavGroupChance: number;
    sniperGroupChance: number;

    pmcMaxGroupSize: number;
    scavMaxGroupSize: number;
    sniperMaxGroupSize: number;

    // === Bot caps ===
    maxBotCap: number;
    maxBotPerZone: number;

    // === Boss spawning logic ===
    bossOpenZones: boolean;
    disableBosses: boolean;
    mainBossChanceBuff: number;
    bossInvasion: boolean;
    bossInvasionSpawnChance: number;
    gradualBossInvasion: boolean;
    enableBossOverrides: boolean;

    // === Raiders and Rogues ===
    randomRaiderGroup: boolean;
    randomRaiderGroupChance: number;
    randomRogueGroup: boolean;
    randomRogueGroupChance: number;

    // === Zombie and restriction toggles ===
    zombiesEnabled: boolean;
    forceHotzonesOnly: boolean;

    // === Optional systems ===
    scavMarksmenEnabled?: boolean;
    pmcWavesEnabled?: boolean;

    // === Debug options ===
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