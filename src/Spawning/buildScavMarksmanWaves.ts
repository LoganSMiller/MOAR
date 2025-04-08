import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes, defaultHostility, validTemplates } from "./constants";
import { looselyShuffle, shuffle } from "../utils";
import { MapSettings, MOARConfig } from "../types";
import { buildBotWaves } from "../spawnUtils";
import getSortedSpawnPointList from "./spawnZoneUtils";
import globalValues from "../GlobalValues";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig.d";

/**
 * Safely builds and injects scav and marksman (sniper) waves across all supported maps.
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
                console.warn(`[MOAR] [ScavMarksman] Indexed spawns missing for ${map}, initialized.`);
            }
        }

        const locationBase = locationList[index]?.base;
        if (!locationBase) {
            console.warn(`[MOAR] [ScavMarksman] Skipping ${map} - base not found.`);
            continue;
        }

        locationBase.BotLocationModifier ??= { AdditionalHostilitySettings: [] };
        locationBase.BotLocationModifier.AdditionalHostilitySettings = defaultHostility;

        if (!Array.isArray(locationBase.SpawnPointParams) || locationBase.SpawnPointParams.length === 0) {
            if (config.debug?.enabled) {
                console.warn(`[MOAR] [ScavMarksman] ${map} missing SpawnPointParams. Skipping wave generation.`);
            }
            continue;
        }

        const {
            scavHotZones = [],
            scavWaveCount = 1,
            sniperQuantity = 1,
            initialSpawnDelay = 10
        } = mapSettings;

        const playerPos = globalValues.playerSpawn?.Position ?? { x: 0, y: 0, z: 0 };

        let scavZones = getSortedSpawnPointList(
            locationBase.SpawnPointParams.filter((p: ISpawnPointParam) =>
                p.Categories?.includes("Bot")
            ),
            playerPos.x, playerPos.y, playerPos.z
        ).map((p: ISpawnPointParam) => p.BotZoneName || "zone_scav_fallback");

        let sniperZones = getSortedSpawnPointList(
            locationBase.SpawnPointParams.filter((p: ISpawnPointParam) =>
                p.Categories?.includes("Bot")
            ),
            playerPos.x, playerPos.y, playerPos.z
        ).map((p: ISpawnPointParam) => p.BotZoneName || "zone_sniper_fallback");

        if (scavZones.length === 0) {
            scavZones = ["zone_scav_fallback"];
            if (config.debug?.enabled) {
                console.warn(`[MOAR] [ScavMarksman] ${map} - Defaulting scavZones to fallback.`);
            }
        }

        if (sniperZones.length === 0) {
            sniperZones = ["zone_sniper_fallback"];
            if (config.debug?.enabled) {
                console.warn(`[MOAR] [ScavMarksman] ${map} - Defaulting sniperZones to fallback.`);
            }
        }

        looselyShuffle(scavZones, 3);
        looselyShuffle(sniperZones, 2);

        const escapeTime = typeof locationBase.EscapeTimeLimit === "number" && !isNaN(locationBase.EscapeTimeLimit)
            ? locationBase.EscapeTimeLimit
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

        const scavWaves: IBossLocationSpawn[] = buildBotWaves({
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

        const sniperWaves: IBossLocationSpawn[] = buildBotWaves({
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

        const allScavs: IBossLocationSpawn[] = [...scavWaves, ...sniperWaves];

        if (allScavs.length && scavHotZones.length) {
            for (const zone of scavHotZones) {
                const target = allScavs[Math.floor(Math.random() * allScavs.length)];
                if (!target.BossZone) {
                    target.BossZone = zone;
                }
            }
        }

        const existing = locationBase.BossLocationSpawn ?? [];
        const seen = new Set<string>();

        const merged: IBossLocationSpawn[] = [...existing, ...allScavs].filter((wave: IBossLocationSpawn) => {
            wave.Time = typeof wave.Time === "number" && !isNaN(wave.Time) ? wave.Time : 0;
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance ?? 100));
            return true;
        });

        locationBase.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] [ScavMarksman] ${map}: Added ${allScavs.length} waves, final count: ${merged.length}`);
        }
    }
}
