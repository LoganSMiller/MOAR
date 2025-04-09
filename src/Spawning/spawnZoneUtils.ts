import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { Ixyz, createIxyz } from "../Models/Ixyz";
import config from "../../config/config.json";

import PlayerSpawns from "../../config/Spawns/playerSpawns.json";
import PmcSpawns from "../../config/Spawns/pmcSpawns.json";
import ScavSpawns from "../../config/Spawns/scavSpawns.json";
import SniperSpawns from "../../config/Spawns/sniperSpawns.json";

// === Constants ===
const DEFAULT_RADIUS = typeof config.spawnRadius === "number" ? config.spawnRadius : 20;
const DEFAULT_DELAY = typeof config.spawnDelay === "number" ? config.spawnDelay : 4;

// === Utility: UUID generator ===
function uuidv4(): string {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
    );
}

// === Utility: Random Y-axis rotation ===
function random360(): number {
    return Math.floor(Math.random() * 360);
}

// === Utility: Safe Ixyz coercion ===
function safeIxyz(input: unknown): Ixyz {
    if (
        typeof input === "object" &&
        input !== null &&
        "x" in input &&
        "y" in input &&
        "z" in input
    ) {
        const { x, y, z } = input as { x: number; y: number; z: number };
        return createIxyz({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 });
    }

    console.warn("[MOAR] ⚠ Invalid coordinates passed to safeIxyz(), defaulting to (0,0,0).");
    return createIxyz({ x: 0, y: 0, z: 0 });
}

// === Utility: Find closest BotZone ===
export function getClosestZone(points: ISpawnPointParam[], x: number, y: number, z: number): string {
    let closest: ISpawnPointParam | undefined;
    let minDistance = Infinity;

    for (const point of points) {
        if (!point?.Position || !point.BotZoneName) continue;
        const dx = point.Position.x - x;
        const dy = point.Position.y - y;
        const dz = point.Position.z - z;
        const distance = dx * dx + dy * dy + dz * dz;
        if (distance < minDistance) {
            minDistance = distance;
            closest = point;
        }
    }

    if (!closest && config.debug) {
        console.warn(`[MOAR] ⚠ No BotZone found near (${x}, ${y}, ${z}), using fallback.`);
    }

    return closest?.BotZoneName ?? "fallback_zone";
}

// === Utility: Sort spawn points by distance ===
export function getSortedSpawnPointList(
    spawns: ISpawnPointParam[],
    x: number,
    y: number,
    z: number
): ISpawnPointParam[] {
    return spawns
        .filter(p => !!p?.Position)
        .slice()
        .sort((a, b) => {
            const distA = (a.Position.x - x) ** 2 + (a.Position.y - y) ** 2 + (a.Position.z - z) ** 2;
            const distB = (b.Position.x - x) ** 2 + (b.Position.y - y) ** 2 + (b.Position.z - z) ** 2;
            return distA - distB;
        });
}

// === Utility: Create a spawn point ===
function createSpawnPoint(
    coords: Ixyz,
    zone: string,
    categories: string[],
    sides: string[],
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

// === Spawn Injectors ===
export const AddCustomBotSpawnPoints = (
    spawnParams: ISpawnPointParam[],
    map: keyof typeof ScavSpawns
): ISpawnPointParam[] => {
    const custom = ScavSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Scav spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map(coords =>
        createSpawnPoint(
            safeIxyz(coords),
            getClosestZone(spawnParams, coords.x, coords.y, coords.z),
            ["Bot"],
            ["Savage"]
        )
    );

    return [...spawnParams, ...newSpawns];
};

export const AddCustomPmcSpawnPoints = (
    spawnParams: ISpawnPointParam[],
    map: keyof typeof PmcSpawns
): ISpawnPointParam[] => {
    const custom = PmcSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom PMC spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map((coords, i) =>
        createSpawnPoint(
            safeIxyz(coords),
            `coop_pmc_zone_${map}_${i}`,
            ["Coop"],
            ["Usec", "Bear"],
            DEFAULT_RADIUS,
            2000 + i
        )
    );

    return [...spawnParams, ...newSpawns];
};

export const AddCustomSniperSpawnPoints = (
    spawnParams: ISpawnPointParam[],
    map: keyof typeof SniperSpawns
): ISpawnPointParam[] => {
    const custom = SniperSpawns[map];
    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Sniper spawns for ${map}`);
        return spawnParams;
    }

    const newSpawns = custom.map(coords =>
        createSpawnPoint(
            safeIxyz(coords),
            getClosestZone(spawnParams, coords.x, coords.y, coords.z),
            ["Bot"],
            ["Savage"]
        )
    );

    return [...spawnParams, ...newSpawns];
};

export const BuildCustomPlayerSpawnPoints = (
    spawnParams: ISpawnPointParam[],
    map: keyof typeof PlayerSpawns
): ISpawnPointParam[] => {
    const custom = PlayerSpawns[map];
    const existing = spawnParams.filter(p => p.Categories?.includes("Player") && p.Infiltration);

    if (!custom?.length) {
        if (config.debug) console.warn(`[MOAR] No custom Player spawns for ${map}`);
        return existing;
    }

    const newSpawns = custom.map((coords, i) =>
        createSpawnPoint(
            safeIxyz(coords),
            `coop_player_group_all_${i}`,
            ["Player"],
            ["Usec", "Bear"],
            1,
            1000 + i
        )
    );

    if (config.debug) {
        console.log(`[MOAR] ✅ Injected ${newSpawns.length} Coop player spawns into ${map}`);
    }

    return [...existing, ...newSpawns];
};

// === Spawn Cleanup ===

export function cleanClosest(
    spawns: ISpawnPointParam[],
    mapIndex: number,
    keepPlayers = false
): ISpawnPointParam[] {
    const filtered: ISpawnPointParam[] = [];
    const thresholdSq = Math.pow(5 + mapIndex * 0.5, 2);

    for (const spawn of spawns) {
        if (!spawn?.Position) continue;

        if (keepPlayers && spawn.Categories?.includes("Player")) {
            filtered.push(spawn);
            continue;
        }

        const isTooClose = filtered.some(existing => {
            const dx = spawn.Position.x - existing.Position.x;
            const dy = spawn.Position.y - existing.Position.y;
            const dz = spawn.Position.z - existing.Position.z;
            return dx * dx + dy * dy + dz * dz < thresholdSq;
        });

        if (!isTooClose) {
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
    const result: Ixyz[] = [];
    const thresholdSq = Math.pow(map === "sandbox_high" ? 8 : 6, 2);

    for (const coords of source[map] ?? []) {
        const isTooClose = targetPoints.some(p => {
            const dx = coords.x - p.Position.x;
            const dy = coords.y - p.Position.y;
            const dz = coords.z - p.Position.z;
            return dx * dx + dy * dy + dz * dz < thresholdSq;
        });

        if (!isTooClose) {
            result.push(coords);
        }
    }

    if (config.debug) {
        const original = source[map]?.length ?? 0;
        console.log(`[MOAR]  Culling custom ${zoneKey} spawns for ${map}: kept ${result.length}/${original}`);
    }

    return result;
}

export default getSortedSpawnPointList;
