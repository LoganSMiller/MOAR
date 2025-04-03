import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import type { Position } from "../types";
import crypto from "crypto";

import PlayerSpawns from "../../config/Spawns/playerSpawns.json";
import PmcSpawns from "../../config/Spawns/pmcSpawns.json";
import ScavSpawns from "../../config/Spawns/scavSpawns.json";
import SniperSpawns from "../../config/Spawns/sniperSpawns.json";
import config from "../../config/config.json";

/** Generate a UUIDv4 string */
function uuidv4(): string {
    return crypto.randomUUID();
}

/** Random rotation from 0–359 degrees */
function random360(): number {
    return Math.floor(Math.random() * 360);
}

/** Find the closest BotZoneName to a given position */
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

    return closest?.BotZoneName || "";
}

/** Sort spawn points by distance to a given coordinate */
export function getSortedSpawnPointList(spawns: ISpawnPointParam[], x: number, y: number, z: number): ISpawnPointParam[] {
    return spawns.slice().sort((a, b) => {
        const distA = (a.Position.x - x) ** 2 + (a.Position.y - y) ** 2 + (a.Position.z - z) ** 2;
        const distB = (b.Position.x - x) ** 2 + (b.Position.y - y) ** 2 + (b.Position.z - z) ** 2;
        return distA - distB;
    });
}

/** Create a new ISpawnPointParam with standard settings */
function createSpawnPoint(
    coords: Position,
    zone: string,
    categories: string[],
    sides: string[],
    radius = 20,
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
        DelayToCanSpawnSec: 4,
        Id: uuidv4(),
        Infiltration: "",
        Position: coords,
        Rotation: random360(),
        Sides: sides
    };
}

// === Injectors ===

export const AddCustomBotSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof ScavSpawns): ISpawnPointParam[] => {
    const custom = ScavSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Scav spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords: Position) =>
        createSpawnPoint(coords, getClosestZone(spawnParams, coords.x, coords.y, coords.z), ["Bot"], ["Savage"])
    );

    return [...spawnParams, ...newSpawns];
};

export const AddCustomPmcSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof PmcSpawns): ISpawnPointParam[] => {
    const custom = PmcSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom PMC spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords: Position) =>
        createSpawnPoint(coords, getClosestZone(spawnParams, coords.x, coords.y, coords.z), ["Coop", Math.random() > 0.5 ? "Group" : "Opposite"], ["Pmc"])
    );

    return [...spawnParams, ...newSpawns];
};

export const AddCustomSniperSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof SniperSpawns): ISpawnPointParam[] => {
    const custom = SniperSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Sniper spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords: Position, i: number) =>
        createSpawnPoint(coords, getClosestZone(spawnParams, coords.x, coords.y, coords.z) || `custom_snipe_${i}`, ["Bot"], ["Savage"])
    );

    return [...spawnParams, ...newSpawns];
};

/** Custom player spawn generator — supports Coop grouping */
export const BuildCustomPlayerSpawnPoints = (spawnParams: ISpawnPointParam[], map: keyof typeof PlayerSpawns): ISpawnPointParam[] => {
    const custom = PlayerSpawns[map];
    const existing = spawnParams.filter(p => p.Categories?.includes("Player") && p.Infiltration);

    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Player spawns for ${map}`);
        return existing;
    }

    const coopZone = "coop_start_zone";
    const newSpawns = custom.map((coords: Position, index: number) =>
        createSpawnPoint(coords, coopZone, ["Player"], ["Pmc"], 1, index)
    );

    if (config.debug) {
        console.log(`[MOAR] Injected ${newSpawns.length} Coop player spawns into ${map}`);
    }

    return [...existing, ...newSpawns];
};

/** Removes spawns that are too close together (unless player spawn) */
export function cleanClosest(spawns: ISpawnPointParam[], mapIndex: number, keepPlayers = false): ISpawnPointParam[] {
    const filtered: ISpawnPointParam[] = [];
    const thresholdSq = Math.pow(5 + mapIndex * 0.5, 2);

    for (const spawn of spawns) {
        if (keepPlayers && spawn.Categories?.includes("Player")) {
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

/** Culls custom spawn positions if they're too close to vanilla points */
export function removeClosestSpawnsFromCustomBots(
    source: Record<string, Position[]>,
    targetPoints: ISpawnPointParam[],
    map: keyof typeof source,
    zoneKey: string
): Position[] {
    const keep: Position[] = [];
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
