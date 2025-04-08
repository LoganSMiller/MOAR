import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";
import baseConfig from "../../config/config.json";
import presets from "../../config/Presets.json";
import presetWeightings from "../../config/PresetWeightings.json";

const STRICT_MODE = true; // 🧨 Set true to abort startup on validation errors

/**
 * Validates MOAR's preset system:
 * - Every preset in PresetWeightings.json exists in Presets.json
 * - Every preset key maps to a valid config field or known metadata
 * - Warns for presets that are unused / unreferenced
 * - Logs all usable presets + weights
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

    // === Step 3: Detect unused presets (defined but not weighted) ===
    for (const name of Object.keys(presets)) {
        if (!(name in presetWeightings)) {
            logger.warn(`[MOAR]: ⚠️ Preset "${name}" is defined in Presets.json but never used in PresetWeightings.json`);
        }
    }

    // === Step 4: Print usable presets + weights for debug
    const usable = Object.entries(presetWeightings)
        .filter(([name]) => name in presets)
        .map(([name, weight]) => `${name} (${weight})`);

    logger.info(`[MOAR]: 🎯 Usable presets: ${usable.join(", ")}`);

    // === Final result
    if (hasIssues) {
        logger.warn("[MOAR]: ⚠️ Preset validation completed with issues. Review log above.");
        if (STRICT_MODE) {
            throw new Error("[MOAR]: Startup aborted — preset validation failed.");
        }
    } else {
        logger.info("[MOAR]: ✅ Preset validation passed with no errors.");
    }
}
