/**
 * Core MOAR config structure, representing values from config.json.
 */
export interface MOARConfig {
    // Preset selection and toggles
    defaultPreset: string;
    enableBotSpawning: boolean;
    spawnSmoothing: boolean;
    randomSpawns: boolean;
    startingPmcs: boolean;
    // Controls the distribution of spawn smoothing, affecting how evenly spawns are distributed over time.
    smoothingDistribution: number;
    // The minimum distance from the player at which bots can spawn.
    spawnMinDistance: number;
    // Maximum distance at which entities can spawn from the player.
    spawnMaxDistance: number; 
    
 

    // Difficulty tuning
    pmcDifficulty: number;
    scavDifficulty: number;
    zombieHealth: number;

    // Wave quantity controls
    pmcWaveQuantity: number;
    scavWaveQuantity: number;
    zombieWaveQuantity: number;

    // Wave distribution methods (e.g., even/random)
    pmcWaveDistribution: number;
    scavWaveDistribution: number;
    zombieWaveDistribution: number;

    // Grouping probabilities
    pmcGroupChance: number;
    scavGroupChance: number;
    sniperGroupChance: number;

    // Group size maximums
    pmcMaxGroupSize: number;
    scavMaxGroupSize: number;
    sniperMaxGroupSize: number;

    // Bot caps
    maxBotCap: number;
    maxBotPerZone: number;

    // Boss logic
    bossOpenZones: boolean;
    disableBosses: boolean;
    mainBossChanceBuff: number;
    bossInvasion: boolean;
    bossInvasionSpawnChance: number;
    gradualBossInvasion: boolean;
    enableBossOverrides: boolean;

    // Raider/Rogue random groups
    randomRaiderGroup: boolean;
    randomRaiderGroupChance: number;
    randomRogueGroup: boolean;
    randomRogueGroupChance: number;

    // Zombies and spawn restrictions
    zombiesEnabled: boolean;
    forceHotzonesOnly: boolean;

    // Optional system toggles
    scavMarksmenEnabled?: boolean;
    pmcWavesEnabled?: boolean;

    // Debug toggles
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

// Configuration for overriding boss performance settings, such as spawn chances, escort details, and triggers.
export interface BossPerformanceOverride {
    BossChance?: number;
    BossEscortAmount?: string;
    BossEscortType?: string;
    DependKarma?: boolean;
    TriggerId?: string;
    TriggerName?: string;
    RandomTimeSpawn?: boolean;
}
