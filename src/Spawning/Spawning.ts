import { DependencyContainer } from "tsyringe";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ILogger } from "@spt/models/spt/logging/ILogger";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig";

import globalValues from "../GlobalValues";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";

import updateSpawnLocations from "./updateSpawnLocations";
import { buildBossWaves } from "./buildBossWaves";
import { buildZombieWaves } from "./buildZombieWaves";
import buildPmcs from "./buildPmcs";
import { buildScavMarksmanWaves } from "./buildScavMarksmanWaves";
import marksmanChanges from "./marksmanChanges";

import {
    originalMapList,
} from "./constants";

import {
    cloneDeep,
    enforceSmoothing,
    getRandomPresetOrCurrentlySelectedPreset,
    setEscapeTimeOverrides,
} from "../utils";

/**
 * Entry point for MOAR wave generation. Applies config, resolves preset,
 * assigns spawns, and populates each map's BossLocationSpawn with valid bot waves.
 */
export const buildWaves = (container: DependencyContainer): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const logger = container.resolve<ILogger>("WinstonLogger");
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");

    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
    const locationConfig = configServer.getConfig<ILocationConfig>(ConfigTypes.LOCATION);
    const { locations, bots } = databaseServer.getTables();

    // === Reset SPT spawn modifiers ===
    locationConfig.rogueLighthouseSpawnTimeSettings.waitTimeSeconds = 60;
    locationConfig.enableBotTypeLimits = false;
    locationConfig.fitLootIntoContainerAttempts = 1;
    locationConfig.addCustomBotWavesToMaps = false;
    locationConfig.customWaves = { boss: {}, normal: {} };

    // === Load config with active preset ===
    const config = cloneDeep(globalValues.baseConfig);
    const preset = getRandomPresetOrCurrentlySelectedPreset();
    Object.assign(config, globalValues.overrideConfig, preset);

    // === Set resolved preset name
    const presetName = globalValues.forcedPreset || globalValues.currentPreset || config.defaultPreset || "live-like";
    globalValues.currentPreset = presetName;
    logger.info(`[MOAR] Using preset: '${presetName}'`);

    // === Fetch map locations from DB ===
    const locationList = originalMapList.map((map) => {
        const loc = locations[map];
        if (!loc || !loc.base) {
            logger.warning(`[MOAR] Missing or empty location base for ${map}, using fallback.`);
            return { base: {} };
        }
        return loc;
    });

    // === Snapshot management ===
    if (!globalValues.locationsBase || globalValues.locationsBase.length !== locationList.length) {
        globalValues.locationsBase = locationList.map(loc => cloneDeep(loc.base));
        logger.info("[MOAR] Created new locationsBase snapshot.");
    } else {
        for (let i = 0; i < locationList.length; i++) {
            locationList[i].base = cloneDeep(globalValues.locationsBase[i]);
        }
    }

    // === Disable PMC transformations to avoid SPT conversions
    pmcConfig.convertIntoPmcChance = {
        default: {
            assault: { min: 0, max: 0 },
            cursedassault: { min: 0, max: 0 },
            pmcbot: { min: 0, max: 0 },
            exusec: { min: 0, max: 0 },
            arenafighter: { min: 0, max: 0 },
            arenafighterevent: { min: 0, max: 0 },
            crazyassaultevent: { min: 0, max: 0 }
        }
    };

    // === Adjustments for presets with starting PMCs
    if (config.startingPmcs && (!config.randomSpawns || config.spawnSmoothing)) {
        logger.warning("[MOAR] Starting PMCs is on. Disabling smoothing and enforcing cascade spawns.");
        config.spawnSmoothing = false;
        config.randomSpawns = true;
    }

    // === Apply difficulty rebalancing if enabled
    if (advancedConfig.MarksmanDifficultyChanges) {
        marksmanChanges(bots);
    }

    // === Core logic: assign spawn points and escape timers
    updateSpawnLocations(locationList, config);
    setEscapeTimeOverrides(locationList, mapConfig, logger, config);

    // === Build all supported wave types
    buildBossWaves(config, locationList);
    buildZombieWaves(config, locationList, bots);
    buildPmcs(config, locationList);
    buildScavMarksmanWaves(config, locationList, botConfig);

    if (config.spawnSmoothing) {
        enforceSmoothing(locationList, config, logger);
    }

    // === Final integrity validation per map
    for (let i = 0; i < locationList.length; i++) {
        const loc = locationList[i];
        const base = loc.base;

        if (!base || !Array.isArray(base.BossLocationSpawn)) {
            logger.warning(`[MOAR] ${originalMapList[i]} had empty BossLocationSpawn.`);
            continue;
        }

        const pmcCount = base.BossLocationSpawn.filter(spawn =>
            spawn.Sides?.includes("Usec") || spawn.Sides?.includes("Bear")
        ).length;

        if (!pmcCount && mapConfig[originalMapList[i]]?.allowPmcOnMap !== false) {
            logger.warning(`[MOAR] ⚠ PMC wave generation failed for ${originalMapList[i]}.`);
        }
    }

    // === Finalize DB overwrite
    for (let i = 0; i < originalMapList.length; i++) {
        locations[originalMapList[i]] = locationList[i];
    }

    logger.info(`[MOAR] ✅ Waves built successfully using preset '${presetName}'.`);
};
