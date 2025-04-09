import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

import { defaultEscapeTimes, defaultHostility, validTemplates } from "./constants";
import mapConfig from "../../config/mapConfig.json";
import { MapSettings, MOARConfig } from "../types";
import { buildBotWaves } from "../spawnUtils";
import { shuffle, looselyShuffle } from "../utils";
import globalValues from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";

/**
 * Resolves config.pmcDifficulty into a valid enum difficulty string.
 */
function resolveDifficulty(difficulty: number): string {
    if (difficulty < 1.5) return "easy";
    if (difficulty < 2.5) return "normal";
    if (difficulty < 3.5) return "hard";
    return "impossible";
}

/**
 * Builds and injects PMC waves into maps using zones near the player spawn.
 */
export default function buildPmcs(config: MOARConfig, locationList: ILocation[]): void {
    const mapKeys = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    for (let index = 0; index < locationList.length; index++) {
        const map = mapKeys[index];
        const location = locationList[index];
        const mapSettings: MapSettings = mapConfig[map];

        if (!mapSettings.allowPmcOnMap) {
            if (config.debug?.enabled) console.log(`[MOAR] [PMC] Skipping ${map} (PMCs disabled in config)`);
            continue;
        }

        const base = location?.base;
        if (!base || !Array.isArray(base.SpawnPointParams)) {
            console.warn(`[MOAR] [PMC] ${map} missing valid SpawnPointParams`);
            continue;
        }

        base.BotLocationModifier ??= { AdditionalHostilitySettings: [] };
        base.BotLocationModifier.AdditionalHostilitySettings = defaultHostility;

        const { pmcHotZones = [], pmcWaveCount = 1, initialSpawnDelay = 10 } = mapSettings;

        const referencePos = globalValues.playerSpawn?.Position ?? { x: 0, y: 0, z: 0 };

        let pmcZones: string[] = [];

        if (globalValues.coopSpawnZone) {
            pmcZones = Array(10).fill(globalValues.coopSpawnZone);
            if (config.debug?.enabled) {
                console.log(`[MOAR] [PMC] Coop group zone override: ${globalValues.coopSpawnZone}`);
            }
        } else {
            const spawnCandidates = base.SpawnPointParams.filter((p: ISpawnPointParam) =>
                p.Categories?.includes("Player") || p.Categories?.includes("Coop")
            );
            pmcZones = getSortedSpawnPointList(spawnCandidates, referencePos.x, referencePos.y, referencePos.z)
                .map(p => p.BotZoneName ?? "fallback_zone");
        }

        looselyShuffle(pmcZones, 3);

        if (map === "laboratory") {
            pmcZones = Array(10).fill(pmcZones).flat();
        }

        if (config.randomSpawns) {
            pmcZones = shuffle(pmcZones);
        }

        const escapeBase = typeof base.EscapeTimeLimit === "number" ? base.EscapeTimeLimit : defaultEscapeTimes[map] ?? 45;
        const timeLimit = escapeBase * 60;
        const escapeRatio = Math.round(escapeBase / (defaultEscapeTimes[map] ?? 45));
        const totalWaves = Math.max(1, Math.round(pmcWaveCount * config.pmcWaveQuantity * escapeRatio) + pmcHotZones.length);

        while (pmcZones.length < totalWaves) {
            pmcZones = [...pmcZones, ...pmcZones];
        }

        const zonesUsec = pmcZones.filter((_, i) => i % 2 === 0);
        const zonesBear = pmcZones.filter((_, i) => i % 2 !== 0);

        const usecTemplate = validTemplates.includes("pmcUsec") ? "pmcUsec" : "assault";
        const bearTemplate = validTemplates.includes("pmcBear") ? "pmcBear" : "assault";

        const distribution = config.pmcWaveDistribution === 1 ? "random" : "even";
        const half = Math.ceil(totalWaves / 2);

        const usecWaves = buildBotWaves({
            count: half,
            timeLimit,
            groupSize: config.pmcMaxGroupSize,
            groupChance: config.pmcGroupChance,
            zones: zonesUsec,
            difficulty: resolveDifficulty(config.pmcDifficulty),
            template: usecTemplate,
            forceSpawn: false,
            distribution,
            initialOffset: initialSpawnDelay + Math.round(Math.random() * 10)
        }, location);

        const bearWaves = buildBotWaves({
            count: half,
            timeLimit,
            groupSize: config.pmcMaxGroupSize,
            groupChance: config.pmcGroupChance,
            zones: zonesBear,
            difficulty: resolveDifficulty(config.pmcDifficulty),
            template: bearTemplate,
            forceSpawn: false,
            distribution,
            initialOffset: initialSpawnDelay + Math.round(Math.random() * 10)
        }, location);

        const mergedWaves: IBossLocationSpawn[] = [...(base.BossLocationSpawn ?? []), ...usecWaves, ...bearWaves];

        // Apply hotzones to some waves randomly
        if (pmcHotZones.length > 0) {
            for (const hotZone of pmcHotZones) {
                const wave = mergedWaves[Math.floor(Math.random() * mergedWaves.length)];
                wave.BossZone ||= hotZone;
            }
        }

        const seen = new Set<string>();
        base.BossLocationSpawn = mergedWaves.filter((wave): wave is IBossLocationSpawn => {
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            wave.Time = Number.isFinite(wave.Time) ? wave.Time : 0;
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance ?? 100));
            return true;
        });

        if (config.debug?.enabled) {
            console.log(`[MOAR] [PMC] ${map}: Final waves = ${base.BossLocationSpawn.length}`);
        }
    }
}
