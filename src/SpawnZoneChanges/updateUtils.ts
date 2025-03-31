import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { getDistance } from "../Spawning/spawnZoneUtils";
<<<<<<< Updated upstream

const fs = require("fs");
const path = require("path");
const currentDirectory = process.cwd();
// Function to update JSON file
export const updateJsonFile = <T>(
  filePath: string,
  callback: (jsonData) => void,
  successMessage: string
) => {
  // Read the JSON file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    // Parse the JSON data
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing JSON data:", parseError);
      return;
    }

    callback(jsonData);

    // Update the JSON object

    // Write the updated JSON object back to the file
    fs.writeFile(
      filePath,
      JSON.stringify(jsonData, null, 2),
      "utf8",
      (writeError) => {
        if (writeError) {
          console.error("Error writing the file:", writeError);
          return;
        }

        console.log(successMessage);
      }
    );
  });
=======
import fs from "fs";
import path from "path";

const SPAWN_DIR = path.resolve(__dirname, "../../config/Spawns");

/**
 * Update a JSON file using a transformation callback.
 */
export const updateJsonFile = <T>(
    filePath: string,
    callback: (jsonData: any) => void,
    successMessage: string
): void => {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return console.error("[MOAR] Failed to read file:", err);

        let jsonData: any;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.error("[MOAR] JSON parse error:", parseErr);
            return;
        }

        callback(jsonData);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf8", (writeErr) => {
            if (writeErr) return console.error("[MOAR] Failed to write file:", writeErr);
            console.log(`[MOAR] ${successMessage}`);
        });
    });
>>>>>>> Stashed changes
};

/**
 * Append a bot spawn point to the JSON config file.
 */
export const updateBotSpawn = (
<<<<<<< Updated upstream
  map: string,
  value: Ixyz,
  type: "player" | "pmc" | "scav" | "sniper"
) => {
  map = map.toLowerCase();
  updateJsonFile<Ixyz>(
    `${currentDirectory}/user/mods/DewardianDev-MOAR/config/Spawns/${type}Spawns.json`,
    (jsonData) => {
      value.y = value.y + 0.5;
      if (jsonData[map]) {
        jsonData[map].push(value);
      } else {
        jsonData[map] = [value];
      }
    },
    "Successfully added one bot spawn to " + map
  );
=======
    map: string,
    value: Ixyz,
    type: "player" | "pmc" | "scav" | "sniper"
): void => {
    const filePath = path.join(SPAWN_DIR, `${type}Spawns.json`);
    const key = map.toLowerCase();

    updateJsonFile<Ixyz>(filePath, (jsonData) => {
        value.y += 0.5;
        if (!jsonData[key]) jsonData[key] = [];
        jsonData[key].push(value);
    }, `Added ${type} spawn to ${map}`);
>>>>>>> Stashed changes
};

/**
 * Remove the closest bot spawn point to a given position.
 */
export const deleteBotSpawn = (
<<<<<<< Updated upstream
  map: string,
  value: Ixyz,
  type: "player" | "pmc" | "scav" | "sniper"
) => {
  map = map.toLowerCase();
  updateJsonFile<Ixyz>(
    `${currentDirectory}/user/mods/DewardianDev-MOAR/config/Spawns/${type}Spawns.json`,
    (jsonData) => {
      if (jsonData[map]) {
        const { x: X, y: Y, z: Z } = value;
        let nearest = undefined;
        let nearDist = Infinity;
        jsonData[map].forEach(({ x, y, z }, index) => {
          const dist = getDistance(x, y, z, X, Y, Z);
          if (dist < nearDist) {
            nearest = index;
            nearDist = dist;
          }
        });

        if (nearest) {
          (jsonData[map] as Ixyz[]).splice(nearest, 1);
        } else {
          console.log("No nearest spawn on " + map);
        }
      }
    },
    "Successfully removed one bot spawn from "
  );
=======
    map: string,
    value: Ixyz,
    type: "player" | "pmc" | "scav" | "sniper"
): void => {
    const filePath = path.join(SPAWN_DIR, `${type}Spawns.json`);
    const key = map.toLowerCase();

    updateJsonFile<Ixyz>(filePath, (jsonData) => {
        if (!jsonData[key]) return;

        const { x: X, y: Y, z: Z } = value;
        let nearestIndex = -1;
        let shortest = Infinity;

        jsonData[key].forEach(({ x, y, z }, index) => {
            const dist = getDistance(x, y, z, X, Y, Z);
            if (dist < shortest) {
                shortest = dist;
                nearestIndex = index;
            }
        });

        if (nearestIndex !== -1) {
            jsonData[key].splice(nearestIndex, 1);
        } else {
            console.warn(`[MOAR] No close spawn found to delete on ${map}`);
        }
    }, `Removed ${type} spawn from ${map}`);
>>>>>>> Stashed changes
};

/**
 * Overwrites all bot spawns for a given type.
 */
export const updateAllBotSpawns = (
<<<<<<< Updated upstream
  values: Record<string, Ixyz[]>,
  targetType: string
) =>
  updateJsonFile<Ixyz>(
    `${currentDirectory}/user/mods/DewardianDev-MOAR/config/Spawns/${targetType}.json`,
    (jsonData) => {
      Object.keys(jsonData).forEach((map) => (jsonData[map] = values[map]));
    },
    "Successfully updated all Spawns"
  );
=======
    values: Record<string, Ixyz[]>,
    targetType: string
): void => {
    const filePath = path.join(SPAWN_DIR, `${targetType}.json`);

    updateJsonFile<Ixyz>(filePath, (jsonData) => {
        Object.keys(values).forEach((map) => {
            jsonData[map] = values[map];
        });
    }, `Overwrote all ${targetType} spawns`);
};
>>>>>>> Stashed changes
