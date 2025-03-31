<<<<<<< Updated upstream
=======
// mod.ts
>>>>>>> Stashed changes
import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
<<<<<<< Updated upstream
import { enableBotSpawning } from "../config/config.json";
import { buildWaves } from "./Spawning/Spawning";
import config from "../config/config.json";
import { globalValues } from "./GlobalValues";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { setupRoutes } from "./Routes/routes";
import checkPresetLogic from "./Tests/checkPresets";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { saveToFile } from "./utils";

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
  preSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupRoutes(container);
=======
import { ILogger } from "@spt/models/spt/utils/ILogger";

import { enableBotSpawning } from "../config/config.json";
import config from "../config/config.json";

import { globalValues } from "./GlobalValues";
import { setupRoutes } from "./Routes/routes";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { buildWaves } from "./Spawning/Spawning";
import checkPresetLogic from "./Tests/checkPresets";

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
    /** Register HTTP routes before anything else */
    preSptLoad(container: DependencyContainer): void {
        if (enableBotSpawning) {
            setupRoutes(container);
        }
>>>>>>> Stashed changes
    }
  }

<<<<<<< Updated upstream
  postDBLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupSpawns(container);
=======
    /** Setup dynamic spawn zone changes after database loads */
    postDBLoad(container: DependencyContainer): void {
        if (enableBotSpawning) {
            setupSpawns(container);
        }
>>>>>>> Stashed changes
    }
  }

<<<<<<< Updated upstream
  postSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      checkPresetLogic(container);
      globalValues.baseConfig = config;
      globalValues.overrideConfig = {};
      const logger = container.resolve<ILogger>("WinstonLogger");
      logger.info(
        "\n[MOAR]: Starting up, may the bots ever be in your favour!"
      );
      buildWaves(container);
=======
    /** Final setup phase: logic checks, wave generation, and config loading */
    postSptLoad(container: DependencyContainer): void {
        if (!enableBotSpawning) {
            return;
        }

        // Load fallback config and set up global values
        globalValues.baseConfig = config;
        globalValues.overrideConfig = {};

        // Run server startup logic
        checkPresetLogic(container);

        // Build all initial waves based on config
        buildWaves(container);

        // Log startup success
        const logger = container.resolve<ILogger>("WinstonLogger");
        logger.info("\n[MOAR]: Starting up, may the bots ever be in your favour!");
>>>>>>> Stashed changes
    }
  }
}

module.exports = { mod: new Moar() };
