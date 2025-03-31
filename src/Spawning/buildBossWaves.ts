import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import bossConfig from "../../config/bossConfig.json";
import advancedConfig from "../../config/advancedConfig.json";
import mapConfig from "../../config/mapConfig.json";
import {
<<<<<<< Updated upstream
  bossesToRemoveFromPool,
  bossPerformanceHash,
  configLocations,
  mainBossNameList,
  originalMapList,
=======
    bossesToRemoveFromPool,
    bossPerformanceHash,
    configLocations,
    mainBossNameList
>>>>>>> Stashed changes
} from "./constants";
import { buildBossBasedWave, shuffle } from "./utils";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { cloneDeep } from "../utils";

<<<<<<< Updated upstream
export function buildBossWaves(
  config: typeof _config,
  locationList: ILocation[]
) {
  let {
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
  } = config;

  const bossList = mainBossNameList.filter(
    (bossName) => !["bossKnight"].includes(bossName)
  );

  const allBosses: Record<string, IBossLocationSpawn> = {};
  for (const key in locationList) {
    locationList[key].base.BossLocationSpawn.forEach((boss) => {
      if (!allBosses[boss.BossName]) {
        allBosses[boss.BossName] = boss;
      }
    });
  }

  // CreateBossList
  const bosses: Record<string, IBossLocationSpawn> = {};
  for (let indx = 0; indx < locationList.length; indx++) {
    // Disable Bosses
    if (disableBosses && !!locationList[indx].base?.BossLocationSpawn) {
      locationList[indx].base.BossLocationSpawn = [];
    } else {
      //Remove all other spawns from pool now that we have the spawns zone list
      locationList[indx].base.BossLocationSpawn = locationList[
        indx
      ].base.BossLocationSpawn.filter(
        (boss) => !bossesToRemoveFromPool.has(boss.BossName)
      );

      // Performance changes
      if (advancedConfig.EnableBossPerformanceImprovements) {
        locationList[indx].base.BossLocationSpawn.forEach((Boss, bIndex) => {
          if (Boss.BossChance < 1) return;
          if (!!bossPerformanceHash[Boss.BossName || ""]) {
            const varsToUpdate: Record<string, any> =
              bossPerformanceHash[Boss.BossName];

            locationList[indx].base.BossLocationSpawn[bIndex] = {
              ...Boss,
              ...varsToUpdate,
            };
          }
        });
      }

      const location = locationList[indx];

      const defaultBossSettings =
        mapConfig?.[configLocations[indx]]?.defaultBossSettings;

      // Sets bosses spawn chance from settings
      if (
        location?.base?.BossLocationSpawn &&
        defaultBossSettings &&
        Object.keys(defaultBossSettings)?.length
      ) {
        const filteredBossList = Object.keys(defaultBossSettings).filter(
          (name) => defaultBossSettings[name]?.BossChance !== undefined
        );
        if (filteredBossList?.length) {
          filteredBossList.forEach((bossName) => {
            location.base.BossLocationSpawn =
              location.base.BossLocationSpawn.map((boss) => ({
                ...boss,
                ...(boss.BossName === bossName
                  ? { BossChance: defaultBossSettings[bossName].BossChance }
                  : {}),
              }));
          });
        }
      }

      if (randomRaiderGroup) {
        const raiderWave = buildBossBasedWave(
          randomRaiderGroupChance,
          "1,2,2,2,3",
          "pmcBot",
          "pmcBot",
          "",
          locationList[indx].base.EscapeTimeLimit
        );
        location.base.BossLocationSpawn.push(raiderWave);
      }

      if (randomRogueGroup) {
        const rogueWave = buildBossBasedWave(
          randomRogueGroupChance,
          "1,2,2,2,3",
          "exUsec",
          "exUsec",
          "",
          locationList[indx].base.EscapeTimeLimit
        );
        location.base.BossLocationSpawn.push(rogueWave);
      }

      //Add each boss from each map to bosses object
      const filteredBosses = location.base.BossLocationSpawn?.filter(
        ({ BossName }) => mainBossNameList.includes(BossName)
      );

      if (filteredBosses.length) {
        for (let index = 0; index < filteredBosses.length; index++) {
          const boss = filteredBosses[index];
          if (
            !bosses[boss.BossName] ||
            (bosses[boss.BossName] &&
              bosses[boss.BossName].BossChance < boss.BossChance)
          ) {
            bosses[boss.BossName] = { ...boss };
          }
        }
      }
=======
export function buildBossWaves(config: typeof _config, locationList: ILocation[]): void {
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
        enableBossOverrides
    } = config;

    const bossList = mainBossNameList.filter(boss => boss !== "bossKnight");
    const allBosses: Record<string, IBossLocationSpawn> = {};

    for (const loc of locationList) {
        for (const boss of loc.base.BossLocationSpawn) {
            if (!allBosses[boss.BossName]) {
                allBosses[boss.BossName] = boss;
            }
        }
>>>>>>> Stashed changes
    }
  }

<<<<<<< Updated upstream
  if (!disableBosses) {
    // Make boss Invasion
    if (bossInvasion) {
      if (bossInvasionSpawnChance) {
        bossList.forEach((bossName) => {
          if (bosses[bossName])
            bosses[bossName].BossChance = bossInvasionSpawnChance;
        });
      }

      for (let key = 0; key < locationList.length; key++) {
        //Gather bosses to avoid duplicating.

        const duplicateBosses = [
          ...locationList[key].base.BossLocationSpawn.filter(
            ({ BossName, BossZone }) => bossList.includes(BossName)
          ).map(({ BossName }) => BossName),
          "bossKnight", // So knight doesn't invade
        ];

        //Build bosses to add
        const bossesToAdd = shuffle<IBossLocationSpawn[]>(Object.values(bosses))
          .filter(({ BossName }) => !duplicateBosses.includes(BossName))
          .map((boss, j) => ({
            ...boss,
            BossZone: "",
            BossEscortAmount:
              boss.BossEscortAmount === "0" ? boss.BossEscortAmount : "1",
            ...(gradualBossInvasion ? { Time: j * 20 + 1 } : {}),
          }));

        // UpdateBosses
        locationList[key].base.BossLocationSpawn = [
          ...locationList[key].base.BossLocationSpawn,
          ...bossesToAdd,
        ];
      }
    }
    let hasChangedBossSpawns = false;
    // console.log(Object.keys(allBosses));
    configLocations.forEach((mapName, index) => {
      const bossLocationSpawn = locationList[index].base.BossLocationSpawn;
      const mapBossConfig: Record<string, number> = cloneDeep(
        bossConfig[mapName] || {}
      );
      // if (Object.keys(mapBossConfig).length === 0) console.log(name, "empty");
      const adjusted = new Set<string>([]);

      bossLocationSpawn.forEach(({ BossName, BossChance }, bossIndex) => {
        if (typeof mapBossConfig[BossName] === "number") {
          if (BossChance !== mapBossConfig[BossName]) {
            if (!hasChangedBossSpawns) {
              console.log(
                `\n[MOAR]: --- Adjusting default boss spawn rates --- `
              );
              hasChangedBossSpawns = true;
            }
            console.log(
              `[MOAR]: ${mapName} ${BossName}: ${locationList[index].base.BossLocationSpawn[bossIndex].BossChance} => ${mapBossConfig[BossName]}`
            );
            locationList[index].base.BossLocationSpawn[bossIndex].BossChance =
              mapBossConfig[BossName];
          }
          adjusted.add(BossName);
        }
      });

      const bossesToAdd = Object.keys(mapBossConfig)
        .filter(
          (adjustName) => !adjusted.has(adjustName) && !!allBosses[adjustName]
        )
        .map((bossName) => {
          `[MOAR]: Adding non-default boss ${bossName} to ${originalMapList[index]}`;

          const newBoss: IBossLocationSpawn = cloneDeep(
            allBosses[bossName] || {}
          );
          newBoss.BossChance = mapBossConfig[bossName];
          // console.log(
          //   "Adding boss",
          //   bossName,
          //   "to ",
          //   originalMapList[index],
          //   "spawn chance =>",
          //   mapBossConfig[bossName]
          // );
          return newBoss;
        });

      // console.log(bossesToAdd);

      if (bossOpenZones || mainBossChanceBuff) {
        locationList[index].base?.BossLocationSpawn?.forEach((boss, key) => {
          if (bossList.includes(boss.BossName)) {
            if (bossOpenZones) {
              locationList[index].base.BossLocationSpawn[key] = {
                ...locationList[index].base.BossLocationSpawn[key],
                BossZone: "",
              };
            }

            if (!!boss.BossChance && mainBossChanceBuff > 0) {
              locationList[index].base.BossLocationSpawn[key] = {
                ...locationList[index].base.BossLocationSpawn[key],
                BossChance:
                  boss.BossChance + mainBossChanceBuff > 100
                    ? 100
                    : Math.round(boss.BossChance + mainBossChanceBuff),
              };
            }
          }
        });
      }

      locationList[index].base.BossLocationSpawn = [
        ...locationList[index].base.BossLocationSpawn,
        ...bossesToAdd,
      ];

      bossesToAdd.length &&
        console.log(
          `[MOAR] Adding the following bosses to map ${configLocations[index]
          }: ${bossesToAdd.map(({ BossName }) => BossName)}`
        );
      // console.log(locationList[index].base.BossLocationSpawn.length);

      const bossesToSkip = new Set(["sectantPriest", "pmcBot"]);
      // Apply the percentages on all bosses, cull those that won't spawn, make all bosses 100 chance that remain.
      locationList[index].base.BossLocationSpawn = locationList[
        index
      ].base.BossLocationSpawn.map(
        ({ BossChance, BossName, TriggerId }, bossIndex) => {
          if (BossChance < 1) {
            return locationList[index].base.BossLocationSpawn[bossIndex];
          }
          if (
            !TriggerId &&
            !bossesToSkip.has(BossName) &&
            BossChance < 100
          ) {
            if (
              BossChance / 100 < Math.random()) {
              locationList[index].base.BossLocationSpawn[
                bossIndex
              ].BossChance = 0;

              locationList[index].base.BossLocationSpawn[bossIndex].ForceSpawn =
                false;

              locationList[index].base.BossLocationSpawn[
                bossIndex
              ].IgnoreMaxBots = false;
            } else {
              locationList[index].base.BossLocationSpawn[
                bossIndex
              ].BossChance = 100;
=======
    const bosses: Record<string, IBossLocationSpawn> = {};

    for (let i = 0; i < locationList.length; i++) {
        const location = locationList[i];
        const spawnList = location.base.BossLocationSpawn;

        if (disableBosses) {
            location.base.BossLocationSpawn = [];
            continue;
        }

        location.base.BossLocationSpawn = spawnList.filter(b => !bossesToRemoveFromPool.has(b.BossName));

        if (advancedConfig.EnableBossPerformanceImprovements) {
            location.base.BossLocationSpawn = location.base.BossLocationSpawn.map(b => ({
                ...b,
                ...(bossPerformanceHash[b.BossName] || {})
            }));
        }

        const defaults = mapConfig?.[configLocations[i]]?.defaultBossSettings;
        if (defaults) {
            location.base.BossLocationSpawn = location.base.BossLocationSpawn.map(b => {
                const chance = defaults[b.BossName]?.BossChance;
                return chance !== undefined ? { ...b, BossChance: chance } : b;
            });
        }

        if (randomRaiderGroup) {
            location.base.BossLocationSpawn.push(
                buildBossBasedWave(randomRaiderGroupChance, "1,2,2,2,3", "pmcBot", "pmcBot", "", location.base.EscapeTimeLimit)
            );
        }

        if (randomRogueGroup) {
            location.base.BossLocationSpawn.push(
                buildBossBasedWave(randomRogueGroupChance, "1,2,2,2,3", "exUsec", "exUsec", "", location.base.EscapeTimeLimit)
            );
        }

        for (const boss of location.base.BossLocationSpawn) {
            if (mainBossNameList.includes(boss.BossName)) {
                const current = bosses[boss.BossName];
                if (!current || current.BossChance < boss.BossChance) {
                    bosses[boss.BossName] = { ...boss };
                }
>>>>>>> Stashed changes
            }
          }
          return locationList[index].base.BossLocationSpawn[bossIndex];
        }
      ).filter(({ BossChance, BossName, ...rest }) => {
        if (BossChance < 1) {
          return false;
        }
        return true
      });

      // if (mapName === "lighthouse") {
      //   console.log(
      //     locationList[index].base.BossLocationSpawn.map(
      //       ({ BossName, BossChance }) => ({ BossName, BossChance })
      //     )
      //   );
      // }

    });

    if (hasChangedBossSpawns) {
      console.log(
        `[MOAR]: --- Adjusting default boss spawn rates complete --- \n`
      );
    }
<<<<<<< Updated upstream
  }
=======

    if (!disableBosses && bossInvasion) {
        if (bossInvasionSpawnChance) {
            for (const name of bossList) {
                if (bosses[name]) bosses[name].BossChance = bossInvasionSpawnChance;
            }
        }

        for (const loc of locationList) {
            const existingNames = new Set(loc.base.BossLocationSpawn.map(b => b.BossName).concat("bossKnight"));
            const additions = shuffle(Object.values(bosses))
                .filter(b => !existingNames.has(b.BossName))
                .map((b, i) => ({
                    ...b,
                    BossZone: "",
                    BossEscortAmount: b.BossEscortAmount === "0" ? "0" : "1",
                    ...(gradualBossInvasion ? { Time: i * 20 + 1 } : {})
                }));

            loc.base.BossLocationSpawn.push(...additions);
        }
    }

    let logged = false;

    for (let i = 0; i < configLocations.length; i++) {
        const mapName = configLocations[i];
        const spawns = locationList[i].base.BossLocationSpawn;

        if (!enableBossOverrides) continue;

        const overrides = cloneDeep(bossConfig[mapName] || {});
        const applied = new Set<string>();

        for (const boss of spawns) {
            const overrideChance = overrides[boss.BossName];
            if (typeof overrideChance === "number") {
                if (boss.BossChance !== overrideChance) {
                    if (!logged) {
                        console.log("\n[MOAR]: --- Adjusting default boss spawn rates ---");
                        logged = true;
                    }
                    console.log(`[MOAR]: ${mapName} ${boss.BossName}: ${boss.BossChance} => ${overrideChance}`);
                    boss.BossChance = overrideChance;
                }
                applied.add(boss.BossName);
            }
        }

        const additions = Object.keys(overrides)
            .filter(name => !applied.has(name) && allBosses[name])
            .map(name => {
                const spawn = cloneDeep(allBosses[name]);
                spawn.BossChance = overrides[name];
                return spawn;
            });

        locationList[i].base.BossLocationSpawn = spawns.map(b => {
            if (mainBossNameList.includes(b.BossName)) {
                if (bossOpenZones) b.BossZone = "";
                if (b.BossChance && mainBossChanceBuff > 0) {
                    b.BossChance = Math.min(100, Math.round(b.BossChance + mainBossChanceBuff));
                }
            }
            return b;
        });

        locationList[i].base.BossLocationSpawn.push(...additions);

        if (additions.length) {
            console.log(`[MOAR] Added to ${mapName}: ${additions.map(b => b.BossName).join(", ")}`);
        }

        locationList[i].base.BossLocationSpawn = locationList[i].base.BossLocationSpawn
            .map(b => {
                if (b.BossChance >= 1 && !b.TriggerId && !["sectantPriest", "pmcBot"].includes(b.BossName)) {
                    const remove = b.BossChance < 100 && Math.random() > b.BossChance / 100;
                    if (remove) {
                        b.BossChance = 0;
                        b.ForceSpawn = false;
                        b.IgnoreMaxBots = false;
                    } else {
                        b.BossChance = 100;
                    }
                }
                return b;
            })
            .filter(b => b.BossChance >= 1);
    }

    if (logged) {
        console.log("[MOAR]: --- Adjusting default boss spawn rates complete ---\n");
    }
>>>>>>> Stashed changes
}
