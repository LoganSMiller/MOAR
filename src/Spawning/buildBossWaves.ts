import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";

import { MOARConfig } from "../types";
import {
    configLocations,
    bossPerformanceHash,
    validBosses,
    defaultEscapeTimes
} from "./constants";

import { buildBossBasedWave } from "../spawnUtils";

/**
 * Injects boss waves into each map based on MOAR config rules.
 * Supports main boss logic, boss invasions, and zone-aware injection.
 */
export function buildBossWaves(config: MOARConfig, locationList: ILocation[]): void {
    for (let i = 0; i < locationList.length; i++) {
        const location = locationList[i];
        const base = location?.base;
        const mapId = configLocations[i];

        if (!base || typeof base !== "object") {
            console.warn(`[MOAR] [Bosses] Skipping map at index ${i}: invalid base.`);
            continue;
        }

        const escapeTime = typeof base.EscapeTimeLimit === "number" && Number.isFinite(base.EscapeTimeLimit)
            ? base.EscapeTimeLimit
            : defaultEscapeTimes[mapId] ?? 45;

        const escapeTimeLimit = escapeTime * 60;
        const newWaves: IBossLocationSpawn[] = [];

        const zones = base.OpenZones?.split(",").filter(Boolean) ?? [];

        if (!zones.length && config.debug?.enabled) {
            console.warn(`[MOAR] [Bosses] No open zones found for ${mapId}, skipping boss injection.`);
        }

        for (const bossName of validBosses) {
            const perf = bossPerformanceHash[bossName] || {};
            const baseChance = perf.BossChance ?? 0;
            const bonus = config.mainBossChanceBuff ?? 0;
            const finalChance = Math.min(100, baseChance + bonus);

            const escortAmount = perf.BossEscortAmount ?? "0";

            // Inject boss invasion
            if (config.bossInvasion && config.bossInvasionSpawnChance > 0 && zones.length > 0) {
                const zone = zones[Math.floor(Math.random() * zones.length)];
                const wave = buildBossBasedWave(
                    config.bossInvasionSpawnChance,
                    escortAmount,
                    bossName,
                    "normal",
                    zone,
                    escapeTimeLimit
                );
                newWaves.push(wave);
            }

            // Inject main boss wave if enabled
            if (bonus > 0 && finalChance > 0 && zones.length > 0) {
                const zone = zones[Math.floor(Math.random() * zones.length)];
                const wave = buildBossBasedWave(
                    finalChance,
                    escortAmount,
                    bossName,
                    "normal",
                    zone,
                    escapeTimeLimit
                );
                newWaves.push(wave);
            }
        }

        const existing = base.BossLocationSpawn ?? [];
        const seen = new Set<string>();

        const merged = [...existing, ...newWaves].filter((wave): wave is IBossLocationSpawn => {
            const time = typeof wave.Time === "number" && Number.isFinite(wave.Time) ? wave.Time : 0;
            wave.Time = time;

            const key = `${wave.BossName}-${wave.BossZone}-${time}`;
            if (seen.has(key)) return false;

            seen.add(key);
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance ?? 100));
            return true;
        });

        base.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] [Bosses] ${mapId}: Injected ${newWaves.length} boss waves. Final total: ${merged.length}`);
        }
    }
}
