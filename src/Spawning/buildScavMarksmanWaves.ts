import { ILocation } from "@spt/models/eft/common/ILocation";
import { WildSpawnType, ISpawnPointParam, IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";

import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes, defaultHostility, validTemplates } from "./constants";
import { looselyShuffle, shuffle } from "../utils";
import { MapSettings, MOARConfig } from "../types";
import { buildBotWaves } from "../spawnUtils";
import getSortedSpawnPointList from "./spawnZoneUtils";
import globalValues from "../GlobalValues";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig.d";

/**
 * Injects scav and marksman (sniper) waves across all supported maps.
 */
export function buildScavMarksmanWaves(
    config: MOARConfig,
    locationList: ILocation[],
    botConfig: IBotConfig
): void {
    const mapSettingsList = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    for (let index = 0; index < locationList.length; index++) {
        const map = mapSettingsList[index];
        const mapSettings: MapSettings = mapConfig[map];

        globalValues.indexedMapSpawns ??= {};
        if (!globalValues.indexedMapSpawns[map]) {
            globalValues.indexedMapSpawns[map] = [];
            if (config.debug?.enabled) {
                console.warn(`[MOAR] Indexed spawns missing for ${map}, initialized empty.`);
            }
        }

        const location = locationList[index].base;
        location.BotLocationModifier ??= {};
        location.BotLocationModifier.AdditionalHostilitySettings = defaultHostility;


        const {
            scavHotZones = [],
            scavWaveCount = 1,
            sniperQuantity = 1,
            initialSpawnDelay = 10
        } = mapSettings;

        const { x, y, z } = globalValues.playerSpawn?.Position ?? { x: 0, y: 0, z: 0 };

        let scavZones = getSortedSpawnPointList(
            location.SpawnPointParams.filter(p => p.Categories?.includes("Bot")),
            x, y, z
        ).map(p => p.BotZoneName || "zone_scav_fallback");

        let sniperZones = getSortedSpawnPointList(
            location.SpawnPointParams.filter(p => p.Categories?.includes("Bot")),
            x, y, z
        ).map(p => p.BotZoneName || "zone_sniper_fallback");

        if (scavZones.length === 0) scavZones = ["zone_scav_fallback"];
        if (sniperZones.length === 0) sniperZones = ["zone_sniper_fallback"];

        looselyShuffle(scavZones, 3);
        looselyShuffle(sniperZones, 2);

        const escapeTime = typeof location.EscapeTimeLimit === "number" && !isNaN(location.EscapeTimeLimit)
            ? location.EscapeTimeLimit
            : defaultEscapeTimes[map] ?? 45;

        const escapeRatio = Math.round(escapeTime / (defaultEscapeTimes[map] ?? 45));
        const totalScavWaves = Math.max(1, Math.round(scavWaveCount * config.scavWaveQuantity * escapeRatio) + scavHotZones.length);
        const totalSniperWaves = Math.min(sniperQuantity, sniperZones.length);

        while (totalScavWaves > scavZones.length) {
            scavZones = [...scavZones, ...scavZones];
        }

        const timeLimit = escapeTime * 60;
        const assaultTemplate = validTemplates.includes("assault") ? "assault" : "assault";
        const marksmanTemplate = validTemplates.includes("marksman") ? "marksman" : "marksman";

        const scavWaves = buildBotWaves({
            count: totalScavWaves,
            timeLimit,
            groupSize: config.scavMaxGroupSize,
            groupChance: config.scavGroupChance,
            zones: config.randomSpawns ? shuffle(scavZones) : scavZones,
            difficulty: config.scavDifficulty.toString(),
            template: assaultTemplate,
            forceSpawn: false,
            distribution: config.scavWaveDistribution === 1 ? "random" : "even",
            initialOffset: initialSpawnDelay + Math.round(Math.random() * 10),
            isScav: true
        }, locationList[index]);

        const sniperWaves = buildBotWaves({
            count: totalSniperWaves,
            timeLimit,
            groupSize: config.sniperMaxGroupSize,
            groupChance: config.sniperGroupChance,
            zones: sniperZones,
            difficulty: config.scavDifficulty.toString(),
            template: marksmanTemplate,
            forceSpawn: false,
            distribution: "even",
            initialOffset: initialSpawnDelay + 15,
            isScav: true
        }, locationList[index]);

        const allScavs = [...scavWaves, ...sniperWaves];

        if (allScavs.length && scavHotZones.length) {
            for (const zone of scavHotZones) {
                const target = allScavs[Math.floor(Math.random() * allScavs.length)];
                if (!target.BossZone) {
                    target.BossZone = zone;
                }
            }
        }

        const existing = location.BossLocationSpawn ?? [];
        const seen = new Set<string>();

        const merged = [...existing, ...allScavs].filter((wave): wave is IBossLocationSpawn => {
            wave.Time = typeof wave.Time === "number" && !isNaN(wave.Time) ? wave.Time : 0;
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        location.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] ${map}: Added ${allScavs.length} Scav+Sniper waves, final count: ${merged.length}`);
        }
    }
}
