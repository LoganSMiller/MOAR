import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";

import rawBossConfig from "../../config/bossConfig.json";
import advancedConfig from "../../config/advancedConfig.json";
import rawMapConfig from "../../config/mapConfig.json";

import {
    configLocations,
    mainBossNameList,
    bossesToRemoveFromPool,
    bossPerformanceHash,
    validBosses,
    validTemplates
} from "./constants";

import { BossChanceOverrides, MOARConfig, MapSettings } from "../types";
import { buildBossBasedWave } from "../spawnUtils";
import { cloneDeep, shuffle } from "../utils";

const mapConfig = rawMapConfig as Record<string, MapSettings>;

/**
 * Builds boss wave spawns, with full support for:
 * - Boss removal/overrides
 * - Random raider/rogue group injection
 * - Gradual boss invasion mode
 * - Boss performance tuning
 * - Custom spawn chances and forced zones
 */
export function buildBossWaves(config: MOARConfig, locationList: ILocation[]): void {
    const {
        randomRaiderGroup,
        randomRaiderGroupChance,
        randomRogueGroup,
        randomRogueGroupChance,
        mainBossChanceBuff,
        bossInvasion,
        bossInvasionSpawnChance,
        disableBosses,
        bossOpenZones,
        gradualBossInvasion,
        enableBossOverrides,
        debug
    } = config;

    const bossList = mainBossNameList.filter(b => b !== "bossKnight");
    const allBosses: Record<string, IBossLocationSpawn> = {};
    const strongestBossPerName: Record<string, IBossLocationSpawn> = {};

    // Build global boss reference map
    for (const loc of locationList) {
        for (const boss of loc.base.BossLocationSpawn ?? []) {
            if (boss.BossName && !allBosses[boss.BossName]) {
                allBosses[boss.BossName] = boss;
            }
        }
    }

    for (let i = 0; i < locationList.length; i++) {
        const location = locationList[i];
        const mapName = configLocations[i];
        const mapSettings = mapConfig[mapName];
        let spawnList = location.base.BossLocationSpawn ?? [];

        if (disableBosses) {
            location.base.BossLocationSpawn = [];
            continue;
        }

        // Remove invalid bosses
        spawnList = spawnList.filter(b => !bossesToRemoveFromPool.has(b.BossName));

        // Apply performance tuning
        if (advancedConfig.EnableBossPerformanceImprovements) {
            spawnList = spawnList.map(b => ({
                ...b,
                ...(bossPerformanceHash[b.BossName] || {})
            }));
        }

        // Inject raider/rogue wave
        if (randomRaiderGroup) {
            spawnList.push(buildBossBasedWave(
                randomRaiderGroupChance,
                "1,2,2,2,3",
                validBosses.includes("pmcBot") ? "pmcBot" : validBosses[0],
                validTemplates.includes("pmcBot") ? "pmcBot" : "normal",
                "",
                location.base.EscapeTimeLimit
            ));
        }

        if (randomRogueGroup) {
            spawnList.push(buildBossBasedWave(
                randomRogueGroupChance,
                "1,2,2,2,3",
                validBosses.includes("exUsec") ? "exUsec" : validBosses[0],
                validTemplates.includes("exUsec") ? "exUsec" : "normal",
                "",
                location.base.EscapeTimeLimit
            ));
        }

        for (const boss of spawnList) {
            if (mainBossNameList.includes(boss.BossName)) {
                const current = strongestBossPerName[boss.BossName];
                if (!current || current.BossChance < boss.BossChance) {
                    strongestBossPerName[boss.BossName] = { ...boss };
                }
            }
        }

        location.base.BossLocationSpawn = spawnList;
    }

    // Boss invasion mode
    if (!disableBosses && bossInvasion) {
        for (const name of bossList) {
            if (strongestBossPerName[name] && bossInvasionSpawnChance) {
                strongestBossPerName[name].BossChance = bossInvasionSpawnChance;
            }
        }

        for (const loc of locationList) {
            const existing = new Set(loc.base.BossLocationSpawn.map(b => b.BossName));
            existing.add("bossKnight");

            const additions = shuffle(Object.values(strongestBossPerName))
                .filter(b => !existing.has(b.BossName))
                .map((b, i) => ({
                    ...b,
                    BossZone: "",
                    BossEscortAmount: b.BossEscortAmount === "0" ? "0" : "1",
                    Time: gradualBossInvasion ? i * 20 + 1 : (typeof b.Time === "number" && !isNaN(b.Time) ? b.Time : 0)
                }));

            loc.base.BossLocationSpawn.push(...additions);
        }
    }

    let loggedHeader = false;

    for (let i = 0; i < configLocations.length; i++) {
        const mapName = configLocations[i];
        const spawns = locationList[i].base.BossLocationSpawn;

        if (!enableBossOverrides) continue;

        const bossConfig = rawBossConfig as Record<string, BossChanceOverrides>;
        const rawOverrides = cloneDeep(bossConfig[mapName] || {});
        const overrides: Record<string, number> = {};

        for (const [bossName, values] of Object.entries(rawOverrides)) {
            if (typeof values?.BossChance === "number") {
                overrides[bossName] = values.BossChance;
            }
        }

        const applied = new Set<string>();
        for (const boss of spawns) {
            const overrideChance = overrides[boss.BossName];
            if (typeof overrideChance === "number") {
                if (!loggedHeader && debug?.logBossOverrides) {
                    console.log("[MOAR] Applying boss override values...");
                    loggedHeader = true;
                }
                if (debug?.logBossOverrides) {
                    console.log(`[MOAR] ${mapName} ${boss.BossName}: ${boss.BossChance} → ${overrideChance}`);
                }
                boss.BossChance = overrideChance;
                applied.add(boss.BossName);
            }
        }

        const newBosses = Object.keys(overrides)
            .filter(name => !applied.has(name) && allBosses[name])
            .map(name => {
                const spawn = cloneDeep(allBosses[name]!);
                spawn.BossChance = overrides[name];
                return spawn;
            });

        if (newBosses.length && debug?.logBossOverrides) {
            console.log(`[MOAR] Injected bosses into ${mapName}: ${newBosses.map(b => b.BossName).join(", ")}`);
        }

        spawns.push(...newBosses);

        locationList[i].base.BossLocationSpawn = spawns
            .map(b => {
                if (mainBossNameList.includes(b.BossName)) {
                    if (bossOpenZones) b.BossZone = "";
                    if (mainBossChanceBuff > 0 && b.BossChance < 100) {
                        b.BossChance = Math.min(100, Math.round(b.BossChance + mainBossChanceBuff));
                    }
                }

                b.Time = typeof b.Time === "number" && !isNaN(b.Time) ? b.Time : 0;

                const shouldSkip = (
                    b.BossChance < 1 ||
                    b.TriggerId ||
                    ["sectantPriest", "pmcBot"].includes(b.BossName)
                );

                if (!shouldSkip && b.BossChance < 100 && Math.random() > b.BossChance / 100) {
                    b.BossChance = 0;
                    b.ForceSpawn = false;
                    b.IgnoreMaxBots = false;
                } else {
                    b.BossChance = Math.max(1, Math.min(100, b.BossChance));
                }

                return b;
            })
            .filter(b => b.BossChance >= 1);
    }

    if (loggedHeader && debug?.logBossOverrides) {
        console.log("[MOAR] Boss override adjustment complete.");
    }
}
