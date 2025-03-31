import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes, originalMapList } from "./constants";
import { buildBotWaves, looselyShuffle, MapSettings, shuffle } from "./utils";
import { WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
<<<<<<< Updated upstream
import { saveToFile } from "../utils";
=======
>>>>>>> Stashed changes
import getSortedSpawnPointList from "./spawnZoneUtils";
import { globalValues } from "../GlobalValues";

export default function buildScavMarksmanWaves(
<<<<<<< Updated upstream
  config: typeof _config,
  locationList: ILocation[],
  botConfig: IBotConfig
) {
  let {
    maxBotCap,
    scavWaveQuantity,
    scavWaveDistribution,
    sniperMaxGroupSize,
    maxBotPerZone,
    scavMaxGroupSize,
    scavDifficulty,
    sniperGroupChance,
    scavGroupChance,
  } = config;

  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    locationList[index].base.waves = [];
    locationList[index].base = {
      ...locationList[index].base,
      ...{
        NewSpawn: false,
        OcculsionCullingEnabled: true,
        OfflineNewSpawn: false,
        OfflineOldSpawn: true,
        OldSpawn: true,
        BotSpawnCountStep: 0,
      },
    };

    locationList[index].base.NonWaveGroupScenario.Enabled = false;
    locationList[index].base["BotStartPlayer"] = 0;
    if (
      locationList[index].base.BotStop <
      locationList[index].base.EscapeTimeLimit * 60
    ) {
      locationList[index].base.BotStop =
        locationList[index].base.EscapeTimeLimit * 60;
=======
    config: typeof _config,
    locationList: ILocation[],
    botConfig: IBotConfig
): void {
    const {
        maxBotCap,
        scavWaveQuantity,
        scavWaveDistribution,
        sniperMaxGroupSize,
        maxBotPerZone,
        scavMaxGroupSize,
        scavDifficulty,
        sniperGroupChance,
        scavGroupChance,
        debug
    } = config;

    for (let index = 0; index < locationList.length; index++) {
        const mapName = Object.keys(mapConfig)[index] as keyof typeof mapConfig;
        const location = locationList[index];
        const mapSettings: MapSettings = mapConfig[mapName];

        const escapeTimeLimit = mapSettings.EscapeTimeLimit || location.base.EscapeTimeLimit;
        location.base.EscapeTimeLimit = escapeTimeLimit;
        location.base.exit_access_time = escapeTimeLimit + 1;

        const cap = mapSettings.maxBotCapOverride || maxBotCap;
        const perZone = mapSettings.maxBotPerZoneOverride || maxBotPerZone;
        if (cap) {
            location.base.BotMax = cap;
            location.base.BotMaxPvE = cap;
            location.base.BotMaxPlayer = cap;
            botConfig.maxBotCap[originalMapList[index]] = cap;
        }
        if (perZone) location.base.MaxBotPerZone = perZone;

        location.base = {
            ...location.base,
            NewSpawn: false,
            OcculsionCullingEnabled: true,
            OfflineNewSpawn: false,
            OfflineOldSpawn: true,
            OldSpawn: true,
            BotSpawnCountStep: 0,
            NonWaveGroupScenario: { Enabled: false },
            BotStartPlayer: 0,
            BotStop: escapeTimeLimit * 60,
            waves: []
        };

        const { Position: { x, y, z } } = globalValues.playerSpawn;

        const sniperSpawns = getSortedSpawnPointList(
            location.base.SpawnPointParams.filter(p => p.type === "sniper"),
            x, y, z
        );
        const sniperZones = sniperSpawns.map(s => s.BotZoneName);
        const sniperIds = new Set(sniperSpawns.map(s => s.Id));

        for (const point of location.base.SpawnPointParams) {
            if (sniperIds.has(point.Id)) point.DelayToCanSpawnSec = 20;
        }

        if (sniperZones.length > 0) {
            location.base.MinMaxBots = [{
                WildSpawnType: WildSpawnType.MARKSMAN,
                max: sniperZones.length * 5,
                min: sniperZones.length
            }];
        }

        let scavZones = getSortedSpawnPointList(
            location.base.SpawnPointParams.filter(p => p.type === "scav"),
            x, y, z, 0.1
        ).map(s => s.BotZoneName);

        looselyShuffle(scavZones, 4);

        const timeLimit = escapeTimeLimit * 60;
        const ratio = Math.round(escapeTimeLimit / defaultEscapeTimes[mapName]);

        let scavWaveCount = Math.round((mapSettings.scavWaveCount || 1) * scavWaveQuantity * ratio);
        if (mapSettings.scavHotZones?.length && scavWaveCount > 0) {
            scavWaveCount += mapSettings.scavHotZones.length;
        }

        while (scavWaveCount - scavZones.length > 0) {
            scavZones = [...scavZones, ...scavZones];
            if (scavZones.length === 0) scavZones = [""];
        }

        if (debug && ratio !== 1) {
            console.log(`[MOAR] ${mapName} scav wave ratio applied. New count: ${scavWaveCount}`);
        }

        const snipers = buildBotWaves(
            Math.min(mapSettings.sniperQuantity || 1, sniperZones.length),
            timeLimit,
            sniperMaxGroupSize,
            sniperGroupChance,
            sniperZones,
            0.8,
            WildSpawnType.MARKSMAN,
            true,
            0.3,
            25
        );

        if (config.randomSpawns) scavZones = shuffle(scavZones);

        const scavs = buildBotWaves(
            scavWaveCount,
            timeLimit,
            scavMaxGroupSize,
            scavGroupChance,
            scavZones,
            scavDifficulty,
            WildSpawnType.ASSAULT,
            false,
            scavWaveDistribution,
            mapSettings.initialSpawnDelay + Math.round(10 * Math.random())
        );

        for (const hotzone of mapSettings.scavHotZones || []) {
            const idx = Math.floor(Math.random() * scavs.length);
            scavs[idx].BossZone = hotzone;
        }

        location.base.BossLocationSpawn = [
            ...snipers,
            ...scavs,
            ...location.base.BossLocationSpawn
        ];
>>>>>>> Stashed changes
    }

    const {
      maxBotPerZoneOverride,
      maxBotCapOverride,
      EscapeTimeLimit,
      scavHotZones = [],
      sniperQuantity = 1,
      scavWaveCount,
      initialSpawnDelay,
    } = (mapConfig?.[map] as MapSettings) || {};

    // Set per map EscapeTimeLimit
    if (EscapeTimeLimit) {
      locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
      locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
    }

    // Set default or per map maxBotCap
    if (maxBotCapOverride || maxBotCap) {
      const capToSet = maxBotCapOverride || maxBotCap;
      // console.log(map, capToSet, maxBotCapOverride, maxBotCap);
      locationList[index].base.BotMax = capToSet;
      locationList[index].base.BotMaxPvE = capToSet;
      locationList[index].base.BotMaxPlayer = capToSet;
      botConfig.maxBotCap[originalMapList[index]] = capToSet;
    }

    // Adjust botZone quantity
    if (maxBotPerZoneOverride || maxBotPerZone) {
      const BotPerZone = maxBotPerZoneOverride || maxBotPerZone;
      // console.log(map, BotPerZone, maxBotPerZoneOverride, maxBotPerZone);
      locationList[index].base.MaxBotPerZone = BotPerZone;
    }

    // const sniperLocations = new Set(
    //   [...locationList[index].base.SpawnPointParams]
    //     .filter(
    //       ({ Categories, DelayToCanSpawnSec, BotZoneName, Sides }) =>
    //         !Categories.includes("Boss") &&
    //         Sides[0] === "Savage" &&
    //         (BotZoneName?.toLowerCase().includes("snipe") ||
    //           DelayToCanSpawnSec > 40)
    //     )
    //     .map(({ BotZoneName }) => BotZoneName || "")
    // );

    const {
      Position: { x, y, z },
    } = globalValues.playerSpawn;

    const sniperSpawns = getSortedSpawnPointList(
      locationList[index].base.SpawnPointParams.filter(
        (point) => point["type"] === "sniper"
      ),
      x,
      y,
      z
    );

    let sniperLocations = sniperSpawns.map(({ BotZoneName }) => BotZoneName);
    // console.log(sniperLocations);

    const sniperDelay = 25;
    // Make sure that the sniper spawns permit snipers to actually spawn early.
    const sniperIds = new Set(sniperSpawns.map(({ Id }) => Id));

    locationList[index].base.SpawnPointParams.forEach((point, snipeIndex) => {
      if (sniperIds.has(point.Id)) {
        locationList[index].base.SpawnPointParams[
          snipeIndex
        ].DelayToCanSpawnSec = 20;
      }
    });

    if (sniperLocations.length) {
      locationList[index].base.MinMaxBots = [
        {
          WildSpawnType: "marksman",
          max: sniperLocations.length * 5,
          min: sniperLocations.length,
        },
      ];
    }

    let scavZones = getSortedSpawnPointList(
      locationList[index].base.SpawnPointParams.filter(
        (point) => point["type"] === "scav"
      ),
      x,
      y,
      z,
      0.1
    ).map(({ BotZoneName }) => BotZoneName);

    looselyShuffle(scavZones, 4);

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    // Scavs
    let scavTotalWaveCount = Math.round(
      scavWaveCount * scavWaveQuantity * escapeTimeLimitRatio
    );

    if (scavHotZones.length && scavTotalWaveCount > 0) {
      scavTotalWaveCount = scavTotalWaveCount + scavHotZones.length;
    }

    while (scavTotalWaveCount - scavZones.length > 0) {
      console.log(
        `${map} ran out of appropriate zones for scavs, duplicating zones`
      );
      // const addEmpty = new Array(numberOfZoneless).fill("");
      scavZones = [...scavZones, ...scavZones];
      if (scavZones.length === 0) {
        scavZones = [""];
      }
    }

    config.debug &&
      escapeTimeLimitRatio !== 1 &&
      console.log(
        `${map} Scav wave count changed from ${scavWaveCount} to ${scavTotalWaveCount} due to escapeTimeLimit adjustment`
      );

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;

    // if (config.randomSpawns)
    //   sniperLocations = shuffle<string[]>(sniperLocations);
    // console.log(map);
    const snipers = buildBotWaves(
      Math.min(sniperQuantity, sniperLocations.length),
      timeLimit, ///30,
      sniperMaxGroupSize,
      sniperGroupChance,
      sniperLocations,
      0.8,
      WildSpawnType.MARKSMAN,
      true,
      0.3,
      sniperDelay
    );

    if (config.randomSpawns) scavZones = shuffle<string[]>(scavZones);
    const scavWaves = buildBotWaves(
      scavTotalWaveCount,
      timeLimit,
      scavMaxGroupSize,
      scavGroupChance,
      scavZones,
      scavDifficulty,
      WildSpawnType.ASSAULT,
      false,
      scavWaveDistribution,
      initialSpawnDelay + Math.round(10 * Math.random())
    );

    // Add hotzones if exist
    if (scavWaves.length) {
      scavHotZones.forEach((hotzone) => {
        const index = Math.floor(scavWaves.length * Math.random());
        scavWaves[index].BossZone = hotzone;
        // console.log(scavWaves[index].BossZone);
      });
    }

    // if (map === "laboratory") console.log(snipers, scavWaves)
    locationList[index].base.BossLocationSpawn = [
      ...snipers,
      ...scavWaves,
      ...locationList[index].base.BossLocationSpawn,
    ];
  }
}
