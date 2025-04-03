import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";

import fs from "fs";
import path from "path";

import globalValues from "./GlobalValues";
import { setupRoutes } from "./Routes/routes";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { buildWaves } from "./Spawning/Spawning";
import checkPresetLogic from "./Tests/checkPresets";

// Config path constant
const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");

// Defensive config loader
function loadConfig(): Record<string, unknown> {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error("[MOAR]  Config file does not exist at:", CONFIG_PATH);
        return {};
    }

    try {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        return JSON.parse(raw);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[MOAR]  Failed to parse config.json in mod.ts:", message);
        return {};
    }
}

const config = loadConfig();
const enableBotSpawning = config["enableBotSpawning"] === true;

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
    preSptLoad(container: DependencyContainer): void {
        if (enableBotSpawning) {
            setupRoutes(container);
        }
    }

    postDBLoad(container: DependencyContainer): void {
        if (enableBotSpawning) {
            setupSpawns(container);
        }
    }

    postSptLoad(container: DependencyContainer): void {
        if (!enableBotSpawning) {
            return;
        }

        const logger = container.resolve<ILogger>("WinstonLogger");

        globalValues.baseConfig = config;
        globalValues.overrideConfig = {};

        try {
            checkPresetLogic(container);
        } catch (err) {
            logger.warning("[MOAR]  Preset validation skipped due to format changes or load error.");
        }

        setTimeout(() => {
            const spawnsReady =
                globalValues.indexedMapSpawns &&
                Object.keys(globalValues.indexedMapSpawns).length > 0;

            if (!spawnsReady) {
                logger.error("[MOAR]  Cannot build waves — indexedMapSpawns is not ready.");
                return;
            }

            try {
                buildWaves(container);
                const presetName = globalValues.forcedPreset || "random";
                logger.info(`[MOAR]  Waves built successfully using preset '${presetName}'.`);
            } catch (e: unknown) {
                const message =
                    e && typeof e === "object" && "stack" in e
                        ? (e as Error).stack
                        : JSON.stringify(e, null, 2);
                logger.error("[MOAR]  Error while building waves:\n" + message);
            }
        }, 100);

        logger.info("[MOAR]  Startup initialized. Bot spawning is enabled.");
    }
}

module.exports = { mod: new Moar() };
