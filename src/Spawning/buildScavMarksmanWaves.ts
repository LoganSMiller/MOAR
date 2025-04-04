import { ILocation } from "@spt/models/eft/common/ILocation";
import { WildSpawnType, ISpawnPointParam, IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";

import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes, defaultHostility } from "./constants";
import { looselyShuffle, shuffle } from "../utils";
import { MapSettings, MOARConfig } from "../types";
import { buildBotWaves } from "../spawnUtils";
import getSortedSpawnPointList from "./spawnZoneUtils";
import globalValues from "../GlobalValues";

/**
 * Builds Scav and Marksman bot waves for each map using map-specific settings.
 */
export default function buildScavMarksmanWaves(
    config: MOARConfig,
    locationList: ILocation[]
): void {
    const mapSettingsList = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    for (let index = 0; index < locationList.length; index++) {
        const map = mapSettingsList[index];
        const mapSettings: MapSettings = mapConfig[map];

        // Ensure we have spawn data for this map
        globalValues.indexedMapSpawns ??= {};
        if (!globalValues.indexedMapSpawns[map]) {
            globalValues.indexedMapSpawns[map] = [];
            if (config.debug?.enabled) {
                console.warn(`[MOAR] Indexed spawns missing for ${map}, initialized empty.`);
            }
        }

        locationList[index].base.BotLocationModifier.AdditionalHostilitySettings = defaultHostility;

        const {
            scavHotZones = [],
            scavWaveCount = 1,
            sniperQuantity = 1,
            initialSpawnDelay = 10
        } = mapSettings;

        const { x, y, z } = globalValues.playerSpawn?.Position ?? { x: 0, y: 0, z: 0 };

        // Fetch valid scav/sniper zone names
        let scavZones = getSortedSpawnPointList(
            locationList[index].base.SpawnPointParams.filter((p: ISpawnPointParam) => p.type === "scav"),
            x, y, z
        ).map((p: ISpawnPointParam) => p.BotZoneName || "zone_scav_fallback");

        let sniperZones = getSortedSpawnPointList(
            locationList[index].base.SpawnPointParams.filter((p: ISpawnPointParam) => p.type === "sniper"),
            x, y, z
        ).map((p: ISpawnPointParam) => p.BotZoneName || "zone_sniper_fallback");

        looselyShuffle(scavZones, 3);
        looselyShuffle(sniperZones, 2);

        const escapeLimit = locationList[index].base.EscapeTimeLimit;
        const baseEscapeTime = defaultEscapeTimes[map] ?? 45;
        const escapeRatio = Math.round(
            (typeof escapeLimit === "number" && !isNaN(escapeLimit) ? escapeLimit : baseEscapeTime) / baseEscapeTime
        );

        let totalScavWaves = Math.round(scavWaveCount * config.scavWaveQuantity * escapeRatio);
        if (scavHotZones.length && totalScavWaves > 0) {
            totalScavWaves += scavHotZones.length;
        }

        while (totalScavWaves > scavZones.length) {
            scavZones = scavZones.length === 0 ? ["zone_scav_fallback"] : [...scavZones, ...scavZones];
        }

        const timeLimit = (typeof escapeLimit === "number" && !isNaN(escapeLimit) ? escapeLimit : baseEscapeTime) * 60;

        const scavWaves: IBossLocationSpawn[] = buildBotWaves({
            count: totalScavWaves,
            timeLimit,
            groupSize: config.scavMaxGroupSize,
            groupChance: config.scavGroupChance,
            zones: config.randomSpawns ? shuffle(scavZones) : scavZones,
            difficulty: config.scavDifficulty.toString(),
            template: WildSpawnType.ASSAULT,
            forceSpawn: false,
            distribution: config.scavWaveDistribution === 1 ? "random" : "even",
            initialOffset: initialSpawnDelay + Math.round(Math.random() * 10),
            isScav: true
        }, locationList[index]);

        const sniperWaves: IBossLocationSpawn[] = buildBotWaves({
            count: Math.min(sniperQuantity, sniperZones.length),
            timeLimit,
            groupSize: config.sniperMaxGroupSize,
            groupChance: config.sniperGroupChance,
            zones: sniperZones,
            difficulty: config.scavDifficulty.toString(),
            template: WildSpawnType.MARKSMAN,
            forceSpawn: false,
            distribution: "even",
            initialOffset: initialSpawnDelay + 15,
            isScav: true
        }, locationList[index]);

        const allScavs: IBossLocationSpawn[] = [...scavWaves, ...sniperWaves];

        // Randomly assign hot zones to some waves
        if (allScavs.length && scavHotZones.length) {
            for (const zone of scavHotZones) {
                const targetIndex = Math.floor(Math.random() * allScavs.length);
                if (!allScavs[targetIndex].BossZone) {
                    allScavs[targetIndex].BossZone = zone;
                }
            }
        }

        // Merge into boss spawn list while deduplicating
        const seen = new Set<string>();
        const existing = locationList[index].base.BossLocationSpawn ?? [];

        const merged = [...existing, ...allScavs].filter((boss): boss is IBossLocationSpawn => {
            boss.Time = typeof boss.Time === "number" && !isNaN(boss.Time) ? boss.Time : 0;
            const key = `${boss.BossName}-${boss.BossZone}-${boss.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        locationList[index].base.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] ${map}: Added ${allScavs.length} Scav+Sniper waves, final count: ${merged.length}`);
        }
    }
}
