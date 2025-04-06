import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { EPlayerSide } from "@spt-aki/models/enums/EPlayerSide";
import { HealthPart, HealthPartList } from "./types";

/**
 * Enum-safe conversion of side strings to EPlayerSide numeric values.
 * Fallbacks to Savage (3) on error.
 */
function normalizeSpawnSide(side: string): EPlayerSide {
    switch (side.toLowerCase()) {
        case "usec":
            return EPlayerSide.Usec;
        case "bear":
            return EPlayerSide.Bear;
        case "savage":
        case "scav":
            return EPlayerSide.Savage;
        default:
            console.warn(`[MOAR] Unknown side: ${side}, defaulting to Savage`);
            return EPlayerSide.Savage;
    }
}

function normalizeSides(sides: string[]): EPlayerSide[] {
    return sides.map(normalizeSpawnSide);
}

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
 * Creates a boss wave spawn entry with safe defaults.
 */
export function buildBossBasedWave(
    chance: number,
    escortAmount: string,
    bossName: string,
    template: string,
    zone: string,
    escapeTimeLimit: number
): IBossLocationSpawn {
    const isScav = ["assault", "cursedassault", "crazyassaultevent"].includes(bossName.toLowerCase());
    const isRogueOrRaider = ["exusec", "pmcbot", "arenafighter", "arenafighterevent"].includes(bossName.toLowerCase());

    const rawSides = isScav ? ["Savage"] : ["Usec", "Bear"];
    const sides = normalizeSides(rawSides);

    return {
        BossChance: chance,
        BossEscortAmount: escortAmount,
        BossName: bossName,
        BossPlayer: false,
        BossZone: zone || "fallback_zone",
        BossEscortType: isScav ? "assault" : isRogueOrRaider ? "exUsec" : bossName,
        Difficulty: template,
        BossDifficult: template,
        BossEscortDifficult: template,
        SpawnAlways: false,
        SupportsBossName: "",
        TriggerId: "",
        TriggerName: "",
        Time: Math.floor(Math.random() * escapeTimeLimit),
        RandomTimeSpawn: false,
        ForceSpawn: false,
        IgnoreMaxBots: false,
        Sides: sides,
        BossEscort: [],
        UseDefaultSpawns: false,
        Visible: true,
        Supports: [],
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
        initialOffset = 0,
        isScav = false
    } = options;

    const waves: IBossLocationSpawn[] = [];
    const baseTime = count > 0 ? timeLimit / count : 0;
    const rawSides = isScav ? ["Savage"] : ["Usec", "Bear"];
    const sides = normalizeSides(rawSides);

    for (let i = 0; i < count; i++) {
        const offset = distribution === "random" ? Math.random() * 10 : 0;
        const rawTime = i * baseTime + offset;
        const time = initialOffset + safeTime(Math.round(rawTime));
        assertTimeSafe(time, `buildBotWaves (wave ${i})`);

        const wave: IBossLocationSpawn = {
            BossChance: groupChance,
            BossZone: zones.length > 0 ? zones[i % zones.length] : "fallbackZone",
            BossName: template,
            BossEscortType: isScav ? "assault" : "exUsec",
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
            Template: template,
            Sides: sides
        };

        waves.push(wave);
    }

    return waves;
}

/**
 * Builds a fixed set of zombie waves with template overrides.
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
            BossEscortType: "assault",
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
            Template: template,
            Sides: [EPlayerSide.Savage]
        });
    }

    return waves;
}

/**
 * Builds a health override object by percentage for all body parts.
 */
export function getHealthBodyPartsByPercentage(percentage: number): HealthPartList {
    const createPart = (hp: number): HealthPart => ({ Current: hp, Maximum: hp });

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
