import _config from "../../config/config.json";
<<<<<<< Updated upstream
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import mapConfig from "../../config/mapConfig.json";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { configLocations } from "./constants";
import {
  ScavSpawns,
  PlayerSpawns,
  SniperSpawns,
  PmcSpawns,
} from "../SpawnZoneChanges";

function sq(n: number) {
  return n * n;
}

function pt(a: number, b: number) {
  return Math.sqrt(sq(a) + sq(b));
}

export const getDistance = (
  x: number,
  y: number,
  z: number,
  mX: number,
  mY: number,
  mZ: number
) => {
  (x = Math.abs(x - mX)), (y = Math.abs(y - mY)), (z = Math.abs(z - mZ));

  return pt(pt(x, z), y);
=======
import mapConfig from "../../config/mapConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { configLocations } from "./constants";
import { ScavSpawns, PlayerSpawns, SniperSpawns, PmcSpawns } from "../SpawnZoneChanges";

const sq = (n: number) => n * n;
const pt = (a: number, b: number) => Math.sqrt(sq(a) + sq(b));

export const getDistance = (x: number, y: number, z: number, mX: number, mY: number, mZ: number): number => {
    return pt(pt(Math.abs(x - mX), Math.abs(z - mZ)), Math.abs(y - mY));
>>>>>>> Stashed changes
};

/**
 * Sorts spawn points by distance to a given reference point.
 * Optional `cull` parameter removes closest % of entries (e.g. 0.1 = top 10% culled).
 */
export default function getSortedSpawnPointList(
<<<<<<< Updated upstream
  SpawnPointParams: ISpawnPointParam[],
  mX: number,
  my: number,
  mZ: number,
  cull?: number
=======
    SpawnPointParams: ISpawnPointParam[],
    mX: number,
    mY: number,
    mZ: number,
    cull?: number
>>>>>>> Stashed changes
): ISpawnPointParam[] {
  let culledAmount = 0;

<<<<<<< Updated upstream
  const sorted = SpawnPointParams.sort((a, b) => {
    const a1 = getDistance(
      a.Position.x,
      a.Position.y,
      a.Position.z,
      mX,
      my,
      mZ
    );
    const b1 = getDistance(
      b.Position.x,
      b.Position.y,
      b.Position.z,
      mX,
      my,
      mZ
    );
    return a1 - b1;
  }).filter((_, index) => {
    if (!cull) return true;
    const result = index > SpawnPointParams.length * cull;
    if (!result) culledAmount++;

    return result;
  });

  if (_config.debug && culledAmount > 0) {
    console.log(
      "Reduced to " +
        Math.round((sorted.length / SpawnPointParams.length) * 100) +
        "% of original spawns",
      SpawnPointParams.length,
      ">",
      sorted.length,
      "\n"
    );
  }
  return sorted;
=======
    const sorted = SpawnPointParams
        .sort((a, b) =>
            getDistance(a.Position.x, a.Position.y, a.Position.z, mX, mY, mZ) -
            getDistance(b.Position.x, b.Position.y, b.Position.z, mX, mY, mZ)
        )
        .filter((_, index) => {
            if (!cull) return true;
            const result = index > SpawnPointParams.length * cull;
            if (!result) culledAmount++;
            return result;
        });

    if (_config.debug && culledAmount > 0) {
        console.log(`[MOAR] Culled ${culledAmount} close spawn points.`);
    }

    return sorted;
>>>>>>> Stashed changes
}

/**
 * Prevents redundant spawn points by filtering points too close to each other.
 */
export function cleanClosest(
<<<<<<< Updated upstream
  SpawnPointParams: ISpawnPointParam[],
  mapIndex: number,
  player?: boolean
): ISpawnPointParam[] {
  const map = configLocations[mapIndex];

  const mapCullingNearPointValue = player
    ? mapConfig[map].mapCullingNearPointValuePlayer
    : mapConfig[map].mapCullingNearPointValue;
  const okayList = new Set();
  const filteredParams = SpawnPointParams.map((point) => {
    const {
      Position: { x: X, y: Y, z: Z },
    } = point;
    const result = !SpawnPointParams.some(({ Position: { z, x, y }, Id }) => {
      const dist = getDistance(X, Y, Z, x, y, z);
      return mapCullingNearPointValue > dist && dist !== 0 && !okayList.has(Id);
    });

    if (!result) {
      okayList.add(point.Id);
    }

    return result
      ? point
      : {
          ...point,
          ...(player
            ? {}
            : {
                DelayToCanSpawnSec: 9999999,
              }),
          CorePointId: 99999,
          Categories: [],
          Sides: [],
        };
  });

  if (_config.debug) {
    const actualCulled = filteredParams.filter(
      ({ Categories }) => !!Categories.length
    );
    console.log(
      map,
      filteredParams.length,
      ">",
      actualCulled.length,
      "Reduced to " +
        Math.round((actualCulled.length / filteredParams.length) * 100) +
        "% of original spawns",
      player ? "player" : "bot"
    ); // high, low}
  }

  return filteredParams.filter((point) => !!point.Categories.length);

  // if (!_config.debug) {
  //   const actualCulled = culled.filter(({ Categories }) => !!Categories.length);
  //   console.log(
  //     map,
  //     "Reduced to " +
  //     Math.round((actualCulled.length / culled.length) * 100) +
  //     "% of original spawns",
  //     culled.length,
  //     ">",
  //     actualCulled.length
  //     // "\n"
  //   ); // high, low}
  // }
}

export function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

export const AddCustomPmcSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string
) => {
  if (!PmcSpawns[map] || !PmcSpawns[map].length) {
    _config.debug && console.log("no custom Bot spawns for " + map);
    return SpawnPointParams;
  }

  const playerSpawns = PmcSpawns[map].map((coords: Ixyz, index: number) => ({
    BotZoneName: getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z),
    Categories: ["Coop", Math.random() ? "Group" : "Opposite"],
    Sides: ["Pmc"],
    CorePointId: 0,
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 20,
      },
    },
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: random360(),
  }));

  return [...SpawnPointParams, ...playerSpawns];
};

