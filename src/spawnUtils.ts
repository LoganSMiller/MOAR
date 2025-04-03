import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { HealthPart, HealthPartList } from "./types";

/**
 * Ensures a valid numeric time value; returns 0 if invalid.
 */
function safeTime(value: unknown): number {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) && !isNaN(num) ? num : 0;
}

/**
 * Logs a warning if a time value is unsafe — development only.
 */
function assertTimeSafe(value: number, context = "Unknown"): void {
    if (!Number.isFinite(value) || isNaN(value)) {
        console.warn(`[MOAR]  Unsafe time value detected in ${context}:`, value);
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
 * Configuration for a bot wave series.
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
 * Builds a series of bot waves (PMC, Scav, etc.).
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

        waves.push({
            BossChance: groupChance,
            BossZone: zones[i % zones.length] || "",
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
        });
    }

    location.base.BossLocationSpawn.push(...waves);
    return waves;
}

/**
 * Builds a fixed set of zombie waves.
 */
export function buildZombie(
    count: number,
    timeLimit: number,
    distribution: "even" | "random" = "even",
    groupId = 9999
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
            BossName: "cursedAssault",
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
            Template: "cursedAssault"
        });
    }

    return waves;
}

/**
 * Returns a health override configuration for zombie body parts.
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
 * Known zombie bot template types.
 */
export const zombieTypes: string[] = [
    "cursedAssault",
    "cursedAssaultTwo",
    "cursedAssaultBoss"
];
