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
import { PresetSyncPacket } from "../Packets/PresetSyncPacket";

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

    try {
        const fikaServerPath = path.resolve(__dirname, "../../../fika-server/package.json");
        if (fs.existsSync(fikaServerPath)) {
            const fika = require(fikaServerPath);
            const fikaDllPath = path.join(process.cwd(), "BepInEx", "plugins", "Fika.Core.dll");
            const hasClientSideFika = fs.existsSync(fikaDllPath);

            console.log(hasClientSideFika
                ? "[MOAR] FIKA client DLL detected in BepInEx/plugins"
                : "[MOAR] FIKA client DLL not found in BepInEx/plugins");

            const CoopHandler = fika?.CoopHandler;
            const CoopPacketRouter = fika?.CoopPacketRouter;

            CoopHandler?.Instance?.Register?.<PresetSyncPacket>((packet: PresetSyncPacket) => {
                if (globalValues.forcedPreset === packet.PresetName) {
                    console.log("[MOAR] FIKA preset sync skipped — already current preset:", packet.PresetName);
                    return;
                }
                console.log("[MOAR] Received FIKA sync preset:", packet.PresetName);
                globalValues.forcedPreset = packet.PresetName;
                buildWaves(container);
            });

            CoopPacketRouter?.Handle?.("moar/syncPreset", (packet: PresetSyncPacket) => {
                console.log("[MOAR] Received CoopPacketRouter preset:", packet.PresetName);
                globalValues.forcedPreset = packet.PresetName;
                buildWaves(container);
            });

            console.log("[MOAR] FIKA server module detected and registered");
        } else {
            console.warn("[MOAR] FIKA server module not found at expected path");
        }
    } catch (e) {
        console.warn("[MOAR] FIKA server module failed to load. Falling back to non-Coop preset handling.");
    }

    staticRouter.registerStaticRouter("getDefaultConfig", [{
        url: "/moar/getDefaultConfig",
        action: async (): Promise<string> => {
            const safe = getSafeConfig(globalValues.baseConfig);
            return JSON.stringify(safe);
        }
    }], "getDefaultConfig");

    staticRouter.registerStaticRouter("getServerConfigWithOverrides", [{
        url: "/moar/getServerConfigWithOverrides",
        action: async (): Promise<string> => {
            const merged = {
                ...globalValues.baseConfig,
                ...globalValues.overrideConfig
            };
            const safe = getSafeConfig(merged);
            return JSON.stringify(safe);
        }
    }], "getServerConfigWithOverrides");

    staticRouter.registerStaticRouter("moarGetServerConfig", [{
        url: "/moar/getServerConfig",
        action: async (): Promise<string> => {
            const safe = getSafeConfig(globalValues.baseConfig);
            return JSON.stringify(safe);
        }
    }], "moarGetServerConfig");

    staticRouter.registerStaticRouter("moarSetPreset", [{
        url: "/moar/setPreset",
        action: async (_url: string, { Preset }: SetPresetRequest): Promise<string> => {
            globalValues.forcedPreset = Preset;
            buildWaves(container);
            return `Current Preset: ${kebabToTitle(globalValues.forcedPreset || "Random")}`;
        }
    }], "moarSetPreset");

    staticRouter.registerStaticRouter("setOverrideConfig", [{
        url: "/moar/setOverrideConfig",
        action: async (_url: string, overrideConfig: Record<string, unknown>): Promise<string> => {
            globalValues.overrideConfig = overrideConfig;
            buildWaves(container);
            return "Success";
        }
    }], "setOverrideConfig");

    staticRouter.registerStaticRouter("moarGetPresetsList", [{
        url: "/moar/getPresets",
        action: async (): Promise<string> => {
            const result = [
                ...Object.keys(PresetWeightingsConfig).map(preset => ({
                    Name: kebabToTitle(preset),
                    Label: preset
                })),
                { Name: "Random", Label: "random" },
                { Name: "Custom", Label: "custom" }
            ];
            return JSON.stringify({ data: result });
        }
    }], "moarGetPresetsList");

    staticRouter.registerStaticRouter("moarGetCurrentPreset", [{
        url: "/moar/currentPreset",
        action: async (): Promise<string> => JSON.stringify(globalValues.forcedPreset || "random")
    }], "moarGetCurrentPreset");

    staticRouter.registerStaticRouter("moarGetAnnouncePreset", [{
        url: "/moar/announcePreset",
        action: async (): Promise<string> => {
            const forced = globalValues.forcedPreset?.toLowerCase();
            const result = (forced === "random" || !forced)
                ? globalValues.currentPreset
                : globalValues.forcedPreset;
            return JSON.stringify(result);
        }
    }], "moarGetAnnouncePreset");

    staticRouter.registerStaticRouter("moarAddBotSpawn", [{
        url: "/moar/addBotSpawn",
        action: async (_url: string, req: AddSpawnRequest): Promise<string> => {
            updateBotSpawn(req.map, req.position, req.type);
            return "success";
        }
    }], "moarAddBotSpawn");

    staticRouter.registerStaticRouter("moarDeleteBotSpawn", [{
        url: "/moar/deleteBotSpawn",
        action: async (_url: string, req: AddSpawnRequest): Promise<string> => {
            deleteBotSpawn(req.map, req.position, req.type);
            return "success";
        }
    }], "moarDeleteBotSpawn");

    staticRouter.registerStaticRouter("moarReloadConfig", [{
        url: "/moar/reloadConfig",
        action: async (): Promise<string> => {
            globalValues.reloadConfig?.();
            buildWaves(container);
            return "Config reloaded and wave logic rebuilt.";
        }
    }], "moarReloadConfig");

    staticRouter.registerStaticRouter("moarRaidStartUpdater", [{
        url: "/client/raid/configuration",
        action: async (_url: string, _info: unknown, _sessionId: string, output: unknown): Promise<unknown> => {
            buildWaves(container);
            return output;
        }
    }], "moarRaidStartUpdater");

    staticRouter.registerStaticRouter("moarUpdater", [{
        url: "/client/match/local/end",
        action: async (_url: string, _info: unknown, _sessionId: string, output: unknown): Promise<unknown> => {
            buildWaves(container);
            return output;
        }
    }], "moarUpdater");

    dynamicRouter.registerDynamicRouter("moarFikaSync", [{
        route: "moar/syncPreset",
        action: async (_url: string, info: PresetSyncPacket): Promise<string> => {
            console.log("[MOAR] Dynamic route FIKA preset sync received:", info?.PresetName);
            globalValues.forcedPreset = info?.PresetName;
            buildWaves(container);
            return "OK";
        }
    }], "moar");

    dynamicRouter.registerDynamicRouter("moarBuildWavesDynamic", [{
        route: "moar/buildWaves",
        action: async (_url: string, _info: unknown, _sessionId: string, output: unknown): Promise<unknown> => {
            buildWaves(container);
            return output;
        }
    }], "moar");

    console.log("[MOAR] All server routes registered");
};
