import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";
import config from "../../config/config.json";
import presets from "../../config/Presets.json";
import presetWeightings from "../../config/PresetWeightings.json";

/**
 * Validates consistency between preset files:
 * - Ensures every preset in PresetWeightings.json exists in Presets.json
 * - Ensures every preset key is valid against config.json
 *
 * Logs validation issues to the server logger.
 */
export default function checkPresetLogic(container: DependencyContainer): void {
    const logger = container.resolve<ILogger>("WinstonLogger");

    logger.info("[MOAR]: 🔍 Validating preset config integrity...");

    // Preset metadata keys allowed to exist in presets but not in base config
    const allowedPresetMetadata = new Set(["label", "description", "enabled"]);

    // Track if any issues were found
    let hasIssues = false;

    //  1. Check: All presets in PresetWeightings exist in Presets.json
    for (const presetName of Object.keys(presetWeightings)) {
        if (!(presetName in presets)) {
            logger.error(`[MOAR]: ❌ Preset "${presetName}" missing in Presets.json (referenced in PresetWeightings.json)`);
            hasIssues = true;
        }
    }

    //  2. Check: All keys inside each preset are valid config fields (or metadata)
    for (const [presetName, presetData] of Object.entries(presets)) {
        if (!presetData || typeof presetData !== "object") {
            logger.error(`[MOAR]: ❌ Preset "${presetName}" is malformed or not an object.`);
            hasIssues = true;
            continue;
        }

        for (const key of Object.keys(presetData)) {
            if (allowedPresetMetadata.has(key)) continue;
            if (!(key in config)) {
                logger.error(`[MOAR]: ❌ Invalid key "${key}" in preset "${presetName}" (not found in config.json)`);
                hasIssues = true;
            }
        }
    }

    if (!hasIssues) {
        logger.info("[MOAR]: ✅ Preset validation passed with no errors.");
    } else {
        logger.warn("[MOAR]: ⚠️ Preset validation completed with issues. Check log above.");
    }
}
