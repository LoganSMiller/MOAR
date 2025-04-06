import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { Ixyz, createIxyz } from "../Models/Ixyz";
import config from "../../config/config.json";

import PlayerSpawns from "../../config/Spawns/playerSpawns.json";
import PmcSpawns from "../../config/Spawns/pmcSpawns.json";
import ScavSpawns from "../../config/Spawns/scavSpawns.json";
import SniperSpawns from "../../config/Spawns/sniperSpawns.json";

import crypto from "crypto";
import { EPlayerSide } from "@spt-aki/models/enums/EPlayerSide";
import { ESpawnCategory } from "@spt-aki/models/enums/ESpawnCategory";

/** === Types === */
export type Side = EPlayerSide;
type Category = ESpawnCategory;

/** === Constants === */
const DEFAULT_RADIUS = config.spawnRadius ?? 20;
const DEFAULT_DELAY = config.spawnDelay ?? 4;

function uuidv4(): string {
    return crypto.randomUUID();
}

function random360(): number {
    return Math.floor(Math.random() * 360);
}

function safeIxyz(input: unknown): Ixyz {
    if (typeof input === "object" && input !== null && "x" in input && "y" in input && "z" in input) {
        return createIxyz(input as { x: number; y: number; z: number });
    }

    console.warn("[MOAR] Invalid coordinates passed to safeIxyz(), returning fallback (0,0,0).");
    return createIxyz({ x: 0, y: 0, z: 0 });
}

export function getClosestZone(points: ISpawnPointParam[], x: number, y: number, z: number): string {
    let closest: ISpawnPointParam | undefined;
    let minDistance = Infinity;

    for (const point of points) {
        if (!point.BotZoneName) continue;
        const dx = point.Position.x - x;
        const dy = point.Position.y - y;
        const dz = point.Position.z - z;
        const distance = dx * dx + dy * dy + dz * dz;
        if (distance < minDistance) {
            minDistance = distance;
            closest = point;
        }
    }

    const result = closest?.BotZoneName || "fallback_zone";
    if (config.debug && !closest) {
        console.warn(`[MOAR] No BotZone found near (${x}, ${y}, ${z}), using fallback.`);
    }

    return result;
}

export function getSortedSpawnPointList(spawns: ISpawnPointParam[], x: number, y: number, z: number): ISpawnPointParam[] {
    return spawns.slice().sort((a, b) => {
        const distA = (a.Position.x - x) ** 2 + (a.Position.y - y) ** 2 + (a.Position.z - z) ** 2;
        const distB = (b.Position.x - x) ** 2 + (b.Position.y - y) ** 2 + (b.Position.z - z) ** 2;
        return distA - distB;
    });
}

function createSpawnPoint(
    coords: Ixyz,
    zone: string,
    categories: Category[],
    sides: Side[],
    radius = DEFAULT_RADIUS,
    coreId = 0
): ISpawnPointParam {
    return {
        BotZoneName: zone,
        Categories: categories,
        ColliderParams: {
            _parent: "SpawnSphereParams",
            _props: { Radius: radius }
        },
        CorePointId: coreId,
        DelayToCanSpawnSec: DEFAULT_DELAY,
        Id: uuidv4(),
        Infiltration: "",
        Position: coords.toObject(),
        Rotation: random360(),
        Sides: sides
    };
}

export const AddCustomBotSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof ScavSpawns): ISpawnPointParam[] => {
    const custom = ScavSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Scav spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords) =>
        createSpawnPoint(safeIxyz(coords), getClosestZone(spawnParams, coords.x, coords.y, coords.z), [ESpawnCategory.Bot], [EPlayerSide.Savage])
    );

    return [...spawnParams, ...newSpawns];
};

export const AddCustomPmcSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof PmcSpawns): ISpawnPointParam[] => {
    const custom = PmcSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom PMC spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords: Ixyz, index: number) =>
        createSpawnPoint(
            safeIxyz(coords),
            `coop_pmc_zone_${map}_${index}`,
            [ESpawnCategory.Coop],
            [EPlayerSide.Usec, EPlayerSide.Bear],
            DEFAULT_RADIUS,
            2000 + index
        )
    );

    return [...spawnParams, ...newSpawns];
};

export const AddCustomSniperSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof SniperSpawns): ISpawnPointParam[] => {
    const custom = SniperSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Sniper spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords, i: number) => {
        const zone = getClosestZone(spawnParams, coords.x, coords.y, coords.z);
        return createSpawnPoint(safeIxyz(coords), zone || `custom_snipe_${i}`, [ESpawnCategory.Bot], [EPlayerSide.Savage]);
    });

    return [...spawnParams, ...newSpawns];
};

export const BuildCustomPlayerSpawnPoints = (
    spawnParams: ISpawnPointParam[],
    map: keyof typeof PlayerSpawns
): ISpawnPointParam[] => {
    const custom = PlayerSpawns[map];
    const existing = spawnParams.filter(p => p.Categories?.includes(ESpawnCategory.Player) && p.Infiltration);

    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Player spawns for ${map}`);
        return existing;
    }

    const groupZone = `coop_player_group_all`; // All players grouped
    const newSpawns = custom.map((coords, index: number) =>
        createSpawnPoint(
            safeIxyz(coords),
            `${groupZone}_${index}`,
            [ESpawnCategory.Player],
            [EPlayerSide.Usec, EPlayerSide.Bear],
            1,
            1000 + index
        )
    );

    if (config.debug) {
        console.log(`[MOAR] Injected ${newSpawns.length} universal Coop player spawns into ${map}`);
    }

    return [...existing, ...newSpawns];
};

export function cleanClosest(spawns: ISpawnPointParam[], mapIndex: number, keepPlayers = false): ISpawnPointParam[] {
    const filtered: ISpawnPointParam[] = [];
    const thresholdSq = Math.pow(5 + mapIndex * 0.5, 2);

    for (const spawn of spawns) {
        if (keepPlayers && spawn.Categories?.includes(ESpawnCategory.Player)) {
            filtered.push(spawn);
            continue;
        }

        const tooClose = filtered.some(existing => {
            const dx = spawn.Position.x - existing.Position.x;
            const dy = spawn.Position.y - existing.Position.y;
            const dz = spawn.Position.z - existing.Position.z;
            return (dx * dx + dy * dy + dz * dz) < thresholdSq;
        });

        if (!tooClose) {
            filtered.push(spawn);
        }
    }

    return filtered;
}

export function removeClosestSpawnsFromCustomBots(
    source: Record<string, Ixyz[]>,
    targetPoints: ISpawnPointParam[],
    map: keyof typeof source,
    zoneKey: string
): Ixyz[] {
    const keep: Ixyz[] = [];
    const thresholdSq = Math.pow(map === "sandbox_high" ? 8 : 6, 2);

    for (const coords of source[map] ?? []) {
        const tooClose = targetPoints.some(point => {
            const dx = coords.x - point.Position.x;
            const dy = coords.y - point.Position.y;
            const dz = coords.z - point.Position.z;
            return (dx * dx + dy * dy + dz * dz) < thresholdSq;
        });

        if (!tooClose) {
            keep.push(coords);
        }
    }

    if (config.debug) {
        console.log(`[MOAR] Culling custom ${zoneKey} spawns for ${map}: kept ${keep.length}/${source[map]?.length ?? 0}`);
    }

    return keep;
}

export default getSortedSpawnPointList;