export const AddCustomBotSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string
) => {
  if (!ScavSpawns[map] || !ScavSpawns[map].length) {
    _config.debug && console.log("no custom Bot spawns for " + map);
    return SpawnPointParams;
  }

  const scavSpawns = ScavSpawns[map].map((coords: Ixyz) => ({
    BotZoneName: getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z),
    Categories: ["Bot"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 20,
      },
    },
    CorePointId: 1,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: random360(),
    Sides: ["Savage"],
  }));
=======
    SpawnPointParams: ISpawnPointParam[],
    mapIndex: number,
    player = false
): ISpawnPointParam[] {
    const map = configLocations[mapIndex];
    const threshold = player
        ? mapConfig[map].mapCullingNearPointValuePlayer
        : mapConfig[map].mapCullingNearPointValue;

    const okayList = new Set();
    const filtered = SpawnPointParams.map((point) => {
        const { x: X, y: Y, z: Z } = point.Position;
        const tooClose = SpawnPointParams.some(({ Position: { x, y, z }, Id }) => {
            const dist = getDistance(X, Y, Z, x, y, z);
            return dist < threshold && dist !== 0 && !okayList.has(Id);
        });

        if (tooClose) {
            okayList.add(point.Id);
            return {
                ...point,
                ...(player ? {} : { DelayToCanSpawnSec: 9999999 }),
                CorePointId: 99999,
                Categories: [],
                Sides: [],
            };
        }

        return point;
    });

    const result = filtered.filter(p => p.Categories.length);

    if (_config.debug) {
        console.log(
            `[MOAR] ${map} culled ${filtered.length - result.length} spawn points (${player ? "player" : "bot"})`
        );
    }

    return result;
}

export const uuidv4 = () =>
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
    );

export const random360 = () => Math.random() * 360;

/**
 * Adds custom PMC spawn points to the map.
 */
export const AddCustomPmcSpawnPoints = (SpawnPointParams: ISpawnPointParam[], map: string) => {
    if (!PmcSpawns[map]?.length) {
        _config.debug && console.log(`[MOAR] No PMC spawns defined for ${map}`);
        return SpawnPointParams;
    }

    const pmcSpawns = PmcSpawns[map].map((coords: Ixyz) => ({
        BotZoneName: getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z),
        Categories: ["Coop", Math.random() > 0.5 ? "Group" : "Opposite"],
        Sides: ["Pmc"],
        CorePointId: 0,
        ColliderParams: {
            _parent: "SpawnSphereParams",
            _props: { Center: { x: 0, y: 0, z: 0 }, Radius: 20 }
        },
        DelayToCanSpawnSec: 4,
        Id: uuidv4(),
        Infiltration: "",
        Position: coords,
        Rotation: random360()
    }));

    return [...SpawnPointParams, ...pmcSpawns];
};

/**
 * Adds custom Scav spawn points to the map.
 */
export const AddCustomBotSpawnPoints = (SpawnPointParams: ISpawnPointParam[], map: string) => {
    if (!ScavSpawns[map]?.length) {
        _config.debug && console.log(`[MOAR] No Scav spawns defined for ${map}`);
        return SpawnPointParams;
    }

    const scavSpawns = ScavSpawns[map].map((coords: Ixyz) => ({
        BotZoneName: getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z),
        Categories: ["Bot"],
        ColliderParams: {
            _parent: "SpawnSphereParams",
            _props: { Center: { x: 0, y: 0, z: 0 }, Radius: 20 }
        },
        CorePointId: 1,
        DelayToCanSpawnSec: 4,
        Id: uuidv4(),
        Infiltration: "",
        Position: coords,
        Rotation: random360(),
        Sides: ["Savage"]
    }));
