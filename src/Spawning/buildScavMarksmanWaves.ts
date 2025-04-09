import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";

import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes } from "./constants";
import { MapSettings, MOARConfig } from "../types";
import { buildBotWaves } from "../spawnUtils";
import globalValues from "../GlobalValues";

/**
 * Converts a numeric value to a difficulty string recognized by the game.
 */
function resolveDifficulty(value: number): string {
    if (value < 1.5) return "easy";
    if (value < 2.5) return "normal";
    if (value < 3.5) return "hard";
    return "impossible";
}

/**
 * Generates and injects Scav Marksman sniper-style bot waves.
 */
export function buildScavMarksmanWaves(
    config: MOARConfig,
    locationList: ILocation[],
    botConfig: IBotConfig
): void {
    const mapKeys = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    for (let i = 0; i < locationList.length; i++) {
        const map = mapKeys[i];
        const location = locationList[i];
        const mapSettings: MapSettings = mapConfig[map];
        const base = location?.base;

        if (!config.scavMarksmenEnabled) continue;
        if (!base || !Array.isArray(base.SpawnPointParams)) continue;

        const {
            scavHotZones = [],
            sniperGroupChance = config.sniperGroupChance,
            sniperMaxGroupSize = config.sniperMaxGroupSize
        } = mapSettings;

        const escapeMinutes = typeof base.EscapeTimeLimit === "number" && Number.isFinite(base.EscapeTimeLimit)
            ? base.EscapeTimeLimit
            : defaultEscapeTimes[map] ?? 45;

        const timeLimit = escapeMinutes * 60;
        const count = Math.max(1, Math.round(config.scavWaveQuantity));

        const sniperZones = scavHotZones.length > 0
            ? scavHotZones
            : base.SpawnPointParams
                .filter(p => p.BotZoneName?.toLowerCase().includes("snipe"))
                .map(p => p.BotZoneName ?? "fallback_zone");

        if (sniperZones.length === 0 && config.debug?.enabled) {
            console.warn(`[MOAR] [Scav Marksman] No sniper zones found for ${map}`);
        }

        const waves: IBossLocationSpawn[] = buildBotWaves({
            count,
            timeLimit,
            groupSize: sniperMaxGroupSize,
            groupChance: sniperGroupChance,
            zones: sniperZones,
            difficulty: resolveDifficulty(config.scavDifficulty),
            template: "marksman",
            forceSpawn: false,
            distribution: config.scavWaveDistribution === 1 ? "random" : "even",
            initialOffset: Math.floor(Math.random() * 20)
        }, location);

        const seen = new Set<string>();
        const existing = base.BossLocationSpawn ?? [];

        const merged: IBossLocationSpawn[] = [...existing, ...waves].filter((wave): wave is IBossLocationSpawn => {
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance ?? 100));
            wave.Time = Number.isFinite(wave.Time) ? wave.Time : 0;
            return true;
        });

        base.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] [Scav Marksman] ${map}: Added ${waves.length} sniper waves. Final: ${merged.length}`);
        }
    }
}
