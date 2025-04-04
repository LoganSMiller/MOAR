import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import rawBossConfig from "../../config/bossConfig.json";
import { BossChanceOverrides, MOARConfig } from "../types";
import advancedConfig from "../../config/advancedConfig.json";
import rawMapConfig from "../../config/mapConfig.json";

import {
    bossesToRemoveFromPool,
    bossPerformanceHash,
    configLocations,
    mainBossNameList
} from "./constants";

import { buildBossBasedWave } from "../spawnUtils";
import { cloneDeep, shuffle } from "../utils";
import { MapSettings } from "../types";

const mapConfig = rawMapConfig as Record<string, MapSettings>;

export function buildBossWaves(
    config: MOARConfig,
    locationList: ILocation[]
): void {
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

    const bossList = mainBossNameList.filter((b) => b !== "bossKnight");
    const allBosses: Record<string, IBossLocationSpawn> = {};
    const strongestBossPerName: Record<string, IBossLocationSpawn> = {};

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

        spawnList = spawnList.filter(
            (b: IBossLocationSpawn) => !bossesToRemoveFromPool.has(b.BossName)
        );

        if (advancedConfig.EnableBossPerformanceImprovements) {
            spawnList = spawnList.map((b: IBossLocationSpawn): IBossLocationSpawn => ({
                ...b,
                ...(bossPerformanceHash[b.BossName] || {})
            }));
        }

        if (randomRaiderGroup) {
            spawnList.push(buildBossBasedWave(
                randomRaiderGroupChance, "1,2,2,2,3", "pmcBot", "pmcBot", "", location.base.EscapeTimeLimit
            ));
        }

        if (randomRogueGroup) {
            spawnList.push(buildBossBasedWave(
                randomRogueGroupChance, "1,2,2,2,3", "exUsec", "exUsec", "", location.base.EscapeTimeLimit
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

    if (!disableBosses && bossInvasion) {
        for (const name of bossList) {
            if (strongestBossPerName[name] && bossInvasionSpawnChance) {
                strongestBossPerName[name].BossChance = bossInvasionSpawnChance;
            }
        }

        for (const loc of locationList) {
            const existing = new Set(loc.base.BossLocationSpawn.map((b: IBossLocationSpawn) => b.BossName));
            existing.add("bossKnight");

            const additions = shuffle(Object.values(strongestBossPerName))
                .filter((b: IBossLocationSpawn) => !existing.has(b.BossName))
                .map((b: IBossLocationSpawn, i: number): IBossLocationSpawn => {
                    const baseTime = i * 20 + 1;
                    return {
                        ...b,
                        BossZone: "",
                        BossEscortAmount: b.BossEscortAmount === "0" ? "0" : "1",
                        Time: gradualBossInvasion
                            ? baseTime
                            : typeof b.Time === "number" && !isNaN(b.Time) ? b.Time : 0
                    };
                });

            loc.base.BossLocationSpawn.push(...additions);
        }
    }

    let loggedHeader = false;

    for (let i = 0; i < configLocations.length; i++) {
        const mapName = configLocations[i];
        const spawns = locationList[i].base.BossLocationSpawn as IBossLocationSpawn[];

        if (!enableBossOverrides) continue;

        const bossConfig = rawBossConfig as Record<string, BossChanceOverrides>;
        const rawOverrides = cloneDeep(bossConfig[mapName] || {});
        const overrides: Record<string, number> = {};

        for (const [bossName, values] of Object.entries(rawOverrides)) {
            if (typeof values === "object" && typeof values.BossChance === "number") {
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
            .map((name): IBossLocationSpawn => {
                const spawn = cloneDeep(allBosses[name]!);
                spawn.BossChance = overrides[name];
                return spawn;
            });

        if (newBosses.length && debug?.logBossOverrides) {
            console.log(`[MOAR] Injected bosses into ${mapName}: ${newBosses.map(b => b.BossName).join(", ")}`);
        }

        spawns.push(...newBosses);

        locationList[i].base.BossLocationSpawn = spawns
            .map((b: IBossLocationSpawn): IBossLocationSpawn => {
                if (mainBossNameList.includes(b.BossName)) {
                    if (bossOpenZones) b.BossZone = "";
                    if (mainBossChanceBuff > 0 && b.BossChance < 100) {
                        b.BossChance = Math.min(100, Math.round(b.BossChance + mainBossChanceBuff));
                    }
                }

                const shouldSkip = (
                    b.BossChance < 1 ||
                    b.TriggerId ||
                    ["sectantPriest", "pmcBot"].includes(b.BossName)
                );

                b.Time = typeof b.Time === "number" && !isNaN(b.Time) ? b.Time : 0;

                if (!shouldSkip && b.BossChance < 100 && Math.random() > b.BossChance / 100) {
                    b.BossChance = 0;
                    b.ForceSpawn = false;
                    b.IgnoreMaxBots = false;
                } else {
                    b.BossChance = Math.max(1, Math.min(100, b.BossChance));
                }

                return b;
            })
            .filter((b: IBossLocationSpawn) => b.BossChance >= 1);
    }

    if (loggedHeader && debug?.logBossOverrides) {
        console.log("[MOAR] Boss override adjustment complete.");
    }
}