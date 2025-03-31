<<<<<<< Updated upstream
import {
  IBossLocationSpawn,
  IWave,
  WildSpawnType,
} from "@spt/models/eft/common/ILocationBase";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations, defaultEscapeTimes } from "./constants";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export const waveBuilder = (
  totalWaves: number,
  timeLimit: number,
  waveDistribution: number,
  wildSpawnType: "marksman" | "assault",
  difficulty: number,
  isPlayer: boolean,
  maxSlots: number,
  combinedZones: string[] = [],
  specialZones: string[] = [],
  offset?: number,
  starting?: boolean,
  moreGroups?: boolean
=======
import { IBossLocationSpawn, IWave, WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { ILocation } from "@spt/models/eft/common/ILocation";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { configLocations, defaultEscapeTimes } from "./constants";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";

// ==============================
// WAVE & ZOMBIE BUILDERS
// ==============================

export const buildBossBasedWave = (
    BossChance: number,
    BossEscortAmount: string,
    BossEscortType: string,
    BossName: string,
    BossZone: string,
    raidTime?: number
): IBossLocationSpawn => ({
    BossChance,
    BossDifficult: "normal",
    BossEscortAmount,
    BossEscortDifficult: "normal",
    BossEscortType,
    BossName,
    BossPlayer: false,
    BossZone,
    Delay: 0,
    ForceSpawn: false,
    IgnoreMaxBots: true,
    RandomTimeSpawn: false,
    Time: raidTime ? Math.round(Math.random() * raidTime * 5) : -1,
    Supports: null,
    TriggerId: "",
    TriggerName: "",
    spawnMode: ["regular", "pve"]
});

export const waveBuilder = (
    totalWaves: number,
    timeLimit: number,
    waveDistribution: number,
    wildSpawnType: "marksman" | "assault",
    difficulty: number,
    isPlayer: boolean,
    maxSlots: number,
    combinedZones: string[] = [],
    specialZones: string[] = [],
    offset = 0,
    starting = false,
    moreGroups = false
>>>>>>> Stashed changes
): IWave[] => {
  if (totalWaves === 0) return [];

<<<<<<< Updated upstream
  const averageTime = timeLimit / totalWaves;
  const firstHalf = Math.round(averageTime * (1 - waveDistribution));
  const secondHalf = Math.round(averageTime * (1 + waveDistribution));
  let timeStart = offset || 0;
  const waves: IWave[] = [];
  let maxSlotsReached = Math.round(1.3 * totalWaves);
  while (
    totalWaves > 0 &&
    (waves.length < totalWaves || specialZones.length > 0)
  ) {
    const accelerate = totalWaves > 5 && waves.length < totalWaves / 3;
    const stage = Math.round(
      waves.length < Math.round(totalWaves * 0.5)
        ? accelerate
          ? firstHalf / 3
          : firstHalf
        : secondHalf
    );

    const min = !offset && waves.length < 1 ? 0 : timeStart;
    const max = !offset && waves.length < 1 ? 0 : timeStart + 60;

    if (waves.length >= 1 || offset) timeStart = timeStart + stage;
    const BotPreset = getDifficulty(difficulty);
    // console.log(wildSpawnType, BotPreset);
    // Math.round((1 - waves.length / totalWaves) * maxSlots) || 1;
    let slotMax = Math.round(
      (moreGroups ? Math.random() : Math.random() * Math.random()) * maxSlots
    );

    if (slotMax < 1) slotMax = 1;
    let slotMin = (Math.round(Math.random() * slotMax) || 1) - 1;

    if (wildSpawnType === "marksman" && slotMin < 1) slotMin = 1;
    waves.push({
      BotPreset,
      BotSide: getBotSide(wildSpawnType),
      SpawnPoints: getZone(
        specialZones,
        combinedZones,
        waves.length >= totalWaves
      ),
      isPlayers: isPlayer,
      slots_max: slotMax,
      slots_min: slotMin,
      time_min: min,
      time_max: max,
      WildSpawnType: wildSpawnType as WildSpawnType,
      number: waves.length,
      sptId: wildSpawnType + waves.length,
      SpawnMode: ["regular", "pve"],
    });
    maxSlotsReached -= slotMax;
    // if (wildSpawnType === "assault") console.log(slotMax, maxSlotsReached);
    if (maxSlotsReached <= 0) break;
  }
  // console.log(waves.map(({ slots_min }) => slots_min));
  return waves;
};

const getZone = (specialZones, combinedZones, specialOnly) => {
  if (!specialOnly && combinedZones.length)
    return combinedZones[
      Math.round((combinedZones.length - 1) * Math.random())
    ];
  if (specialZones.length) return specialZones.pop();
  return "";
};

export const getDifficulty = (diff: number) => {
  const randomNumb = Math.random() + diff;
  switch (true) {
    case randomNumb < 0.55:
      return "easy";
    case randomNumb < 1.4:
      return "normal";
    case randomNumb < 1.85:
      return "hard";
    default:
      return "impossible";
  }
};

export const shuffle = <n>(array: any): n => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const getBotSide = (
  spawnType: "marksman" | "assault" | "pmcBEAR" | "pmcUSEC"
) => {
  switch (spawnType) {
    case "pmcBEAR":
      return "Bear";
    case "pmcUSEC":
      return "Usec";
    default:
      return "Savage";
  }
};

export const buildBossBasedWave = (
  BossChance: number,
  BossEscortAmount: string,
  BossEscortType: string,
  BossName: string,
  BossZone: string,
  raidTime?: number
): IBossLocationSpawn => {
  return {
    BossChance,
    BossDifficult: "normal",
    BossEscortAmount,
    BossEscortDifficult: "normal",
    BossEscortType,
    BossName,
    BossPlayer: false,
    BossZone,
    Delay: 0,
    ForceSpawn: false,
    IgnoreMaxBots: true,
    RandomTimeSpawn: false,
    Time: raidTime ? Math.round(Math.random() * (raidTime * 5)) : -1,
    Supports: null,
    TriggerId: "",
    TriggerName: "",
    spawnMode: ["regular", "pve"],
  };
};

export const zombieTypes = [
  "infectedassault",
  "infectedpmc",
  "infectedlaborant",
  "infectedcivil",
];

export const zombieTypesCaps = [
  "infectedAssault",
  "infectedPmc",
  "infectedLaborant",
  "infectedCivil",
];

export const getRandomDifficulty = (num: number = 1.5) =>
  getDifficulty(Math.round(Math.random() * num * 10) / 10);

export const getRandomZombieType = () =>
  zombieTypesCaps[Math.round((zombieTypesCaps.length - 1) * Math.random())];

=======
    const waves: IWave[] = [];
    const avgTime = timeLimit / totalWaves;
    const firstHalf = Math.round(avgTime * (1 - waveDistribution));
    const secondHalf = Math.round(avgTime * (1 + waveDistribution));

    let timeStart = offset;
    let maxSlotsRemaining = Math.round(1.3 * totalWaves);

    while (waves.length < totalWaves || specialZones.length > 0) {
        const early = waves.length < totalWaves / 3 && totalWaves > 5;
        const spacing = waves.length < totalWaves / 2
            ? early ? Math.round(firstHalf / 3) : firstHalf
            : secondHalf;

        const min = waves.length === 0 && !offset ? 0 : timeStart;
        const max = min + 60;

        if (waves.length >= 1 || offset) {
            timeStart += spacing;
        }

        let slots = Math.round(
            (moreGroups ? Math.random() : Math.random() ** 2) * maxSlots
        );
        if (slots < 1) slots = 1;
        let minSlots = Math.max(0, Math.round(Math.random() * slots) - 1);
        if (wildSpawnType === "marksman") minSlots = 1;

        waves.push({
            BotPreset: getDifficulty(difficulty),
            BotSide: getBotSide(wildSpawnType),
            SpawnPoints: getZone(specialZones, combinedZones, waves.length >= totalWaves),
            isPlayers: isPlayer,
            slots_max: slots,
            slots_min: minSlots,
            time_min: min,
            time_max: max,
            WildSpawnType: wildSpawnType as WildSpawnType,
            number: waves.length,
            sptId: wildSpawnType + waves.length,
            SpawnMode: ["regular", "pve"]
        });

        maxSlotsRemaining -= slots;
        if (maxSlotsRemaining <= 0) break;
    }

    return waves;
};

export const buildZombie = (
    botTotal: number,
    escapeTimeLimit: number,
    botDistribution: number,
    BossChance: number = 100
): IBossLocationSpawn[] => {
    if (!botTotal) return [];

    const waves: IBossLocationSpawn[] = [];
    const startTime = botDistribution > 1
        ? Math.round((botDistribution - 1) * escapeTimeLimit)
        : 0;

    const duration = botDistribution < 1
        ? Math.round(escapeTimeLimit * botDistribution)
        : Math.round(escapeTimeLimit - startTime);

    const interval = Math.max(5, Math.round(duration / botTotal));
    let currentTime = startTime;
    let remaining = botTotal;

    while (remaining > 0) {
        const groupChance = Math.random() < 0.2;
        let escorts = groupChance ? Math.floor(Math.random() * 5) : 0;

        const total = escorts + 1;
        const main = getRandomZombieType();

        waves.push({
            BossChance,
            BossDifficult: "normal",
            BossEscortAmount: "0",
            BossEscortDifficult: "normal",
            BossEscortType: main,
            BossName: main,
            BossPlayer: false,
            BossZone: "",
            Delay: 0,
            IgnoreMaxBots: false,
            RandomTimeSpawn: false,
            Time: currentTime,
            Supports: escorts > 0
                ? Array(escorts).fill(null).map(() => ({
                    BossEscortType: getRandomZombieType(),
                    BossEscortDifficult: ["normal"],
                    BossEscortAmount: "1"
                }))
                : null,
            TriggerId: "",
            TriggerName: "",
            spawnMode: ["regular", "pve"]
        });

        currentTime += total * interval;
        remaining -= total;
    }

    return waves;
};

>>>>>>> Stashed changes
export const buildBotWaves = (
  botTotal: number,
  escapeTimeLimit: number,
  maxGroup: number,
  groupChance: number,
  bossZones: string[],
  difficulty: number,
  botType: string,
  ForceSpawn: boolean,
  botDistribution: number,
  spawnDelay = 0
): IBossLocationSpawn[] => {
<<<<<<< Updated upstream
  if (!botTotal) return [];
  const pushToEnd = botDistribution > 1;
  const pullFromEnd = botDistribution < 1;
  const botToZoneTotal = bossZones.length / botTotal;
  const isMarksman = botType === "marksman";
  const isPMC = botType === "pmcUSEC" || botType === "pmcBEAR";
=======
    if (!botTotal) return [];

    const pushToEnd = botDistribution > 1;
    const pullFromEnd = botDistribution < 1;
    const zoneSpread = bossZones.length / botTotal;
    const isPMC = botType === "pmcUSEC" || botType === "pmcBEAR";
    const isMarksman = botType === "marksman";
>>>>>>> Stashed changes

  let startTime = pushToEnd
    ? Math.round((botDistribution - 1) * escapeTimeLimit)
    : spawnDelay;

  escapeTimeLimit = pullFromEnd
    ? Math.round(escapeTimeLimit * botDistribution)
    : Math.round(escapeTimeLimit - startTime);

<<<<<<< Updated upstream
  const averageTime = Math.round(escapeTimeLimit / botTotal);

  const waves: IBossLocationSpawn[] = [];
  let maxSlotsReached = botTotal;
  if (maxGroup < 1) maxGroup = 1;
  while (botTotal > 0) {
    const allowGroup = groupChance > Math.random();
    let bossEscortAmount = allowGroup
      ? Math.round(maxGroup * Math.random())
      : 0;

    if (
      bossEscortAmount < 0 ||
      (bossEscortAmount > 0 && bossEscortAmount + 1 > maxSlotsReached)
    ) {
      bossEscortAmount = 0;
    }

    const totalCountThisWave = isMarksman ? 1 : bossEscortAmount + 1;
    const totalCountThusFar = botTotal - maxSlotsReached;

    const BossDifficult = getDifficulty(difficulty);

    waves.push({
      BossChance: 100,
      BossDifficult,
      BossEscortAmount: bossEscortAmount.toString(),
      BossEscortDifficult: BossDifficult,
      BossEscortType: botType,
      BossName: botType,
      BossPlayer: false,
      BossZone: bossZones[Math.floor(totalCountThusFar * botToZoneTotal)] || "",
      ForceSpawn,
      IgnoreMaxBots: ForceSpawn,
      RandomTimeSpawn: false,
      Time: startTime,
      Supports: bossEscortAmount
        ? [
            {
              BossEscortAmount: bossEscortAmount.toString(),
              BossEscortDifficult: [BossDifficult],
              BossEscortType: botType,
            },
          ]
        : null,
      TriggerId: "",
      TriggerName: "",
      spawnMode: isPMC ? ["pve"] : ["regular", "pve"],
    });

    startTime += Math.round(totalCountThisWave * averageTime);

    maxSlotsReached -= 1 + (isMarksman ? 0 : bossEscortAmount);
    if (maxSlotsReached <= 0) break;
  }
  // isMarksman &&
  //   console.log(
  //     // bossZones,
  //     botType,
  //     bossZones.length,
  //     waves.map(({ Time, BossZone }) => ({ Time, BossZone }))
  //   );
  return waves;
};

export const buildZombie = (
  botTotal: number,
  escapeTimeLimit: number,
  botDistribution: number,
  BossChance: number = 100
): IBossLocationSpawn[] => {
  if (!botTotal) return [];
  const pushToEnd = botDistribution > 1;
  const pullFromEnd = botDistribution < 1;

  let startTime = pushToEnd
    ? Math.round((botDistribution - 1) * escapeTimeLimit)
    : 0;

  escapeTimeLimit = pullFromEnd
    ? Math.round(escapeTimeLimit * botDistribution)
    : Math.round(escapeTimeLimit - startTime);

  const averageTime = Math.round(escapeTimeLimit / botTotal);

  const waves: IBossLocationSpawn[] = [];
  let maxSlotsReached = botTotal;

  while (botTotal > 0) {
    const allowGroup = 0.2 > Math.random();
    let bossEscortAmount = allowGroup ? Math.round(4 * Math.random()) : 0;

    if (bossEscortAmount < 0) bossEscortAmount = 0;

    const totalCountThisWave = bossEscortAmount + 1;

    const main = getRandomZombieType();
    waves.push({
      BossChance,
      BossDifficult: "normal",
      BossEscortAmount: "0",
      BossEscortDifficult: "normal",
      BossEscortType: main,
      BossName: main,
      BossPlayer: false,
      BossZone: "",
      Delay: 0,
      IgnoreMaxBots: false,
      RandomTimeSpawn: false,
      Time: startTime,
      Supports: new Array(bossEscortAmount).fill("").map(() => ({
        BossEscortType: getRandomZombieType(),
        BossEscortDifficult: ["normal"],
        BossEscortAmount: "1",
      })),
      TriggerId: "",
      TriggerName: "",
      spawnMode: ["regular", "pve"],
    });

    startTime += Math.round(totalCountThisWave * averageTime);

    maxSlotsReached -= 1 + bossEscortAmount;
    if (maxSlotsReached <= 0) break;
  }
  // console.log(waves)
  return waves;
=======
    const interval = Math.max(5, Math.round(escapeTimeLimit / botTotal));

    const waves: IBossLocationSpawn[] = [];
    let remaining = botTotal;

    while (remaining > 0) {
        const allowGroup = groupChance > Math.random();
        let escorts = allowGroup ? Math.round(maxGroup * Math.random()) : 0;
        const waveTotal = isMarksman ? 1 : escorts + 1;

        const BossDifficult = getDifficulty(difficulty);
        const BossZone = bossZones[Math.floor((botTotal - remaining) * zoneSpread)] || "";

        waves.push({
            BossChance: 100,
            BossDifficult,
            BossEscortAmount: escorts.toString(),
            BossEscortDifficult: BossDifficult,
            BossEscortType: botType,
            BossName: botType,
            BossPlayer: false,
            BossZone,
            ForceSpawn,
            IgnoreMaxBots: ForceSpawn,
            RandomTimeSpawn: false,
            Time: startTime,
            Supports: escorts
                ? [{
                    BossEscortAmount: escorts.toString(),
                    BossEscortDifficult: [BossDifficult],
                    BossEscortType: botType
                }]
                : null,
            TriggerId: "",
            TriggerName: "",
            spawnMode: isPMC ? ["pve"] : ["regular", "pve"]
        });

        startTime += interval * waveTotal;
        remaining -= waveTotal;
    }

    return waves;
};

// ==============================
// SUPPORT UTILS
// ==============================

export const getZone = (
    specialZones: string[],
    combinedZones: string[],
    specialOnly: boolean
): string => {
    if (!specialOnly && combinedZones.length)
        return getRandomInArray(combinedZones);
    return specialZones.pop() || "";
>>>>>>> Stashed changes
};

export const getDifficulty = (value: number): string => {
    const level = Math.random() + value;
    if (level < 0.55) return "easy";
    if (level < 1.4) return "normal";
    if (level < 1.85) return "hard";
    return "impossible";
};

export const getRandomDifficulty = (base = 1.5): string =>
    getDifficulty(Math.random() * base);

export const getBotSide = (
    spawnType: "marksman" | "assault" | "pmcBEAR" | "pmcUSEC"
): string => {
    switch (spawnType) {
        case "pmcBEAR": return "Bear";
        case "pmcUSEC": return "Usec";
        default: return "Savage";
    }
};

export const zombieTypes = ["infectedassault", "infectedpmc", "infectedlaborant", "infectedcivil"];
export const zombieTypesCaps = ["infectedAssault", "infectedPmc", "infectedLaborant", "infectedCivil"];

export const getRandomZombieType = (): string =>
    getRandomInArray(zombieTypesCaps);

export const getRandomInArray = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

// ==============================
// SMOOTHING & ESCAPE TIME
// ==============================

export const enforceSmoothing = (locationList: ILocation[]): void => {
    for (let i = 0; i < locationList.length; i++) {
        const mapName = configLocations[i];
        const waves = locationList[i].base.BossLocationSpawn;
        const smoothing = mapConfig[mapName]?.smoothingDistribution || 1;

        const bosses: IBossLocationSpawn[] = [];
        const fillers: IBossLocationSpawn[] = [];

        for (const wave of waves) {
            const isBoss = ![
                "infectedLaborant", "infectedAssault", "infectedCivil",
                WildSpawnType.ASSAULT, WildSpawnType.MARKSMAN,
                "pmcBEAR", "pmcUSEC"
            ].includes(wave.BossName);
            (isBoss ? bosses : fillers).push(wave);
        }

        fillers.sort((a, b) => a.Time - b.Time);
        const total = fillers.length;
        if (!total) continue;

        let time = Math.max(15, Math.min(...fillers.map(f => f.Time)));
        const step = Math.max(5, Math.round((Math.max(...fillers.map(f => f.Time)) - time) / total * 2 * smoothing));

        for (let j = 0; j < total; j++) {
            fillers[j].Time = time;
            time += Math.round(step * ((j + 1) / total));
        }

        locationList[i].base.BossLocationSpawn = [...bosses, ...fillers];
    }
};

export const setEscapeTimeOverrides = (
    locationList: ILocation[],
    mapCfg: Record<string, MapConfigType>,
    logger: ILogger,
    config: typeof _config
): void => {
    for (let i = 0; i < locationList.length; i++) {
        const map = configLocations[i];
        const override = mapCfg[map]?.EscapeTimeLimitOverride;
        const baseTime = locationList[i].base.EscapeTimeLimit;

        if (!override && baseTime / defaultEscapeTimes[map] > 5) {
            const maxAllowed = defaultEscapeTimes[map] * 5;
            logger.warning(`[MOAR] EscapeTimeLimit on ${map} was too high. Reset to ${maxAllowed}`);
            locationList[i].base.EscapeTimeLimit = maxAllowed;
        }

        if (override && baseTime !== override) {
            console.log(`[MOAR] Set ${map} EscapeTimeLimit to ${override}`);
            locationList[i].base.EscapeTimeLimit = override;
            locationList[i].base.EscapeTimeLimitCoop = override;
            locationList[i].base.EscapeTimeLimitPVE = override;
        }

        if (
            config.startingPmcs &&
            locationList[i].base.EscapeTimeLimit / defaultEscapeTimes[map] > 2
        ) {
            logger.warning(
                `[MOAR] Escape time too long for starting PMCs on ${map}. Disabling starting PMCs.`
            );
            config.startingPmcs = false;
        }
    }
};

// ==============================
// Misc Utilities
// ==============================

export interface MapSettings {
  sniperQuantity?: number;
  initialSpawnDelay: number;
  smoothingDistribution: number;
  mapCullingNearPointValue: number;
  spawnMinDistance: number;
  EscapeTimeLimit?: number;
  maxBotPerZoneOverride?: number;
  maxBotCapOverride?: number;
  pmcHotZones?: string[];
  scavHotZones?: string[];
  pmcWaveCount: number;
  scavWaveCount: number;
  zombieWaveCount: number;
}

<<<<<<< Updated upstream
export const getHealthBodyPartsByPercentage = (num: number) => {
  const num35 = Math.round(35 * num);
  const num100 = Math.round(100 * num);
  const num70 = Math.round(70 * num);
  const num80 = Math.round(80 * num);
  return {
    Head: {
      min: num35,
      max: num35,
    },
    Chest: {
      min: num100,
      max: num100,
    },
    Stomach: {
      min: num100,
      max: num100,
    },
    LeftArm: {
      min: num70,
      max: num70,
    },
    RightArm: {
      min: num70,
      max: num70,
    },
    LeftLeg: {
      min: num80,
      max: num80,
    },
    RightLeg: {
      min: num80,
      max: num80,
    },
  };
};

=======
>>>>>>> Stashed changes
export interface MapConfigType {
  spawnMinDistance: number;
  pmcWaveCount: number;
  scavWaveCount: number;
  zombieWaveCount?: number;
  scavHotZones?: string[];
  pmcHotZones?: string[];
  EscapeTimeLimitOverride?: number;
}

<<<<<<< Updated upstream
export const setEscapeTimeOverrides = (
  locationList: ILocation[],
  mapConfig: Record<string, MapConfigType>,
  logger: ILogger,
  config: typeof _config
) => {
  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;

    const map = mapSettingsList[index];
    const override = mapConfig[map].EscapeTimeLimitOverride;
    const hardcodedEscapeLimitMax = 5;

    if (
      !override &&
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map] >
        hardcodedEscapeLimitMax
    ) {
      const maxLimit = defaultEscapeTimes[map] * hardcodedEscapeLimitMax;
      logger.warning(
        `[MOAR] EscapeTimeLimit set too high on ${map}\nEscapeTimeLimit changed from ${locationList[index].base.EscapeTimeLimit} => ${maxLimit}\n`
      );
      locationList[index].base.EscapeTimeLimit = maxLimit;
    }

    if (override && locationList[index].base.EscapeTimeLimit !== override) {
      console.log(
        `[Moar] Set ${map}'s Escape time limit to ${override} from ${locationList[index].base.EscapeTimeLimit}\n`
      );
      locationList[index].base.EscapeTimeLimit = override;
      locationList[index].base.EscapeTimeLimitCoop = override;
      locationList[index].base.EscapeTimeLimitPVE = override;
    }

    if (
      config.startingPmcs &&
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map] > 2
    ) {
      logger.warning(
        `[MOAR] Average EscapeTimeLimit is too high (greater than 2x) to enable starting PMCS\nStarting PMCS has been turned off to prevent performance issues.\n`
      );
      config.startingPmcs = false;
    }
  }
};

