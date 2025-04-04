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
 * Builds PMC bot waves for each map using map-specific settings.
 */
export default function buildPmcs(
    config: MOARConfig,
    locationList: ILocation[]
): void {
    const mapSettingsList = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    if (mapSettingsList.length !== locationList.length) {
        console.warn(`[MOAR] Mismatch between map settings (${mapSettingsList.length}) and location list (${locationList.length})`);
    }

    for (let index = 0; index < locationList.length; index++) {
        const map = mapSettingsList[index];
        const mapSettings: MapSettings = mapConfig[map];

        if (!mapSettings.allowPmcOnMap) {
            if (config.debug?.enabled) {
                console.log(`[MOAR] [PMC] Skipping ${map} (allowPmcOnMap: false)`);
            }
            continue;
        }

        globalValues.indexedMapSpawns ??= {};
        if (!globalValues.indexedMapSpawns[map]) {
            globalValues.indexedMapSpawns[map] = [];
            if (config.debug?.enabled) {
                console.warn(`[MOAR] [PMC] Indexed spawns missing for ${map}, initialized.`);
            }
        }

        locationList[index].base.BotLocationModifier.AdditionalHostilitySettings = defaultHostility;

        const {
            pmcHotZones = [],
            pmcWaveCount = 1,
            initialSpawnDelay = 10
        } = mapSettings;

        if (!globalValues.playerSpawn && config.debug?.enabled) {
            console.warn(`[MOAR] [PMC] playerSpawn undefined for ${map}, fallback (0,0,0) used.`);
        }

        const { x, y, z } = globalValues.playerSpawn?.Position ?? { x: 0, y: 0, z: 0 };

        // Zone collection
        let pmcZones: string[] = [];

        if (globalValues.coopSpawnZone) {
            pmcZones = new Array(10).fill(globalValues.coopSpawnZone);
            if (config.debug?.enabled) {
                console.log(`[MOAR] [PMC] Forcing Coop group to zone: ${globalValues.coopSpawnZone}`);
            }
        } else {
            pmcZones = getSortedSpawnPointList(
                locationList[index].base.SpawnPointParams.filter((p: ISpawnPointParam) => p.type === "pmc"),
                x, y, z
            ).map((p: ISpawnPointParam) => p.BotZoneName || "fallback_zone");
        }

        looselyShuffle(pmcZones, 3);

        if (map === "laboratory") {
            pmcZones = new Array(10).fill(pmcZones).flat();
        }

        if (config.randomSpawns) {
            pmcZones = shuffle(pmcZones);
        }

        const escapeLimit = locationList[index].base.EscapeTimeLimit;
        const defaultTime = defaultEscapeTimes[map] ?? 45;
        const escapeRatio = Math.round((typeof escapeLimit === "number" && !isNaN(escapeLimit) ? escapeLimit : defaultTime) / defaultTime);

        let totalWaves = Math.round(pmcWaveCount * config.pmcWaveQuantity * escapeRatio);
        if (pmcHotZones.length && totalWaves > 0) {
            totalWaves += pmcHotZones.length;
        }

        // Duplicate zones to meet wave demand
        while (totalWaves > pmcZones.length) {
            pmcZones = pmcZones.length === 0 ? ["fallback_zone"] : [...pmcZones, ...pmcZones];
        }

        if (config.debug?.enabled) {
            console.log(`[MOAR] [PMC] ${map} total waves: ${totalWaves}`);
        }

        const rawTimeLimit = escapeLimit * 60;
        const timeLimit = Number.isFinite(rawTimeLimit) ? rawTimeLimit : 1800;
        const half = Math.ceil(totalWaves / 2);
        const waveDistribution = config.pmcWaveDistribution === 1 ? "random" : "even";

        const usecZones = pmcZones.filter((_, i) => i % 2 === 0);
        const bearZones = pmcZones.filter((_, i) => i % 2 !== 0);

        const initialOffsetUsec = initialSpawnDelay + Math.round(Math.random() * 10);
        const initialOffsetBear = initialSpawnDelay + Math.round(Math.random() * 10);

        const usecWaves = buildBotWaves({
            count: half,
            timeLimit,
            groupSize: config.pmcMaxGroupSize - 1,
            groupChance: config.pmcGroupChance,
            zones: usecZones,
            difficulty: config.pmcDifficulty.toString(),
            template: WildSpawnType.USEC,
            forceSpawn: false,
            distribution: waveDistribution,
            initialOffset: initialOffsetUsec
        }, locationList[index]);

        const bearWaves = buildBotWaves({
            count: half,
            timeLimit,
            groupSize: config.pmcMaxGroupSize - 1,
            groupChance: config.pmcGroupChance,
            zones: bearZones,
            difficulty: config.pmcDifficulty.toString(),
            template: WildSpawnType.BEAR,
            forceSpawn: false,
            distribution: waveDistribution,
            initialOffset: initialOffsetBear
        }, locationList[index]);

        const allPmcs: IBossLocationSpawn[] = [...usecWaves, ...bearWaves];

        // Apply hotzones to existing waves
        if (allPmcs.length && pmcHotZones.length) {
            for (const zone of pmcHotZones) {
                const targetIndex = Math.floor(Math.random() * allPmcs.length);
                if (!allPmcs[targetIndex].BossZone) {
                    allPmcs[targetIndex].BossZone = zone;
                }
            }
        }

        // Final safety/consistency pass
        for (const wave of allPmcs) {
            wave.Time = typeof wave.Time === "number" && !isNaN(wave.Time) ? wave.Time : 0;
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance || 100));
        }

        locationList[index].base.BossLocationSpawn.push(...allPmcs);
    }
}
