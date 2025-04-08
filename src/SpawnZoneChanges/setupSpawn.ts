import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { DependencyContainer } from "tsyringe";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

import mapConfig from "../../config/mapConfig.json";
import rawAdvancedConfig from "../../config/advancedConfig.json";

import PlayerSpawnsRaw from "../../config/Spawns/playerSpawns.json";
import PmcSpawnsRaw from "../../config/Spawns/pmcSpawns.json";
import ScavSpawnsRaw from "../../config/Spawns/scavSpawns.json";
import SniperSpawnsRaw from "../../config/Spawns/sniperSpawns.json";

import { Ixyz } from "../Models/Ixyz";
import { configLocations, originalMapList } from "../Spawning/constants";
import globalValues from "../GlobalValues";
import {
    AddCustomBotSpawnPoints,
    AddCustomPmcSpawnPoints,
    AddCustomSniperSpawnPoints,
    cleanClosest,
    removeClosestSpawnsFromCustomBots,
    BuildCustomPlayerSpawnPoints
} from "../Spawning/spawnZoneUtils";
import { updateAllBotSpawns } from "./updateUtils";
import { shuffle } from "../utils";

const advancedConfig = rawAdvancedConfig as typeof rawAdvancedConfig & { debug?: boolean };

const mapSpawnsToIxyz = (raw: any): Record<string, Ixyz[]> => Object.fromEntries(
    Object.entries(raw).map(([key, points]) => [
        key,
        (points as { x: number; y: number; z: number }[]).map(p => new Ixyz(p.x, p.y, p.z))
    ])
);

const PlayerSpawns = mapSpawnsToIxyz(PlayerSpawnsRaw);
const PmcSpawns = mapSpawnsToIxyz(PmcSpawnsRaw);
const ScavSpawns = mapSpawnsToIxyz(ScavSpawnsRaw);
const SniperSpawns = mapSpawnsToIxyz(SniperSpawnsRaw);

const bossZoneList = new Set([
    "Zone_Blockpost", "Zone_RoofRocks", "Zone_RoofContainers", "Zone_RoofBeach",
    "Zone_TreatmentRocks", "Zone_TreatmentBeach", "Zone_Hellicopter", "Zone_Island",
    "BotZoneGate1", "BotZoneGate2", "BotZoneBasement"
]);

function applyColliderRadiusClamp(point: ISpawnPointParam, limit: number): ISpawnPointParam {
    return {
        ...point,
        ColliderParams: {
            ...point.ColliderParams,
            _props: {
                ...point.ColliderParams?._props,
                Radius: Math.max(point.ColliderParams?._props?.Radius ?? 0, limit)
            }
        }
    };
}

export const setupSpawns = (container: DependencyContainer): void => {
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const { locations } = databaseServer.getTables();

    globalValues.indexedMapSpawns ??= {};
    const indexedMapSpawns: Record<string, ISpawnPointParam[]> = {};

    for (let mapIndex = 0; mapIndex < originalMapList.length; mapIndex++) {
        const map = originalMapList[mapIndex];
        const base = locations[map]?.base;

        if (!base) {
            console.warn(`[MOAR] Skipping missing map: ${map}`);
            continue;
        }

        base.SpawnPointParams ??= [];
        if (!Array.isArray(base.SpawnPointParams)) base.SpawnPointParams = [];

        const isSandbox = map.toLowerCase().includes("sandbox");
        const configKey = configLocations[mapIndex] as keyof typeof mapConfig;
        const radiusLimit = mapConfig[configKey]?.spawnMinDistance ?? 20;

        const bossSpawns: ISpawnPointParam[] = [];
        let scavSpawns: ISpawnPointParam[] = [];
        let sniperSpawns: ISpawnPointParam[] = [];
        let pmcSpawns: ISpawnPointParam[] = [];

        for (const point of shuffle(base.SpawnPointParams)) {
            if (point.Categories?.includes("Boss") || bossZoneList.has(point.BotZoneName)) {
                bossSpawns.push(point);
            } else if (point.BotZoneName?.toLowerCase()?.includes("snipe") || (map !== "lighthouse" && point.DelayToCanSpawnSec > 40)) {
                sniperSpawns.push(point);
            } else if (point.Infiltration || point.Categories?.includes("Coop")) {
                pmcSpawns.push(point);
            } else {
                scavSpawns.push(point);
            }
        }

        if (isSandbox) {
            sniperSpawns.forEach((point, i) => {
                point.BotZoneName = i % 2 === 0 ? "ZoneSandSnipeCenter" : "ZoneSandSnipeCenter2";
            });
        }

        if (advancedConfig.ActivateSpawnCullingOnServerStart) {
            ScavSpawns[map] = removeClosestSpawnsFromCustomBots(ScavSpawns, scavSpawns, map, configKey);
            PmcSpawns[map] = removeClosestSpawnsFromCustomBots(PmcSpawns, pmcSpawns, map, configKey);
            PlayerSpawns[map] = removeClosestSpawnsFromCustomBots(PlayerSpawns, pmcSpawns, map, configKey);
            SniperSpawns[map] = removeClosestSpawnsFromCustomBots(SniperSpawns, sniperSpawns, map, configKey);
        }

        const playerSpawns = BuildCustomPlayerSpawnPoints(base.SpawnPointParams, map);

        if (!globalValues.playerSpawn && playerSpawns.length > 0) {
            globalValues.playerSpawn = playerSpawns[0];
            if (advancedConfig.debug) {
                const { x, y, z } = playerSpawns[0].Position;
                console.log(`[MOAR] Default player spawn set (${map}): (${x}, ${y}, ${z})`);
            }
        }

        scavSpawns = cleanClosest(AddCustomBotSpawnPoints(scavSpawns, map), mapIndex).map(p =>
            applyColliderRadiusClamp({ ...p, BotZoneName: isSandbox ? "ZoneSandbox" : p.BotZoneName, Categories: ["Bot"], Sides: ["Savage"], CorePointId: 1 }, radiusLimit)
        );

        pmcSpawns = cleanClosest(AddCustomPmcSpawnPoints(pmcSpawns, map), mapIndex).map(p =>
            applyColliderRadiusClamp({ ...p, BotZoneName: isSandbox ? "ZoneSandbox" : p.BotZoneName, Categories: ["Coop"], Sides: ["Usec", "Bear"], CorePointId: 0 }, radiusLimit)
        );

        sniperSpawns = AddCustomSniperSpawnPoints(sniperSpawns, map);

        const allSpawns = [...sniperSpawns, ...bossSpawns, ...scavSpawns, ...pmcSpawns, ...playerSpawns];

        indexedMapSpawns[map] = allSpawns;
        base.SpawnPointParams = allSpawns;
        base.OpenZones = [...new Set(allSpawns.map(p => p.BotZoneName).filter(Boolean))].join(",");
    }

    globalValues.indexedMapSpawns = indexedMapSpawns;
    globalValues.initialized = true;

    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
        updateAllBotSpawns(PlayerSpawns, "playerSpawns");
        updateAllBotSpawns(PmcSpawns, "pmcSpawns");
        updateAllBotSpawns(ScavSpawns, "scavSpawns");
        updateAllBotSpawns(SniperSpawns, "sniperSpawns");
    }

    console.log(`[MOAR] ✅ Spawn setup completed. Maps initialized: ${Object.keys(indexedMapSpawns).length}`);
};
