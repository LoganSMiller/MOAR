import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";

import baseConfig from "../../config/config.json";
import presets from "../../config/Presets.json";
import presetWeightings from "../../config/PresetWeightings.json";

const STRICT_MODE = true;

type ConfigShape = typeof baseConfig;
type PresetShape = Record<string, Partial<ConfigShape> & Record<string, unknown>>;
type WeightingsShape = Record<string, number>;

export default function checkPresetLogic(container: DependencyContainer): void {
    const logger = container.resolve<ILogger>("WinstonLogger");

    logger.info("[MOAR]: 🔍 Validating preset config integrity...");

    const allowedPresetMetadata = new Set(["label", "description", "enabled"]);
    const baseKeys = new Set(Object.keys(baseConfig));
    let hasIssues = false;

    // Step 1: Validate all entries in PresetWeightings exist in Presets
    for (const name of Object.keys(presetWeightings as WeightingsShape)) {
        if (!(name in presets)) {
            logger.error(`[MOAR]: ❌ Preset "${name}" exists in PresetWeightings.json but is missing in Presets.json`);
            hasIssues = true;
        }
    }

    // Step 2: Validate all keys inside Presets are valid config keys or allowed metadata
    for (const [presetName, presetValues] of Object.entries(presets as PresetShape)) {
        if (!presetValues || typeof presetValues !== "object") {
            logger.error(`[MOAR]: ❌ Preset "${presetName}" must be a valid object.`);
            hasIssues = true;
            continue;
        }

        for (const key of Object.keys(presetValues)) {
            if (allowedPresetMetadata.has(key)) continue;
            if (!baseKeys.has(key)) {
                logger.error(`[MOAR]: ❌ Preset "${presetName}" contains invalid key "${key}" (not in config.json)`);
                hasIssues = true;
            }
        }
    }

    // Step 3: Warn if any preset is unused (not listed in PresetWeightings)
    for (const name of Object.keys(presets)) {
        if (!(name in presetWeightings)) {
            logger.warning(`[MOAR]: ⚠️ Preset "${name}" exists in Presets.json but is unused in PresetWeightings.json`);
        }
    }

    // Step 4: Log all usable presets
    const usablePresets = Object.entries(presetWeightings)
        .filter(([name]) => name in presets)
        .map(([name, weight]) => `${name} (${weight})`);

    logger.info(`[MOAR]: 🎯 Usable presets: ${usablePresets.join(", ")}`);

    // Final step
    if (hasIssues) {
        logger.warning("[MOAR]: ⚠️ Preset validation completed with issues.");
        if (STRICT_MODE) {
            throw new Error("[MOAR]: Startup aborted — preset validation failed.");
        }
    } else {
        logger.info("[MOAR]: ✅ Preset validation passed with no errors.");
    }
}
