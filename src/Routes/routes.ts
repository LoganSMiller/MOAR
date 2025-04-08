import { DependencyContainer } from "tsyringe";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { DynamicRouterModService } from "../Services/DynamicRouterModService";

import { buildWaves } from "../Spawning/Spawning";
import { deleteBotSpawn, updateBotSpawn } from "../SpawnZoneChanges/updateUtils";
import globalValues from "../GlobalValues";
import { kebabToTitle } from "../utils";

import PresetWeightingsConfig from "../../config/PresetWeightings.json";
import { Ixyz } from "../Models/Ixyz";

interface AddSpawnRequest {
    map: string;
    position: Ixyz;
    type: "player" | "pmc" | "scav" | "sniper";
}

interface SetPresetRequest {
    Preset: string;
}

function getSafeConfig(config: Record<string, any>): Record<string, any> {
    const clone = { ...config };

    if (typeof clone.debug === "object") {
        clone.debug = !!clone.debug.enabled;
    }

    return JSON.parse(JSON.stringify(clone, (key, value) => {
        if (typeof value === "function") return undefined;
        if (typeof value === "object" && value !== null) {
            try {
                JSON.stringify(value);
            } catch {
                return undefined;
            }
        }
        return value;
    }));
}

export const setupRoutes = (container: DependencyContainer): void => {
    const staticRouter = container.resolve<StaticRouterModService>("StaticRouterModService");
    const dynamicRouter = new DynamicRouterModService(container);

    const register = staticRouter.registerStaticRouter.bind(staticRouter);

    // === Config endpoints ===
    register("getDefaultConfig", [{
        url: "/moar/getDefaultConfig",
        action: async () => JSON.stringify(getSafeConfig(globalValues.baseConfig))
    }]);

    register("getServerConfigWithOverrides", [{
        url: "/moar/getServerConfigWithOverrides",
        action: async () => JSON.stringify(getSafeConfig({
            ...globalValues.baseConfig,
            ...globalValues.overrideConfig
        }))
    }]);

    register("moarGetServerConfig", [{
        url: "/moar/getServerConfig",
        action: async () => JSON.stringify(getSafeConfig(globalValues.baseConfig))
    }]);

    // === Preset selection ===
    register("moarSetPreset", [{
        url: "/moar/setPreset",
        action: async (_url, body: SetPresetRequest) => {
            const name = body?.Preset?.toLowerCase?.();
            const isValid = name && name in PresetWeightingsConfig;

            globalValues.forcedPreset = isValid ? name : "random";


            buildWaves(container);

            return `Current Preset: ${kebabToTitle(globalValues.forcedPreset || "Random")}`;
        }
    }]);

    register("moarGetPresetsList", [{
        url: "/moar/getPresets",
        action: async () => JSON.stringify({
            data: [
                ...Object.keys(PresetWeightingsConfig).map(p => ({
                    Name: kebabToTitle(p),
                    Label: p
                })),
                { Name: "Random", Label: "random" },
                { Name: "Custom", Label: "custom" }
            ]
        })
    }]);

    register("moarGetCurrentPreset", [{
        url: "/moar/currentPreset",
        action: async () => JSON.stringify(globalValues.forcedPreset || "random")
    }]);

    register("moarGetAnnouncePreset", [{
        url: "/moar/announcePreset",
        action: async () => {
            const forced = globalValues.forcedPreset?.toLowerCase();
            const announce = (!forced || forced === "random")
                ? globalValues.currentPreset
                : globalValues.forcedPreset;
            return JSON.stringify(announce);
        }
    }]);

    // === Manual config override injection ===
    register("setOverrideConfig", [{
        url: "/moar/setOverrideConfig",
        action: async (_url, overrideConfig: Record<string, unknown>) => {
            try {
                globalValues.overrideConfig = overrideConfig || {};
                buildWaves(container);
                return "Success";
            } catch (e) {
                console.error("[MOAR] Failed to apply override config:", e);
                return "Failed to apply override config.";
            }
        }
    }]);

    // === Custom spawn injection ===
    register("moarAddBotSpawn", [{
        url: "/moar/addBotSpawn",
        action: async (_url, req: AddSpawnRequest) => {
            updateBotSpawn(req.map, req.position, req.type);
            return "success";
        }
    }]);

    register("moarDeleteBotSpawn", [{
        url: "/moar/deleteBotSpawn",
        action: async (_url, req: AddSpawnRequest) => {
            deleteBotSpawn(req.map, req.position, req.type);
            return "success";
        }
    }]);

    // === Server rebuild triggers ===
    register("moarReloadConfig", [{
        url: "/moar/reloadConfig",
        action: async () => {
            globalValues.reloadConfig?.();
            buildWaves(container);
            return "Config reloaded and wave logic rebuilt.";
        }
    }]);

    register("moarRaidStartUpdater", [{
        url: "/client/raid/configuration",
        action: async (_url, _info, _sessionId, output) => {
            buildWaves(container);
            return output;
        }
    }]);

    register("moarUpdater", [{
        url: "/client/match/local/end",
        action: async (_url, _info, _sessionId, output) => {
            buildWaves(container);
            return output;
        }
    }]);

    // === Dynamic fallback route ===
    dynamicRouter.registerDynamicRouter("moarBuildWavesDynamic", [{
        route: "moar/buildWaves",
        action: async (_url, _info, _sessionId, output) => {
            buildWaves(container);
            return output;
        }
    }], "moar");

    console.log("[MOAR] ✅ All server routes registered");
};