>>>>>>> Stashed changes

  return [...SpawnPointParams, ...scavSpawns];
};

<<<<<<< Updated upstream
export const AddCustomSniperSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string
) => {
  if (!SniperSpawns[map] || !SniperSpawns[map].length) {
    _config.debug && console.log("no custom Player spawns for " + map);
    return SpawnPointParams;
  }

  const sniperSpawns = SniperSpawns[map].map((coords: Ixyz, index: number) => ({
    BotZoneName:
      getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z) ||
      "custom_snipe_" + index,
    Categories: ["Bot"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 20,
      },
    },
    CorePointId: 1,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: random360(),
    Sides: ["Savage"],
  }));
=======
/**
 * Adds custom sniper spawn points.
 */
export const AddCustomSniperSpawnPoints = (SpawnPointParams: ISpawnPointParam[], map: string) => {
    if (!SniperSpawns[map]?.length) {
        _config.debug && console.log(`[MOAR] No Sniper spawns defined for ${map}`);
        return SpawnPointParams;
    }

    const sniperSpawns = SniperSpawns[map].map((coords: Ixyz, i: number) => ({
        BotZoneName: getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z) || `custom_snipe_${i}`,
        Categories: ["Bot"],
        ColliderParams: {
            _parent: "SpawnSphereParams",
            _props: { Center: { x: 0, y: 0, z: 0 }, Radius: 20 }
        },
        CorePointId: 1,
        DelayToCanSpawnSec: 4,
        Id: uuidv4(),
        Infiltration: "",
        Position: coords,
        Rotation: random360(),
        Sides: ["Savage"]
    }));
>>>>>>> Stashed changes

  return [...SpawnPointParams, ...sniperSpawns];
};

/**
 * Returns a copy of all vanilla + custom player spawn points.
 */
export const BuildCustomPlayerSpawnPoints = (
<<<<<<< Updated upstream
  map: string,
  refSpawns: ISpawnPointParam[]
) => {
  const playerOnlySpawns = refSpawns
    .filter((item) => !!item.Infiltration && item.Categories[0] === "Player")
    .map((point) => {
      point.ColliderParams._props.Radius = 1;
      point.Position.y = point.Position.y + 0.5;
      return {
        ...point,
        BotZoneName: "",
=======
    map: string,
    refSpawns: ISpawnPointParam[]
): ISpawnPointParam[] => {
    const playerOnlySpawns = refSpawns
        .filter(s => !!s.Infiltration && s.Categories?.[0] === "Player")
        .map(point => ({
            ...point,
            ColliderParams: { ...point.ColliderParams, _props: { ...point.ColliderParams._props, Radius: 1 } },
            Position: { ...point.Position, y: point.Position.y + 0.5 },
            BotZoneName: "",
            isCustom: true,
            Id: uuidv4(),
            Sides: ["Pmc"]
        }));

    if (!PlayerSpawns[map]?.length) {
        _config.debug && console.log(`[MOAR] No Player spawns defined for ${map}`);
        return playerOnlySpawns;
    }

    const getClosestInfil = (X: number, Y: number, Z: number) => {
        let closest = Infinity;
        let selected = "";
        for (const { Infiltration, Position: { x, y, z } } of playerOnlySpawns) {
            const dist = getDistance(X, Y, Z, x, y, z);
            if (Infiltration && dist < closest) {
                closest = dist;
                selected = Infiltration;
            }
        }
        return selected;
    };

    const customSpawns = PlayerSpawns[map].map((coords: Ixyz) => ({
        BotZoneName: "",
        Categories: ["Player"],
        ColliderParams: {
            _parent: "SpawnSphereParams",
            _props: { Center: { x: 0, y: 0, z: 0 }, Radius: 1 }
        },
>>>>>>> Stashed changes
        isCustom: true,
        Id: uuidv4(),
<<<<<<< Updated upstream
        Sides: ["Pmc"],
      };
    });

  // console.log(map, playerOnlySpawns.length);
  if (!PlayerSpawns[map] || !PlayerSpawns[map].length) {
    _config.debug && console.log("no custom Player spawns for " + map);
    return playerOnlySpawns;
  }

  const getClosestInfil = (X: number, Y: number, Z: number) => {
    let closest = Infinity;
    let selectedInfil = "";

    playerOnlySpawns.forEach(({ Infiltration, Position: { x, y, z } }) => {
      const dist = getDistance(X, Y, Z, x, y, z);
      if (!!Infiltration && dist < closest) {
        closest = dist;
        selectedInfil = Infiltration;
      }
    });

    return selectedInfil;
  };

  const playerSpawns = PlayerSpawns[map].map((coords: Ixyz, index) => ({
    BotZoneName: "",
    Categories: ["Player"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 1,
      },
    },
    isCustom: true,
    CorePointId: 0,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: getClosestInfil(coords.x, coords.y, coords.z),
    Position: coords,
    Rotation: random360(),
    Sides: ["Pmc"],
  }));

  // TODO: Check infils
  // console.log(map);
  // console.log(playerOnlySpawns[0], playerSpawns[0]);

  return [...playerOnlySpawns, ...playerSpawns];
=======
        Infiltration: getClosestInfil(coords.x, coords.y, coords.z),
        Position: coords,
        Rotation: random360(),
        Sides: ["Pmc"]
    }));

    return [...playerOnlySpawns, ...customSpawns];
