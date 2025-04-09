import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

import globalValues from "../GlobalValues";
import mapConfig from "../../config/mapConfig.json";
import rawAdvancedConfig from "../../config/advancedConfig.json";

import PlayerSpawnsRaw from "../../config/Spawns/playerSpawns.json";
import PmcSpawnsRaw from "../../config/Spawns/pmcSpawns.json";
import ScavSpawnsRaw from "../../config/Spawns/scavSpawns.json";
import SniperSpawnsRaw from "../../config/Spawns/sniperSpawns.json";

import { Ixyz } from "../Models/Ixyz";
import { configLocations, originalMapList } from "../Spawning/constants";
import {
    AddCustomBotSpawnPoints,
    AddCustomPmcSpawnPoints,
    AddCustomSniperSpawnPoints,
    BuildCustomPlayerSpawnPoints,
    cleanClosest,
    removeClosestSpawnsFromCustomBots
} from "../Spawning/spawnZoneUtils";
import { shuffle } from "../utils";
import { updateAllBotSpawns } from "./updateUtils";

const advancedConfig = rawAdvancedConfig as typeof rawAdvancedConfig & { debug?: boolean };

function mapSpawnsToIxyz(raw: Record<string, { x: number; y: number; z: number }[]>): Record<string, Ixyz[]> {
    return Object.fromEntries(
        Object.entries(raw).map(([map, points]) => [
            map,
            points.map(p => new Ixyz(p.x, p.y, p.z))
        ])
    );
}

const PlayerSpawns = mapSpawnsToIxyz(PlayerSpawnsRaw);
const PmcSpawns = mapSpawnsToIxyz(PmcSpawnsRaw);
const ScavSpawns = mapSpawnsToIxyz(ScavSpawnsRaw);
const SniperSpawns = mapSpawnsToIxyz(SniperSpawnsRaw);

const bossZoneList = new Set([
    "Zone_Blockpost", "Zone_RoofRocks", "Zone_RoofContainers", "Zone_RoofBeach",
    "Zone_TreatmentRocks", "Zone_TreatmentBeach", "Zone_Hellicopter", "Zone_Island",
    "BotZoneGate1", "BotZoneGate2", "BotZoneBasement"
]);

export function setupSpawns(container: DependencyContainer): void {
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const logger = container.resolve<ILogger>("WinstonLogger");
    const { locations } = databaseServer.getTables();

    globalValues.indexedMapSpawns = {};

    for (let mapIndex = 0; mapIndex < originalMapList.length; mapIndex++) {
        const map = originalMapList[mapIndex];
        const location = locations[map];
        const base = location?.base;

        if (!base) {
            logger.warning(`[MOAR] ⚠ Skipping missing map: ${map}`);
            continue;
        }

        base.SpawnPointParams ??= [];

        const isSandbox = map.toLowerCase().includes("sandbox");
        const configKey = configLocations[mapIndex] as keyof typeof mapConfig;
        const radiusLimit = mapConfig[configKey]?.spawnMinDistance ?? 20;

        const allParams = shuffle(base.SpawnPointParams) as ISpawnPointParam[];
        const bossSpawns: ISpawnPointParam[] = [];
        let scavSpawns: ISpawnPointParam[] = [];
        let pmcSpawns: ISpawnPointParam[] = [];
        let sniperSpawns: ISpawnPointParam[] = [];

        for (const point of allParams) {
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
                logger.info(`[MOAR] Default player spawn set for ${map}: (${x}, ${y}, ${z})`);
            }
        }

        scavSpawns = cleanClosest(AddCustomBotSpawnPoints(scavSpawns, map), mapIndex).map(p => ({
            ...p,
            BotZoneName: isSandbox ? "ZoneSandbox" : p.BotZoneName,
            Categories: ["Bot"],
            Sides: ["Savage"],
            CorePointId: 1,
            ColliderParams: {
                _parent: "SpawnSphereParams",
                _props: { Radius: radiusLimit }
            }
        }));

        pmcSpawns = cleanClosest(AddCustomPmcSpawnPoints(pmcSpawns, map), mapIndex).map(p => ({
            ...p,
            BotZoneName: isSandbox ? "ZoneSandbox" : p.BotZoneName,
            Categories: ["Coop"],
            Sides: ["Usec", "Bear"],
            CorePointId: 0,
            ColliderParams: {
                _parent: "SpawnSphereParams",
                _props: { Radius: radiusLimit }
            }
        }));

        sniperSpawns = AddCustomSniperSpawnPoints(sniperSpawns, map);

        const allSpawns = [...sniperSpawns, ...bossSpawns, ...scavSpawns, ...pmcSpawns, ...playerSpawns];

        globalValues.indexedMapSpawns[map] = allSpawns;
        base.SpawnPointParams = allSpawns;
        base.OpenZones = [...new Set(allSpawns.map(p => p.BotZoneName).filter(Boolean))].join(",");

        const playerCount = allSpawns.filter(p => p.Categories?.includes("Player")).length;
        const coopCount = allSpawns.filter(p => p.Categories?.includes("Coop")).length;
        const botCount = allSpawns.filter(p => p.Categories?.includes("Bot")).length;

        logger.info(`[MOAR] ✅ ${map}: Injected ${allSpawns.length} spawns (Player: ${playerCount}, Coop: ${coopCount}, Bot: ${botCount})`);
    }

    globalValues.initialized = true;

    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
        updateAllBotSpawns(PlayerSpawns, "playerSpawns");
        updateAllBotSpawns(PmcSpawns, "pmcSpawns");
        updateAllBotSpawns(ScavSpawns, "scavSpawns");
        updateAllBotSpawns(SniperSpawns, "sniperSpawns");
    }

    console.log(`[MOAR] ✅ setupSpawns completed. Maps initialized: ${Object.keys(globalValues.indexedMapSpawns).length}`);
    if (advancedConfig.debug) {
        console.log("[MOAR] IndexedMapSpawns keys:", Object.keys(globalValues.indexedMapSpawns));
    }
}
