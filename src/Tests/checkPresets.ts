import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";
import baseConfig from "../../config/config.json";
import presets from "../../config/Presets.json";
import presetWeightings from "../../config/PresetWeightings.json";

/**
 * Validates MOAR's preset system:
 * - Every preset in PresetWeightings.json exists in Presets.json
 * - Every preset key maps to a valid config field or is a known metadata field
 * 
 * Logs all validation issues clearly to the server console.
 */
export default function checkPresetLogic(container: DependencyContainer): void {
    const logger = container.resolve<ILogger>("WinstonLogger");

    logger.info("[MOAR]: 🔍 Validating preset config integrity...");

    const allowedPresetMetadata = new Set(["label", "description", "enabled"]);
    let hasIssues = false;

    // === Step 1: Ensure all weightings map to valid preset names ===
    for (const name of Object.keys(presetWeightings)) {
        if (!(name in presets)) {
            logger.error(`[MOAR]: ❌ Preset "${name}" is missing in Presets.json (but present in PresetWeightings.json)`);
            hasIssues = true;
        }
    }

    // === Step 2: Ensure all keys in Presets.json are valid config fields or known metadata ===
    for (const [presetName, presetValues] of Object.entries(presets)) {
        if (!presetValues || typeof presetValues !== "object") {
            logger.error(`[MOAR]: ❌ Preset "${presetName}" is not a valid object.`);
            hasIssues = true;
            continue;
        }

        for (const key of Object.keys(presetValues)) {
            if (allowedPresetMetadata.has(key)) continue;
            if (!(key in baseConfig)) {
                logger.error(`[MOAR]: ❌ Invalid key "${key}" in preset "${presetName}" — not found in config.json.`);
                hasIssues = true;
            }
        }
    }

    if (!hasIssues) {
        logger.info("[MOAR]: ✅ Preset validation passed with no errors.");
    } else {
        logger.warn("[MOAR]: ⚠️ Preset validation completed with issues. Review log above.");
    }
}
