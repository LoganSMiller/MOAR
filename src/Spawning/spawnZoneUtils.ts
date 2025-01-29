import _config from "../../config/config.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { shuffle } from "./utils";
import mapConfig from "../../config/mapConfig.json";
import { BotSpawns, PlayerSpawns } from "../Spawns";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { globalValues } from "../GlobalValues";
import { configLocations } from "./constants";

// const getDistance = (x: number, z: number, mX: number, mZ: number) => {
//   const pA1 = x - mX;
//   const pB2 = z - mZ;

//   return Math.sqrt(pA1 * pA1 + pB2 * pB2);
// };

function sq(n: number) {
  return n * n;
}

function pt(a: number, b: number) {
  return Math.sqrt(sq(a) + sq(b));
}

const getDistance = (x: number, y: number, z: number, mX: number, mY: number, mZ: number) => {
  x = Math.abs(x - mX),
    y = Math.abs(y - mY),
    z = Math.abs(z - mZ);

  return pt(pt(x, z), y);
}

export default function getSortedSpawnPointList(
  SpawnPointParams: ISpawnPointParam[],
  mX: number,
  my: number,
  mZ: number,
  cull?: number
): ISpawnPointParam[] {
  let culledAmount = 0;

  const sortedCulledResult = SpawnPointParams.sort((a, b) => {
    const a1 = getDistance(a.Position.x, a.Position.y, a.Position.z, mX, my, mZ);
    const b1 = getDistance(b.Position.x, b.Position.y, b.Position.z, mX, my, mZ);
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
      Math.round(
        (sortedCulledResult.length / SpawnPointParams.length) * 100
      ) +
      "% of original spawns",
      SpawnPointParams.length,
      ">",
      sortedCulledResult.length,
      "\n"
    );
  }
  return sortedCulledResult;
}

export function cleanClosest(
  SpawnPointParams: ISpawnPointParam[],
  map: string
): ISpawnPointParam[] {
  const mapCullingNearPointValue =
    mapConfig[map as keyof typeof mapConfig].mapCullingNearPointValue;

  const sortedSpawnPoints = getSortedSpawnPointList(
    SpawnPointParams,
    -100000,
    -100000,
    -100000
  );

  let prev = undefined;

  const culled = sortedSpawnPoints.map(({ Position, ...rest }) => {
    // const fromMiddle = getDistance(Position.x, Position.z, mX, mZ)
    if (
      !!prev &&
      getDistance(prev.x, prev.y, prev.z, Position.x, Position.y, Position.z) <
      mapCullingNearPointValue
    ) {
      return {
        ...rest,
        Position,
        DelayToCanSpawnSec: 9999999,
        CorePointId: 99999,
        BotZoneName: "_removed",
        Categories: [],
        Sides: [],
      };
    }

    prev = Position;
    return { Position, ...rest };
  });

  if (_config.debug) {
    const actualCulled = culled.filter(({ Categories }) => !!Categories.length);
    console.log(
      map,
      "Reduced to " +
      Math.round((actualCulled.length / culled.length) * 100) +
      "% of original spawns",
      culled.length,
      ">",
      actualCulled.length
      // "\n"
    ); // high, low}
  }

  return culled;
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

export const AddCustomBotSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  mapIndex: number
) => {
  const mapConfigMap = configLocations[mapIndex];

  if (!BotSpawns[map] || !BotSpawns[map].length) {
    _config.debug && console.log("no custom Bot spawns for " + map);
    return SpawnPointParams;
  }

  const spawnMinDistance =
    mapConfig[mapConfigMap as keyof typeof mapConfig].spawnMinDistance;

  const botSpawns = BotSpawns[map].map((coords: Ixyz, index: number) => ({
    BotZoneName:
      getClosestZone(mapIndex, coords.x, coords.y, coords.z) || "Added_" + index,
    Categories: ["Bot"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: spawnMinDistance,
      },
    },
    CorePointId: 1,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: 116.208389,
    Sides: ["Savage"],
  }));

  return [...SpawnPointParams, ...botSpawns];
};

