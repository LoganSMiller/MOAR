import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes, defaultHostility, validTemplates } from "./constants";
import { looselyShuffle, shuffle } from "../utils";
import { MapSettings, MOARConfig } from "../types";
import { buildBotWaves } from "../spawnUtils";
import getSortedSpawnPointList from "./spawnZoneUtils";
import globalValues from "../GlobalValues";

/**
 * Builds and injects PMC waves into the map.
 * Uses player spawn proximity or Coop spawn zone if available.
 */
export default function buildPmcs(
    config: MOARConfig,
    locationList: ILocation[]
): void {
    const mapSettingsList = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

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

        const locationBase = locationList[index]?.base;
        if (!locationBase) {
            console.warn(`[MOAR] [PMC] Skipping ${map} - base not found.`);
            continue;
        }

        locationBase.BotLocationModifier ??= { AdditionalHostilitySettings: [] };
        locationBase.BotLocationModifier.AdditionalHostilitySettings = defaultHostility;

        if (!Array.isArray(locationBase.SpawnPointParams) || locationBase.SpawnPointParams.length === 0) {
            if (config.debug?.enabled) {
                console.warn(`[MOAR] [PMC] ${map} missing SpawnPointParams. Skipping wave generation.`);
            }
            continue;
        }

        const {
            pmcHotZones = [],
            pmcWaveCount = 1,
            initialSpawnDelay = 10
        } = mapSettings;

        const playerPos = globalValues.playerSpawn?.Position ?? { x: 0, y: 0, z: 0 };

        let pmcZones: string[] = [];

        if (globalValues.coopSpawnZone) {
            pmcZones = new Array(10).fill(globalValues.coopSpawnZone);
            if (config.debug?.enabled) {
                console.log(`[MOAR] [PMC] Forcing Coop group to zone: ${globalValues.coopSpawnZone}`);
            }
        } else {
            const candidates: ISpawnPointParam[] = locationBase.SpawnPointParams.filter(
                (p: ISpawnPointParam) =>
                    p.Categories?.includes("Coop") || p.Categories?.includes("Player")
            );
            pmcZones = getSortedSpawnPointList(candidates, playerPos.x, playerPos.y, playerPos.z)
                .map((p: ISpawnPointParam) => p.BotZoneName || "fallback_zone");
        }

        looselyShuffle(pmcZones, 3);

        if (map === "laboratory") {
            pmcZones = new Array(10).fill(pmcZones).flat();
        }

        if (config.randomSpawns) {
            pmcZones = shuffle(pmcZones);
        }

        const escapeLimit = locationBase.EscapeTimeLimit;
        const baseTime = defaultEscapeTimes[map] ?? 45;
        const escapeRatio = Math.round((typeof escapeLimit === "number" ? escapeLimit : baseTime) / baseTime);
        const totalWaves = Math.max(1, Math.round(pmcWaveCount * config.pmcWaveQuantity * escapeRatio) + pmcHotZones.length);

        while (totalWaves > pmcZones.length) {
            pmcZones = [...pmcZones, ...pmcZones];
        }

        const UsecZones = pmcZones.filter((_, i) => i % 2 === 0);
        const BearZones = pmcZones.filter((_, i) => i % 2 !== 0);

        const UsecTemplate = validTemplates.includes("pmcUsec") ? "pmcUsec" : "assault";
        const BearTemplate = validTemplates.includes("pmcBear") ? "pmcBear" : "assault";

        const timeLimit = (typeof escapeLimit === "number" ? escapeLimit : baseTime) * 60;
        const waveDistribution = config.pmcWaveDistribution === 1 ? "random" : "even";
        const half = Math.ceil(totalWaves / 2);

        const UsecWaves: IBossLocationSpawn[] = buildBotWaves({
            count: half,
            timeLimit,
            groupSize: config.pmcMaxGroupSize,
            groupChance: config.pmcGroupChance,
            zones: UsecZones,
            difficulty: config.pmcDifficulty.toString(),
            template: UsecTemplate,
            forceSpawn: false,
            distribution: waveDistribution,
            initialOffset: initialSpawnDelay + Math.round(Math.random() * 10)
        }, locationList[index]);

        const BearWaves: IBossLocationSpawn[] = buildBotWaves({
            count: half,
            timeLimit,
            groupSize: config.pmcMaxGroupSize,
            groupChance: config.pmcGroupChance,
            zones: BearZones,
            difficulty: config.pmcDifficulty.toString(),
            template: BearTemplate,
            forceSpawn: false,
            distribution: waveDistribution,
            initialOffset: initialSpawnDelay + Math.round(Math.random() * 10)
        }, locationList[index]);

        const allPmcs: IBossLocationSpawn[] = [...UsecWaves, ...BearWaves];

        if (allPmcs.length && pmcHotZones.length) {
            for (const zone of pmcHotZones) {
                const idx = Math.floor(Math.random() * allPmcs.length);
                if (!allPmcs[idx].BossZone) {
                    allPmcs[idx].BossZone = zone;
                }
            }
        }

        const seen = new Set<string>();
        const existing = locationBase.BossLocationSpawn ?? [];

        const merged: IBossLocationSpawn[] = [...existing, ...allPmcs].filter((wave: IBossLocationSpawn) => {
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            wave.Time = typeof wave.Time === "number" && !isNaN(wave.Time) ? wave.Time : 0;
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance ?? 100));
            return true;
        });

        locationBase.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] [PMC] ${map} final wave count: ${merged.length}`);
        }
    }
}
