import { IBotConfig } from "@spt/models/spt/config/IBotConfig.d";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig.d";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt/models/spt/logging/ILogger";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig.d";

import baseConfig from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";

import globalValues from "../GlobalValues";
import { cloneDeep, getRandomPresetOrCurrentlySelectedPreset, saveToFile } from "../utils";
import { originalMapList } from "./constants";

import updateSpawnLocations from "./updateSpawnLocations";
import { setEscapeTimeOverrides, enforceSmoothing } from "../utils";

import { buildBossWaves } from "./buildBossWaves";
import { buildZombieWaves } from "./buildZombieWaves";
import { buildScavMarksmanWaves } from "./buildScavMarksmanWaves";
import buildPmcs from "./buildPmcs";
import marksmanChanges from "./marksmanChanges";

export const buildWaves = (container: DependencyContainer): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const logger = container.resolve<ILogger>("WinstonLogger");
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
    const locationConfig = configServer.getConfig<ILocationConfig>(ConfigTypes.LOCATION);
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const { locations, bots } = databaseServer.getTables();

    // === Patch vanilla location behavior for safety ===
    locationConfig.rogueLighthouseSpawnTimeSettings.waitTimeSeconds = 60;
    locationConfig.enableBotTypeLimits = false;
    locationConfig.fitLootIntoContainerAttempts = 1;
    locationConfig.addCustomBotWavesToMaps = false;
    locationConfig.customWaves = { boss: {}, normal: {} };

    // === Resolve config base + overrides + preset ===
    const config = cloneDeep(globalValues.baseConfig);
    const preset = getRandomPresetOrCurrentlySelectedPreset();

    config.smoothingDistribution ??= 0.5;
    config.spawnMinDistance ??= 60;
    config.spawnMaxDistance ??= 200;

    for (const key of Object.keys(globalValues.overrideConfig)) {
        const newVal = globalValues.overrideConfig[key];
        if (config[key] !== newVal) {
            if (config.debug?.enabled) {
                console.log(`[MOAR] overrideConfig ${key} changed from ${config[key]} to ${newVal}`);
            }
            config[key] = newVal;
        }
    }

    for (const key of Object.keys(preset)) {
        const newVal = preset[key];
        if (config[key] !== newVal) {
            if (config.debug?.enabled) {
                console.log(`[MOAR] preset ${globalValues.currentPreset}: ${key} changed from ${config[key]} to ${newVal}`);
            }
            config[key] = newVal;
        }
    }

    // === Print applied preset for debugging ===
    console.log(globalValues.forcedPreset === "custom"
        ? "custom"
        : globalValues.forcedPreset || globalValues.currentPreset);

    // === Get location references from database ===
    const {
        bigmap: customs,
        factory4_day: factoryDay,
        factory4_night: factoryNight,
        interchange,
        laboratory,
        lighthouse,
        rezervbase,
        shoreline,
        tarkovstreets,
        woods,
        sandbox: gzLow,
        sandbox_high: gzHigh
    } = locations;

    let locationList = [
        customs, factoryDay, factoryNight,
        interchange, laboratory, lighthouse,
        rezervbase, shoreline, tarkovstreets,
        woods, gzLow, gzHigh
    ];

    // === Reset base locations to safe snapshot ===
    if (!globalValues.locationsBase) {
        globalValues.locationsBase = locationList.map(({ base }) => cloneDeep(base));
    } else {
        locationList = locationList.map((item, i) => ({
            ...item,
            base: cloneDeep(globalValues.locationsBase[i])
        }));
    }

    // === Disable PMC transform logic (forces consistent side types) ===
    pmcConfig.convertIntoPmcChance = {
        default: {
            assault: { min: 0, max: 0 },
            cursedassault: { min: 0, max: 0 },
            pmcbot: { min: 0, max: 0 },
            exusec: { min: 0, max: 0 },
            arenafighter: { min: 0, max: 0 },
            arenafighterevent: { min: 0, max: 0 },
            crazyassaultevent: { min: 0, max: 0 }
        },
        factory4_day: { assault: { min: 0, max: 0 } },
        laboratory: { pmcbot: { min: 0, max: 0 } },
        rezervbase: { pmcbot: { min: 0, max: 0 } }
    };

    // === Override edge cases ===
    if (config.startingPmcs && (!config.randomSpawns || config.spawnSmoothing)) {
        logger.warning("[MOAR] Starting PMCs is on. Disabling smoothing and enforcing cascade spawns.");
        config.spawnSmoothing = false;
        config.randomSpawns = true;
    }

    if (advancedConfig.MarksmanDifficultyChanges) {
        marksmanChanges(bots);
    }

    // === Apply spawn changes ===
    updateSpawnLocations(locationList, config);
    setEscapeTimeOverrides(locationList, mapConfig, logger, config);

    // === Build all bot types ===
    buildBossWaves(config, locationList);

    if (config.zombiesEnabled) {
        buildZombieWaves(config, locationList, bots);
    }

    buildPmcs(config, locationList);
    buildScavMarksmanWaves(config, locationList, botConfig);

    // === Optional smoothing pass ===
    if (config.spawnSmoothing) {
        enforceSmoothing(locationList, config, logger);
    }

    // === Write location updates back to the server ===
    originalMapList.forEach((name, index) => {
        if (!locations[name]) {
            console.warn(`[MOAR] Missing map entry for: ${name}`);
        } else {
            locations[name] = locationList[index];
        }
    });
};