export const AddCustomPlayerSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  mapConfigMap: string
) => {
  if (!PlayerSpawns[map] || !PlayerSpawns[map].length) {
    _config.debug && console.log("no custom Player spawns for " + map);
    return SpawnPointParams;
  }

  const infilHash: Record<string, Ixyz> = {};

  SpawnPointParams.forEach((point) => {
    if (!infilHash[point.Infiltration]) {
      infilHash[point.Infiltration] = point.Position;
    } else {
      infilHash[point.Infiltration].x = Math.round(
        (infilHash[point.Infiltration].x + point.Position.x) / 2
      );
      infilHash[point.Infiltration].z = Math.round(
        (infilHash[point.Infiltration].z + point.Position.z) / 2
      );
    }
  });

  const getClosestInfil = (x: number, y: number, z: number) => {
    let closest = Infinity;
    let selectedInfil = Object.keys(infilHash)[0];
    Object.keys(infilHash).forEach((infil) => {
      const current = infilHash[infil];
      const dist = getDistance(current.x, current.y, current.z, x, y, z);
      if (dist < closest) {
        closest = dist;
        selectedInfil = infil;
      }
    });

    return selectedInfil;
  };

  const spawnMinDistance =
    mapConfig[mapConfigMap as keyof typeof mapConfig].spawnMinDistance;

  const playerSpawns = PlayerSpawns[map].map((coords: Ixyz, index) => ({
    BotZoneName: "Added_" + index,
    Categories: ["Player"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: spawnMinDistance,
      },
    },
    CorePointId: 0,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: getClosestInfil(coords.x, coords.y, coords.z),
    Position: coords,
    Rotation: 116.208389,
    Sides: ["Pmc"],
  }));

  return [...SpawnPointParams, ...playerSpawns];
};

export const getClosestZone = (mapIndex: number, x: number, y: number, z: number) => {
  if (!globalValues.zoneHash[mapIndex]) return "";
  let closest = Infinity;
  let selectedZone = Object.keys(globalValues.zoneHash[mapIndex])?.[0];
  Object.keys(globalValues.zoneHash[mapIndex]).forEach((zone) => {
    const current = globalValues.zoneHash[mapIndex][zone];
    const dist = getDistance(current.x, current.y, current.z, x, y, z);
    if (dist < closest) {
      closest = dist;
      selectedZone = zone;
    }
  });

  return selectedZone || "";
};



export const removeClosestSpawnsFromCustomBots = (SpawnPointParams: ISpawnPointParam[],
  map: string, mapConfigMap: string) => {
  if (!BotSpawns[map] || !BotSpawns[map].length) {
    console.log("No map called ", map)
    return;
  }

  const coords: Ixyz[] = BotSpawns[map]

  const mapCullingNearPointValue = mapConfig[mapConfigMap].mapCullingNearPointValue

  // let lowest = Infinity, highest = 0, average = 0

  let filteredCoords = coords.filter(({ x: X, y: Y, z: Z }) =>
    !SpawnPointParams.some(({ Position: { z, x, y } }) => {
      return mapCullingNearPointValue > getDistance(X, Y, Z, x, y, z)
      // lowest = Math.min(lowest, dist)
      // highest = Math.max(highest, dist)
      // average = (average + dist) / 2
    })
  )

  // console.log(map, coords.length, filteredCoords.length)

  // remove close coordinates
  filteredCoords = [...coords].filter(({ x: X, y: Y, z: Z }, index) =>
    !coords.some(({ z, x, y }) => {
      const dist = getDistance(X, Y, Z, x, y, z)
      return mapCullingNearPointValue * 1.3 > dist && dist !== 0
    })
  )

  console.log(map, coords.length, ">", filteredCoords.length, "culled", coords.length - filteredCoords.length, "spawns")
  return filteredCoords

  // await updateAllBotSpawns(map, filteredCoords)
}