>>>>>>> Stashed changes
};

/**
 * Finds the closest BotZoneName from a spawn list to a given position.
 */
export const getClosestZone = (
<<<<<<< Updated upstream
  params: ISpawnPointParam[],
  x: number,
  y: number,
  z: number
) => {
  if (
    Array.isArray(params) &&
    !params.filter(({ BotZoneName }) => BotZoneName).length
  )
    return "";

  return (
    getSortedSpawnPointList(params, x, y, z).find(
      ({ BotZoneName }) => !!BotZoneName
    )?.BotZoneName || ""
  );
=======
    params: ISpawnPointParam[],
    x: number,
    y: number,
    z: number
): string => {
    return getSortedSpawnPointList(params, x, y, z).find(p => !!p.BotZoneName)?.BotZoneName || "";
>>>>>>> Stashed changes
};

/**
 * Filters out custom spawns that are too close to vanilla spawns or to each other.
 */
export const removeClosestSpawnsFromCustomBots = (
<<<<<<< Updated upstream
  CustomBots: Record<string, Ixyz[]>,
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  mapConfigMap: string
) => {
  if (!CustomBots[map] || !CustomBots[map].length) {
    console.log(map, "Is empty");
    return;
  }

  const coords: Ixyz[] = CustomBots[map];

  const mapCullingNearPointValue =
    mapConfig[mapConfigMap].mapCullingNearPointValue;

  let filteredCoords = coords.filter(
    ({ x: X, y: Y, z: Z }) =>
      !SpawnPointParams.some(({ Position: { z, x, y } }) => {
        return mapCullingNearPointValue > getDistance(X, Y, Z, x, y, z);
      })
  );

  const okayList = new Set();

  filteredCoords = [...coords].filter(({ x: X, y: Y, z: Z }, index) => {
    const result = !coords.some(({ z, x, y }) => {
      const dist = getDistance(X, Y, Z, x, y, z);
      return (
        mapCullingNearPointValue * 1.3 > dist &&
        dist !== 0 &&
        !okayList.has("" + x + y + z)
      );
=======
    CustomBots: Record<string, Ixyz[]>,
    SpawnPointParams: ISpawnPointParam[],
    map: string,
    mapConfigKey: string
): Ixyz[] | undefined => {
    if (!CustomBots[map]?.length) {
        console.log(`[MOAR] No custom bots for ${map}`);
        return;
    }

    const radius = mapConfig[mapConfigKey].mapCullingNearPointValue;
    const coords = CustomBots[map];

    // Remove if near vanilla spawn
    let filtered = coords.filter(({ x, y, z }) =>
        !SpawnPointParams.some(({ Position }) =>
            getDistance(Position.x, Position.y, Position.z, x, y, z) < radius
        )
    );

    // Remove if near each other
    const seen = new Set();
    filtered = filtered.filter(({ x, y, z }) => {
        const key = `${x}${y}${z}`;
        const tooClose = coords.some(({ x: x2, y: y2, z: z2 }) => {
            const dist = getDistance(x, y, z, x2, y2, z2);
            return dist < radius * 1.3 && dist !== 0 && !seen.has(`${x2}${y2}${z2}`);
        });
        if (!tooClose) seen.add(key);
        return !tooClose;
>>>>>>> Stashed changes
    });
    if (!result) okayList.add("" + X + Y + Z);
    return result;
  });

<<<<<<< Updated upstream
  console.log(
    map,
    coords.length,
    ">",
    filteredCoords.length,
    "culled",
    coords.length - filteredCoords.length,
    "spawns"
  );
  return filteredCoords;
=======
    console.log(`[MOAR] ${map} culled ${coords.length - filtered.length} custom spawns`);
    return filtered;
>>>>>>> Stashed changes
};