export const getRandomInArray = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const enforceSmoothing = (locationList: ILocation[]) => {
  for (let index = 0; index < locationList.length; index++) {
    const waves = locationList[index].base.BossLocationSpawn;

    const Bosses: IBossLocationSpawn[] = [];
    let notBosses: IBossLocationSpawn[] = [];

    const notBossesSet = new Set([
      "infectedLaborant",
      "infectedAssault",
      "infectedCivil",
      WildSpawnType.ASSAULT,
      WildSpawnType.MARKSMAN,
      "pmcBEAR",
      "pmcUSEC",
    ]);

    for (const wave of waves) {
      if (notBossesSet.has(wave.BossName)) {
        notBosses.push(wave);
      } else {
        Bosses.push(wave);
      }
    }

    let first = Infinity,
      last = -Infinity;

    notBosses.forEach((notBoss) => {
      first = Math.min(notBoss.Time, first);
      last = Math.max(notBoss.Time, last);
    });

    if (first < 15) first = 15;

    notBosses = notBosses.sort((a, b) => a.Time - b.Time);

    // console.log(notBosses.map(({ Time }) => Time))

    let start = first;
    const smoothingDistribution = (mapConfig[configLocations[index]] as any)
      .smoothingDistribution as number;

    const increment =
      Math.round((last - first) / notBosses.length) * 2 * smoothingDistribution;

    for (let index = 0; index < notBosses.length; index++) {
      const ratio = (index + 1) / notBosses.length;
      // console.log(ratio);
      notBosses[index].Time = start;
      let inc = Math.round(increment * ratio);
      if (inc < 10) inc = 5;
      start += inc;
    }

    // console.log(
    //   configLocations[index],
    //   last,
    //   notBosses.map(({ Time, BossName }) => ({ BossName, Time }))
    // );

    locationList[index].base.BossLocationSpawn = [...Bosses, ...notBosses];
  }
};

