import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { HealthPart, HealthPartList } from "./types";

const fallbackZone = "fallback_zone";

/** Ensures a valid numeric time value. Returns 0 if invalid. */
function safeTime(value: unknown): number {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(num) && !isNaN(num)) return num;
    console.warn("[MOAR] ⚠ Invalid time value encountered. Defaulting to 0.");
    return 0;
}

/** Logs a warning if a time value is unsafe. Dev/debug use only. */
function assertTimeSafe(value: number, context = "Unknown"): void {
    if (!Number.isFinite(value) || isNaN(value)) {
        console.warn(`[MOAR] ⚠ Invalid time in ${context}:`, value);
    }
}

/** Options used to construct bot waves. */
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

/** Builds a boss-based spawn wave (used for bosses and invasions). */
export function buildBossBasedWave(
    chance: number,
    escortAmount: string,
    bossName: string,
    template: string,
    zone: string,
    escapeTimeLimit: number
): IBossLocationSpawn {
    const lowerName = bossName.toLowerCase();
    const isScav = ["assault", "cursedassault", "crazyassaultevent"].includes(lowerName);
    const isRogueOrRaider = ["exusec", "pmcbot", "arenafighter", "arenafighterevent"].includes(lowerName);

    const escortType = isScav ? "assault" : isRogueOrRaider ? "exUsec" : bossName;
    const sides: Array<"Savage" | "Usec" | "Bear"> = isScav ? ["Savage"] : ["Usec", "Bear"];
    const time = Math.floor(Math.random() * escapeTimeLimit);
    assertTimeSafe(time, "buildBossBasedWave");

    return {
        BossChance: chance,
        BossEscortAmount: escortAmount,
        BossName: bossName,
        BossPlayer: false,
        BossZone: zone || fallbackZone,
        BossEscortType: escortType,
        Difficulty: template,
        BossDifficult: template,
        BossEscortDifficult: template,
        SpawnAlways: false,
        SupportsBossName: "",
        TriggerId: "",
        TriggerName: "",
        Time: time,
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

/** Builds generic bot waves such as PMC/Scav using provided options. */
export function buildBotWaves(
    options: BotWaveOptions,
    location: { base: { BossLocationSpawn?: IBossLocationSpawn[] } }
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
    const escortType = isScav ? "assault" : "exUsec";
    const sides: Array<"Savage" | "Usec" | "Bear"> = isScav ? ["Savage"] : ["Usec", "Bear"];

    for (let i = 0; i < count; i++) {
        const offset = distribution === "random" ? Math.random() * 10 : 0;
        const rawTime = i * baseTime + offset;
        const waveTime = initialOffset + safeTime(Math.round(rawTime));
        assertTimeSafe(waveTime, `buildBotWaves (wave ${i})`);

        waves.push({
            BossChance: groupChance,
            BossZone: zones.length > 0 ? zones[i % zones.length] : fallbackZone,
            BossName: template,
            BossEscortType: escortType,
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
            Time: waveTime,
            Template: template,
            Sides: sides
        });
    }

    return waves;
}

/** Builds zombie waves with fixed attributes. */
export function buildZombie(
    count: number,
    timeLimit: number,
    distribution: "even" | "random" = "even",
    groupId = 9999,
    template = "cursedAssault"
): IBossLocationSpawn[] {
    const waves: IBossLocationSpawn[] = [];
    const baseTime = count > 0 ? timeLimit / count : 0;

    for (let i = 0; i < count; i++) {
        const offset = distribution === "random" ? Math.random() * 10 : 0;
        const rawTime = i * baseTime + offset;
        const waveTime = safeTime(Math.round(rawTime));
        assertTimeSafe(waveTime, `buildZombie (wave ${i})`);

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
            Time: waveTime,
            Template: template,
            Sides: ["Savage"]
        });
    }

    return waves;
}

/** Builds a health profile with all parts scaled to the given percentage. */
export function getHealthBodyPartsByPercentage(percentage: number): HealthPartList {
    const makePart = (value: number): HealthPart => ({ Current: value, Maximum: value });

    return {
        Head: makePart(percentage),
        Chest: makePart(percentage),
        Stomach: makePart(percentage),
        LeftArm: makePart(percentage),
        RightArm: makePart(percentage),
        LeftLeg: makePart(percentage),
        RightLeg: makePart(percentage)
    };
}

/** Bot templates considered to be zombie variants. */
export const zombieTypes = [
    "cursedAssault",
    "cursedAssaultTwo",
    "cursedAssaultBoss"
] as const;
