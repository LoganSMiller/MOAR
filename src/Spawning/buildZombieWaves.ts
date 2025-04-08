import { ILocation } from "@spt/models/eft/common/ILocation";
import { WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { IBots } from "@spt/models/spt/bots/IBots";

import mapConfig from "../../config/mapConfig.json";
import { configLocations, defaultEscapeTimes, validTemplates } from "./constants";
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

    for (const type of zombieTypes) {
        const template = bots.types?.[type];
        if (!template?.health?.BodyParts || !Array.isArray(template.health.BodyParts)) {
            if (debug?.enabled) {
                console.warn(`[MOAR] [ZOMBIE] Skipping health patch: missing BodyParts on bot template: ${type}`);
            }
            continue;
        }

        for (let i = 0; i < template.health.BodyParts.length; i++) {
            template.health.BodyParts[i] = zombieBodyParts;
        }

        if (debug?.enabled) {
            console.log(`[MOAR] [ZOMBIE] Patched health for bot type: ${type}`);
        }
    }

    const mapKeys = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;

    for (let index = 0; index < locationList.length; index++) {
        const mapId = configLocations[index] as keyof typeof mapConfig;
        const mapSetting: MapSettings = mapConfig[mapId];
        const location = locationList[index].base;

        const waveCount = mapSetting?.zombieWaveCount ?? 0;
        if (waveCount <= 0) {
            if (debug?.enabled) {
                console.warn(`[MOAR] [ZOMBIE] Skipping ${mapId}: no zombieWaveCount defined`);
            }
            continue;
        }

        const rawEscape = location.EscapeTimeLimit;
        const baseEscape = defaultEscapeTimes[mapId] ?? 45;
        const escapeTime = typeof rawEscape === "number" && !isNaN(rawEscape) ? rawEscape : baseEscape;
        const escapeRatio = Math.round(escapeTime / baseEscape);
        const totalWaves = Math.max(1, Math.round(waveCount * zombieWaveQuantity * escapeRatio));

        if (debug?.enabled) {
            console.log(`[MOAR] [ZOMBIE] ${mapId}: ${waveCount} × ${zombieWaveQuantity} × ${escapeRatio} = ${totalWaves}`);
        }

        const timeLimit = escapeTime * 60;
        const distribution = zombieWaveDistribution === 1 ? "random" : "even";
        const fallbackTemplate = WildSpawnType.cursedAssault;
        const zombieTemplate = validTemplates.includes("zombie") ? "zombie" : fallbackTemplate;

        const zombieWaves = buildZombie(totalWaves, timeLimit, distribution, 9999, zombieTemplate);

        if (debug?.enabled) {
            console.log(`[MOAR] [ZOMBIE] ${mapId}: Injecting ${zombieWaves.length} zombie waves using template: ${zombieTemplate}`);
        }

        const existing = location.BossLocationSpawn ?? [];
        const seen = new Set<string>();

        location.BossLocationSpawn = [...existing, ...zombieWaves].filter(wave => {
            wave.Time = typeof wave.Time === "number" && !isNaN(wave.Time) ? wave.Time : 0;
            const key = `${wave.BossName}-${wave.BossZone}-${wave.Time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}
