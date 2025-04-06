import path from "path";
import fs from "fs";
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

    register("getDefaultConfig", [{
        url: "/moar/getDefaultConfig",
        action: async (): Promise<string> => JSON.stringify(getSafeConfig(globalValues.baseConfig))
    }]);

    register("getServerConfigWithOverrides", [{
        url: "/moar/getServerConfigWithOverrides",
        action: async (): Promise<string> => JSON.stringify(getSafeConfig({
            ...globalValues.baseConfig,
            ...globalValues.overrideConfig
        }))
    }]);

    register("moarGetServerConfig", [{
        url: "/moar/getServerConfig",
        action: async (): Promise<string> => JSON.stringify(getSafeConfig(globalValues.baseConfig))
    }]);

    register("moarSetPreset", [{
        url: "/moar/setPreset",
        action: async (_url: string, { Preset }: SetPresetRequest): Promise<string> => {
            globalValues.forcedPreset = Preset;
            buildWaves(container);
            return `Current Preset: ${kebabToTitle(globalValues.forcedPreset || "Random")}`;
        }
    }]);

    register("setOverrideConfig", [{
        url: "/moar/setOverrideConfig",
        action: async (_url: string, overrideConfig: Record<string, unknown>): Promise<string> => {
            globalValues.overrideConfig = overrideConfig;
            buildWaves(container);
            return "Success";
        }
    }]);

    register("moarGetPresetsList", [{
        url: "/moar/getPresets",
        action: async (): Promise<string> => JSON.stringify({
            data: [
                ...Object.keys(PresetWeightingsConfig).map(preset => ({
                    Name: kebabToTitle(preset),
                    Label: preset
                })),
                { Name: "Random", Label: "random" },
                { Name: "Custom", Label: "custom" }
            ]
        })
    }]);

    register("moarGetCurrentPreset", [{
        url: "/moar/currentPreset",
        action: async (): Promise<string> => JSON.stringify(globalValues.forcedPreset || "random")
    }]);

    register("moarGetAnnouncePreset", [{
        url: "/moar/announcePreset",
        action: async (): Promise<string> => {
            const forced = globalValues.forcedPreset?.toLowerCase();
            const result = (forced === "random" || !forced)
                ? globalValues.currentPreset
                : globalValues.forcedPreset;
            return JSON.stringify(result);
        }
    }]);

    register("moarAddBotSpawn", [{
        url: "/moar/addBotSpawn",
        action: async (_url: string, req: AddSpawnRequest): Promise<string> => {
            updateBotSpawn(req.map, req.position, req.type);
            return "success";
        }
    }]);

    register("moarDeleteBotSpawn", [{
        url: "/moar/deleteBotSpawn",
        action: async (_url: string, req: AddSpawnRequest): Promise<string> => {
            deleteBotSpawn(req.map, req.position, req.type);
            return "success";
        }
    }]);

    register("moarReloadConfig", [{
        url: "/moar/reloadConfig",
        action: async (): Promise<string> => {
            globalValues.reloadConfig?.();
            buildWaves(container);
            return "Config reloaded and wave logic rebuilt.";
        }
    }]);

    register("moarRaidStartUpdater", [{
        url: "/client/raid/configuration",
        action: async (_url: string, _info: unknown, _sessionId: string, output: unknown): Promise<unknown> => {
            buildWaves(container);
            return output;
        }
    }]);

    register("moarUpdater", [{
        url: "/client/match/local/end",
        action: async (_url: string, _info: unknown, _sessionId: string, output: unknown): Promise<unknown> => {
            buildWaves(container);
            return output;
        }
    }]);

    dynamicRouter.registerDynamicRouter("moarBuildWavesDynamic", [{
        route: "moar/buildWaves",
        action: async (_url: string, _info: unknown, _sessionId: string, output: unknown): Promise<unknown> => {
            buildWaves(container);
            return output;
        }
    }], "moar");

    console.log("[MOAR] All server routes registered");
};