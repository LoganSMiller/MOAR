import { ILocation } from "@spt/models/eft/common/ILocation";
import { WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { IBots } from "@spt/models/spt/bots/IBots";

import mapConfig from "../../config/mapConfig.json";
import { configLocations, defaultEscapeTimes } from "./constants";
import { buildZombie, getHealthBodyPartsByPercentage, zombieTypes } from "../spawnUtils";
import { MapSettings, MOARConfig } from "../types";

/**
 * Builds and injects zombie waves into each map based on configured quantity, distribution, and health.
 */
export function buildZombieWaves(
    config: MOARConfig,
    locationList: ILocation[],
    bots: IBots
): void {
    const {
        debug,
        zombieWaveDistribution,
        zombieWaveQuantity,
        zombieHealth
    } = config;

    const zombieBodyParts = getHealthBodyPartsByPercentage(zombieHealth);

    //  Patch zombie health templates safely
    for (const type of zombieTypes) {
        const template = bots.types?.[type];
        const health = template?.health?.BodyParts;

        if (!health || !Array.isArray(health)) continue;

        for (let i = 0; i < health.length; i++) {
            health[i] = zombieBodyParts;
        }

        if (debug?.enabled) {
            console.log(`[MOAR] [ZOMBIE] Patched health for bot type: ${type}`);
        }
    }

    const mapSettingsList = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    for (let index = 0; index < locationList.length; index++) {
        const location = locationList[index].base;
        const mapId = configLocations[index] as keyof typeof mapConfig;
        const mapSetting: MapSettings = mapConfig[mapId];

        if (!mapSetting?.zombieWaveCount || mapSetting.zombieWaveCount <= 0) {
            if (debug?.enabled) {
                console.warn(`[MOAR] [ZOMBIE] Skipping ${mapId} — no valid zombieWaveCount in map config.`);
            }
            continue;
        }

        const rawEscape = location.EscapeTimeLimit;
        const baseEscape = defaultEscapeTimes[mapId] ?? 45;
        const escapeTime = (typeof rawEscape === "number" && !isNaN(rawEscape)) ? rawEscape : baseEscape;
        const escapeRatio = Math.round(escapeTime / baseEscape);
        const totalWaves = Math.round(mapSetting.zombieWaveCount * zombieWaveQuantity * escapeRatio);

        if (debug?.enabled && escapeRatio !== 1) {
            console.log(`[MOAR] [ZOMBIE] ${mapId} wave scaling: ${mapSetting.zombieWaveCount} × ${zombieWaveQuantity} × ${escapeRatio} = ${totalWaves}`);
        }

        const timeLimit = escapeTime * 60;
        const distribution = zombieWaveDistribution === 1 ? "random" : "even";

        const zombieWaves = buildZombie(
            totalWaves,
            timeLimit,
            distribution,
            9999 // Use high bot cap to prevent issues on high-density maps
        );

        if (debug?.enabled) {
            console.log(`[MOAR] [ZOMBIE] ${mapId} injected ${zombieWaves.length} zombie waves.`);
        }

        const existing = location.BossLocationSpawn ?? [];
        const seen = new Set<string>();

        //  Merge and deduplicate by BossName-Zone-Time
        location.BossLocationSpawn = [...existing, ...zombieWaves].filter(wave => {
            wave.Time = typeof wave.Time === "number" && !isNaN(wave.Time) ? wave.Time : 0;
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}