export const looselyShuffle = <T>(arr: T[], shuffleStep: number = 3): T[] => {
  const n = arr.length;
  const halfN = Math.floor(n / 2);
  for (let i = shuffleStep - 1; i < halfN; i += shuffleStep) {
    // Pick a random index from the second half of the array to swap with the current index
    const randomIndex = halfN + Math.floor(Math.random() * (n - halfN));
    // Swap the elements at the current index and the random index
    const temp = arr[i];
    arr[i] = arr[randomIndex];
    arr[randomIndex] = temp;
  }

  return arr;
=======
export const getHealthBodyPartsByPercentage = (percent: number) => ({
    Head: { min: Math.round(35 * percent), max: Math.round(35 * percent) },
    Chest: { min: Math.round(100 * percent), max: Math.round(100 * percent) },
    Stomach: { min: Math.round(100 * percent), max: Math.round(100 * percent) },
    LeftArm: { min: Math.round(70 * percent), max: Math.round(70 * percent) },
    RightArm: { min: Math.round(70 * percent), max: Math.round(70 * percent) },
    LeftLeg: { min: Math.round(80 * percent), max: Math.round(80 * percent) },
    RightLeg: { min: Math.round(80 * percent), max: Math.round(80 * percent) }
});

export const looselyShuffle = <T>(arr: T[], step = 3): T[] => {
    const n = arr.length;
    const mid = Math.floor(n / 2);
    for (let i = step - 1; i < mid; i += step) {
        const r = mid + Math.floor(Math.random() * (n - mid));
        [arr[i], arr[r]] = [arr[r], arr[i]];
    }
    return arr;
>>>>>>> Stashed changes
};
