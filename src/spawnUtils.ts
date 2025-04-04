import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { HealthPart, HealthPartList } from "./types";

/**
 * Ensures a valid numeric time value. Returns 0 if invalid.
 */
function safeTime(value: unknown): number {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) && !isNaN(num) ? num : 0;
}

/**
 * Logs a warning if a time value is unsafe. Dev-only.
 */
function assertTimeSafe(value: number, context = "Unknown"): void {
    if (!Number.isFinite(value) || isNaN(value)) {
        console.warn(`[MOAR] ⚠ Unsafe time value in ${context}:`, value);
    }
}

/**
 * Builds a single boss-style spawn wave.
 */
export function buildBossBasedWave(
    chance: number,
    escortAmount: string,
    bossName: string,
    template: string,
    zone: string = "",
    time: number = 15
): IBossLocationSpawn {
    const safe = safeTime(time);
    assertTimeSafe(safe, "buildBossBasedWave");

    return {
        BossChance: chance,
        BossZone: zone,
        BossName: bossName,
        BossEscortType: "followerTest",
        BossEscortAmount: escortAmount,
        BossEscortDifficult: "normal",
        BossDifficult: "normal",
        BossPlayer: false,
        BossEscort: [],
        TriggerId: "",
        TriggerName: "",
        UseDefaultSpawns: false,
        Visible: true,
        ForceSpawn: false,
        IgnoreMaxBots: false,
        Supports: [],
        Time: safe,
        Template: template
    };
}

/**
 * Configuration structure for a bot wave series.
 */
export interface BotWaveOptions {
    count: number;
    timeLimit: number;
    groupSize: number;
    groupChance: number;
    zones: string[];
    difficulty: string;
    template: string;
    forceSpawn?: boolean;
    distribution?: "even" | "random";
    initialOffset?: number;
    isScav?: boolean;
}

/**
 * Builds a list of waves (PMC, Scav, etc.) and returns them without side effects.
 * Caller is responsible for merging into BossLocationSpawn and deduplication.
 */
export function buildBotWaves(
    options: BotWaveOptions,
    location: { base: { BossLocationSpawn: IBossLocationSpawn[] } }
): IBossLocationSpawn[] {
    const {
        count,
        timeLimit,
        groupSize,
        groupChance,
        zones,
        difficulty,
        template,
        forceSpawn = false,
        distribution = "even",
        initialOffset = 0
    } = options;

    const waves: IBossLocationSpawn[] = [];
    const baseTime = count > 0 ? timeLimit / count : 0;

    for (let i = 0; i < count; i++) {
        const offset = distribution === "random" ? Math.random() * 10 : 0;
        const rawTime = i * baseTime + offset;
        const time = initialOffset + safeTime(Math.round(rawTime));
        assertTimeSafe(time, `buildBotWaves (wave ${i})`);

        const wave: IBossLocationSpawn = {
            BossChance: groupChance,
            BossZone: zones.length > 0 ? zones[i % zones.length] : "fallbackZone",
            BossName: template,
            BossEscortType: "followerTest",
            BossEscortAmount: groupSize > 0 ? `${groupSize}` : "0",
            BossEscortDifficult: difficulty,
            BossDifficult: difficulty,
            BossPlayer: false,
            BossEscort: [],
            TriggerId: "",
            TriggerName: "",
            UseDefaultSpawns: false,
            Visible: true,
            ForceSpawn: forceSpawn,
            IgnoreMaxBots: false,
            Supports: [],
            Time: time,
            Template: template
        };

        waves.push(wave);
    }

    return waves;
}

/**
 * Builds a fixed set of zombie waves with template overrides.
 * @param count - Number of waves
 * @param timeLimit - Total time span for the waves (seconds)
 * @param distribution - Even or random interval between waves
 * @param groupId - Unused, reserved for future group tracking
 * @param template - Bot template name (default: "cursedAssault")
 */
export function buildZombie(
    count: number,
    timeLimit: number,
    distribution: "even" | "random" = "even",
    groupId = 9999,
    template: string = "cursedAssault"
): IBossLocationSpawn[] {
    const waves: IBossLocationSpawn[] = [];
    const baseTime = count > 0 ? timeLimit / count : 0;

    for (let i = 0; i < count; i++) {
        const offset = distribution === "random" ? Math.random() * 10 : 0;
        const rawTime = i * baseTime + offset;
        const time = safeTime(Math.round(rawTime));
        assertTimeSafe(time, `buildZombie (wave ${i})`);

        waves.push({
            BossChance: 100,
            BossZone: "",
            BossName: template,
            BossEscortType: "followerTest",
            BossEscortAmount: "0",
            BossEscortDifficult: "easy",
            BossDifficult: "easy",
            BossPlayer: false,
            BossEscort: [],
            TriggerId: "",
            TriggerName: "",
            UseDefaultSpawns: false,
            Visible: true,
            ForceSpawn: false,
            IgnoreMaxBots: false,
            Supports: [],
            Time: time,
            Template: template
        });
    }

    return waves;
}

/**
 * Builds a health override object by percentage for all body parts.
 * Used for scaling zombie durability.
 */
export function getHealthBodyPartsByPercentage(percentage: number): HealthPartList {
    const createPart = (hp: number): HealthPart => ({
        Current: hp,
        Maximum: hp
    });

    return {
        Head: createPart(percentage),
        Chest: createPart(percentage),
        Stomach: createPart(percentage),
        LeftArm: createPart(percentage),
        RightArm: createPart(percentage),
        LeftLeg: createPart(percentage),
        RightLeg: createPart(percentage)
    };
}

/**
 * Known zombie bot template types for override processing.
 */
export const zombieTypes: string[] = [
    "cursedAssault",
    "cursedAssaultTwo",
    "cursedAssaultBoss"
];
