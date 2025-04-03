import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";
import config from "../../config/config.json";
import presets from "../../config/Presets.json";
import presetWeightings from "../../config/PresetWeightings.json";

/**
 * Checks the integrity of PresetWeightings.json and Presets.json
 * against config.json, logging issues to the server console.
 */
export default function checkPresetLogic(container: DependencyContainer): void {
    const logger = container.resolve<ILogger>("WinstonLogger");

    logger.info(`[MOAR]: Validating preset config integrity...`);

    // Check for missing presets referenced in weighting file
    for (const presetName of Object.keys(presetWeightings)) {
        if (!(presetName in presets)) {
            logger.error(
                `[MOAR]: Missing preset "${presetName}" in Presets.json (referenced in PresetWeightings.json)`
            );
        }
    }

    // Fields that are allowed in presets but not expected in config
    const ignoredKeys = ["label", "description", "enabled"];

    // Check each preset's keys exist in config.json (excluding known metadata)
    for (const [presetName, presetSettings] of Object.entries(presets)) {
        if (!presetSettings || typeof presetSettings !== "object") {
            logger.error(`[MOAR]: Preset "${presetName}" is malformed.`);
            continue;
        }

        for (const settingKey of Object.keys(presetSettings)) {
            if (ignoredKeys.includes(settingKey)) {
                continue;
            }

            if (!(settingKey in config)) {
                logger.error(
                    `[MOAR]: Key "${settingKey}" in preset "${presetName}" does not exist in config.json`
                );
            }
        }
    }

    logger.info(`[MOAR]: Preset validation complete.`);
}
