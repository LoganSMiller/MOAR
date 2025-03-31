import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { configLocations, originalMapList } from "../Spawning/constants";
import { DependencyContainer } from "tsyringe";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import {
<<<<<<< Updated upstream
  AddCustomBotSpawnPoints,
  BuildCustomPlayerSpawnPoints,
  AddCustomPmcSpawnPoints,
  AddCustomSniperSpawnPoints,
  cleanClosest,
  getClosestZone,
  removeClosestSpawnsFromCustomBots,
=======
    AddCustomBotSpawnPoints,
    BuildCustomPlayerSpawnPoints,
    AddCustomPmcSpawnPoints,
    AddCustomSniperSpawnPoints,
    cleanClosest,
    getClosestZone,
    removeClosestSpawnsFromCustomBots
>>>>>>> Stashed changes
} from "../Spawning/spawnZoneUtils";
import { shuffle } from "../Spawning/utils";
import { PlayerSpawns, PmcSpawns, ScavSpawns, SniperSpawns } from ".";
import { updateAllBotSpawns } from "./updateUtils";

<<<<<<< Updated upstream
export const setupSpawns = (container: DependencyContainer) => {
  const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
  const { locations } = databaseServer.getTables();

  const indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};

  const mapsToExcludeFromPlayerCulling = new Set([
    "factory4_day",
    "factory4_night",
    "laboratory",
  ]);

  originalMapList.forEach((map, mapIndex) => {
    const allZones = [
      ...new Set(
        locations[map].base.SpawnPointParams.filter(
          ({ BotZoneName }: ISpawnPointParam) => !!BotZoneName
        ).map(({ BotZoneName }: ISpawnPointParam) => BotZoneName)
      ),
    ];

    locations[map].base.OpenZones = allZones.join(",");

    let bossSpawns: ISpawnPointParam[] = [];
    let scavSpawns: ISpawnPointParam[] = [];
    let sniperSpawns: ISpawnPointParam[] = [];

    let pmcSpawns: ISpawnPointParam[] = [];

    const bossZoneList = new Set([
      "Zone_Blockpost",
      "Zone_RoofRocks",
      "Zone_RoofContainers",
      "Zone_RoofBeach",
      "Zone_TreatmentRocks",
      "Zone_TreatmentBeach",
      "Zone_Hellicopter",
      "Zone_Island",
      "BotZoneGate1",
      "BotZoneGate2",
      "BotZoneBasement",
    ]);

    const isGZ = map.includes("sandbox");

    shuffle<ISpawnPointParam[]>(locations[map].base.SpawnPointParams).forEach(
      (point) => {
        switch (true) {
          case point.Categories.includes("Boss") ||
            bossZoneList.has(point.BotZoneName):
            bossSpawns.push(point);
            break;

          case point.BotZoneName?.toLowerCase().includes("snipe") ||
            (map !== "lighthouse" && point.DelayToCanSpawnSec > 40):
            sniperSpawns.push(point);
            break;

          case !!point.Infiltration || point.Categories.includes("Coop"):
            pmcSpawns.push(point);
            break;
          default:
            scavSpawns.push(point);
            break;
=======
/**
 * Initializes and processes spawn point data across all maps.
 * Cleans, categorizes, and optionally removes redundant spawn points.
 */
export const setupSpawns = (container: DependencyContainer): void => {
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const { locations } = databaseServer.getTables();
    const indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};

    const bossZoneList = new Set([
        "Zone_Blockpost", "Zone_RoofRocks", "Zone_RoofContainers", "Zone_RoofBeach",
        "Zone_TreatmentRocks", "Zone_TreatmentBeach", "Zone_Hellicopter", "Zone_Island",
        "BotZoneGate1", "BotZoneGate2", "BotZoneBasement"
    ]);

    originalMapList.forEach((map, mapIndex) => {
        const base = locations[map].base;
        const spawnParams = base.SpawnPointParams;

        // 1. Collect open zones
        const allZones = [...new Set(
            spawnParams
                .filter(({ BotZoneName }) => !!BotZoneName)
                .map(({ BotZoneName }) => BotZoneName)
        )];
        base.OpenZones = allZones.join(",");

        const isGZ = map.toLowerCase().includes("sandbox");

        const bossSpawns: ISpawnPointParam[] = [];
        let scavSpawns: ISpawnPointParam[] = [];
        let sniperSpawns: ISpawnPointParam[] = [];
        let pmcSpawns: ISpawnPointParam[] = [];

        // 2. Categorize spawn points
        shuffle(spawnParams).forEach(point => {
            if (point.Categories.includes("Boss") || bossZoneList.has(point.BotZoneName)) {
                bossSpawns.push(point);
            } else if (point.BotZoneName?.toLowerCase().includes("snipe") || (map !== "lighthouse" && point.DelayToCanSpawnSec > 40)) {
                sniperSpawns.push(point);
            } else if (point.Infiltration || point.Categories.includes("Coop")) {
                pmcSpawns.push(point);
            } else {
                scavSpawns.push(point);
            }
        });

        // 3. GZ zone fix for sniper spawns
        if (isGZ) {
            sniperSpawns.forEach((point, index) => {
                point.BotZoneName = index % 2 === 0 ? "ZoneSandSnipeCenter" : "ZoneSandSnipeCenter2";
            });
>>>>>>> Stashed changes
        }
      }
    );

<<<<<<< Updated upstream
    // fix GZ
    if (isGZ) {
      sniperSpawns.map((point, index) => {
        if (index < 2) {
          point.BotZoneName = Math.random()
            ? "ZoneSandSnipeCenter"
            : "ZoneSandSnipeCenter2";
        } else {
          point.BotZoneName = ["ZoneSandSnipeCenter", "ZoneSandSnipeCenter2"][
            index
          ];
=======
        // 4. Cull redundant spawn points if enabled
        if (advancedConfig.ActivateSpawnCullingOnServerStart) {
            const zone = configLocations[mapIndex];
            ScavSpawns[map] = removeClosestSpawnsFromCustomBots(ScavSpawns, scavSpawns, map, zone) || [];
            PmcSpawns[map] = removeClosestSpawnsFromCustomBots(PmcSpawns, pmcSpawns, map, zone) || [];
            PlayerSpawns[map] = removeClosestSpawnsFromCustomBots(PlayerSpawns, pmcSpawns, map, zone) || [];
            SniperSpawns[map] = removeClosestSpawnsFromCustomBots(SniperSpawns, sniperSpawns, map, zone) || [];
>>>>>>> Stashed changes
        }
        return point;
      });
    }

<<<<<<< Updated upstream
    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
      ScavSpawns[map] =
        removeClosestSpawnsFromCustomBots(
          ScavSpawns,
          scavSpawns,
          map,
          configLocations[mapIndex]
        ) || [];
      PmcSpawns[map] =
        removeClosestSpawnsFromCustomBots(
          PmcSpawns,
          pmcSpawns,
          map,
          configLocations[mapIndex]
        ) || [];
      PlayerSpawns[map] =
        removeClosestSpawnsFromCustomBots(
          PlayerSpawns,
          pmcSpawns,
          map,
          configLocations[mapIndex]
        ) || [];
      SniperSpawns[map] =
        removeClosestSpawnsFromCustomBots(
          SniperSpawns,
          sniperSpawns,
          map,
          configLocations[mapIndex]
        ) || [];
    }

    const { spawnMinDistance: limit } = mapConfig[configLocations[mapIndex]];

    let playerSpawns = BuildCustomPlayerSpawnPoints(
      map,
      locations[map].base.SpawnPointParams
    );

    playerSpawns = cleanClosest(playerSpawns, mapIndex, true);

    scavSpawns = cleanClosest(
      AddCustomBotSpawnPoints(scavSpawns, map),
      mapIndex
    ).map((point, botIndex) => {
      if (point.ColliderParams?._props?.Radius < limit) {
        point.ColliderParams._props.Radius = limit;
      }

      return !!point.Categories.length
        ? {
            ...point,
            BotZoneName: isGZ ? "ZoneSandbox" : point?.BotZoneName,
            Categories: ["Bot"],
            Sides: ["Savage"],
            CorePointId: 1,
          }
        : point;
    });

    pmcSpawns = cleanClosest(
      AddCustomPmcSpawnPoints(pmcSpawns, map),
      mapIndex
    ).map((point, pmcIndex) => {
      if (point.ColliderParams?._props?.Radius < limit) {
        point.ColliderParams._props.Radius = limit;
      }

      return !!point.Categories.length
        ? {
            ...point,
            BotZoneName: isGZ
              ? "ZoneSandbox"
              : getClosestZone(
                  scavSpawns,
                  point.Position.x,
                  point.Position.y,
                  point.Position.z
                ),
            Categories: ["Coop", Math.random() ? "Group" : "Opposite"],
            Sides: ["Pmc"],
            CorePointId: 0,
          }
        : point;
    });

    sniperSpawns = AddCustomSniperSpawnPoints(sniperSpawns, map);

    indexedMapSpawns[mapIndex] = [
      ...sniperSpawns.map((point) => ({ ...point, type: "sniper" })),
      ...bossSpawns.map((point) => ({ ...point, type: "boss" })),
      ...scavSpawns.map((point) => ({ ...point, type: "scav" })),
      ...pmcSpawns.map((point) => ({ ...point, type: "pmc" })),
      ...playerSpawns.map((point) => ({ ...point, type: "player" })),
    ];

    // console.log(
    //   "sniperSpawns",
    //   sniperSpawns.length,
    //   "bossSpawns",
    //   bossSpawns.length,
    //   "scavSpawns",
    //   scavSpawns.length,
    //   "pmcSpawns",
    //   pmcSpawns.length,
    //   "playerSpawns",
    //   playerSpawns.length,
    //   map
    // );

    locations[map].base.SpawnPointParams = indexedMapSpawns[mapIndex];

    const listToAddToOpenZones = [
      ...new Set(
        locations[map].base.SpawnPointParams.map(
          ({ BotZoneName }) => BotZoneName
        ).filter((zone) => !!zone)
      ),
    ];

    locations[map].base.OpenZones = listToAddToOpenZones.join(",");
  });

  //  PlayerSpawns, PmcSpawns, ScavSpawns, SniperSpawns
  if (advancedConfig.ActivateSpawnCullingOnServerStart) {
    updateAllBotSpawns(PlayerSpawns, "playerSpawns");
    updateAllBotSpawns(PmcSpawns, "pmcSpawns");
    updateAllBotSpawns(ScavSpawns, "scavSpawns");
    updateAllBotSpawns(SniperSpawns, "sniperSpawns");
  }
  globalValues.indexedMapSpawns = indexedMapSpawns;
=======
        // 5. Build + clean spawn points
        const { spawnMinDistance: limit } = mapConfig[configLocations[mapIndex]];
        let playerSpawns = cleanClosest(BuildCustomPlayerSpawnPoints(map, spawnParams), mapIndex, true);

        scavSpawns = cleanClosest(AddCustomBotSpawnPoints(scavSpawns, map), mapIndex).map(point => ({
            ...point,
            BotZoneName: isGZ ? "ZoneSandbox" : point.BotZoneName,
            Categories: ["Bot"],
            Sides: ["Savage"],
            CorePointId: 1,
            ColliderParams: {
                ...point.ColliderParams,
                _props: {
                    ...point.ColliderParams?._props,
                    Radius: Math.max(point.ColliderParams?._props?.Radius ?? 0, limit)
                }
            }
        }));

        pmcSpawns = cleanClosest(AddCustomPmcSpawnPoints(pmcSpawns, map), mapIndex).map(point => ({
            ...point,
            BotZoneName: isGZ
                ? "ZoneSandbox"
                : getClosestZone(scavSpawns, point.Position.x, point.Position.y, point.Position.z),
            Categories: ["Coop", Math.random() > 0.5 ? "Group" : "Opposite"],
            Sides: ["Pmc"],
            CorePointId: 0,
            ColliderParams: {
                ...point.ColliderParams,
                _props: {
                    ...point.ColliderParams?._props,
                    Radius: Math.max(point.ColliderParams?._props?.Radius ?? 0, limit)
                }
            }
        }));

        sniperSpawns = AddCustomSniperSpawnPoints(sniperSpawns, map);

        indexedMapSpawns[mapIndex] = [
            ...sniperSpawns.map(p => ({ ...p, type: "sniper" })),
            ...bossSpawns.map(p => ({ ...p, type: "boss" })),
            ...scavSpawns.map(p => ({ ...p, type: "scav" })),
            ...pmcSpawns.map(p => ({ ...p, type: "pmc" })),
            ...playerSpawns.map(p => ({ ...p, type: "player" })),
        ];

        // 6. Finalize map spawns
        base.SpawnPointParams = indexedMapSpawns[mapIndex];
        base.OpenZones = [...new Set(base.SpawnPointParams.map(p => p.BotZoneName).filter(Boolean))].join(",");
    });

    // 7. Sync global values and update overlays
    globalValues.indexedMapSpawns = indexedMapSpawns;

    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
        updateAllBotSpawns(PlayerSpawns, "playerSpawns");
        updateAllBotSpawns(PmcSpawns, "pmcSpawns");
        updateAllBotSpawns(ScavSpawns, "scavSpawns");
        updateAllBotSpawns(SniperSpawns, "sniperSpawns");
    }
>>>>>>> Stashed changes
};
