import { DependencyContainer } from "tsyringe";
import { buildWaves } from "../Spawning/Spawning";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
<<<<<<< Updated upstream
// import { DynamicRouterModService } from "@spt/services/mod/dynamicRouter/DynamicRouterModService";
=======
import { DynamicRouterModService } from "@spt/services/mod/dynamicRouter/DynamicRouterModService";
import { CoopHandler, CoopPacketRouter } from "Fika.Core.Server";
>>>>>>> Stashed changes
import { globalValues } from "../GlobalValues";
import { kebabToTitle } from "../utils";
import PresetWeightingsConfig from "../../config/PresetWeightings.json";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import {
  deleteBotSpawn,
  updateBotSpawn,
} from "../SpawnZoneChanges/updateUtils";
import { PresetSyncPacket } from "../Fika/PresetSyncPacket";

export const setupRoutes = (container: DependencyContainer) => {
  const staticRouterModService = container.resolve<StaticRouterModService>(
    "StaticRouterModService"
  );

<<<<<<< Updated upstream
  interface AddSpawnRequest {
    map: string;
    position: Ixyz;
    type: "player" | "pmc" | "scav" | "sniper";
  }

  staticRouterModService.registerStaticRouter(
    `moarAddBotSpawn`,
    [
      {
        url: "/moar/addBotSpawn",
        action: async (
          url: string,
          req: AddSpawnRequest,
          sessionID,
          output
        ) => {
          updateBotSpawn(req.map, req.position, req.type);
          return "success";
        },
      },
    ],
    "moarAddBotSpawn"
  );

  staticRouterModService.registerStaticRouter(
    `moarDeleteBotSpawn`,
    [
      {
        url: "/moar/deleteBotSpawn",
        action: async (
          url: string,
          req: AddSpawnRequest,
          sessionID,
          output
        ) => {
          // console.log(req);
          deleteBotSpawn(req.map, req.position, req.type);
          return "success";
        },
      },
    ],
    "moarDeleteBotSpawn"
  );

  // Make buildwaves run on game end
  staticRouterModService.registerStaticRouter(
    `moarUpdater`,
    [
      {
        url: "/client/match/local/end",
        action: async (_url, info, sessionId, output) => {
          buildWaves(container);
          return output;
        },
      },
    ],
    "moarUpdater"
  );

  staticRouterModService.registerStaticRouter(
    `moarGetCurrentPreset`,
    [
      {
        url: "/moar/currentPreset",
        action: async () => {
          return globalValues.forcedPreset || "random";
        },
      },
    ],
    "moarGetCurrentPreset"
  );
=======
    const dynamicRouterModService = container.resolve<DynamicRouterModService>(
        "DynamicRouterModService"
    );

    CoopHandler.Instance.Register<PresetSyncPacket>((packet) => {
        if (!packet?.Preset) {
            console.warn("[MOAR:FIKA] Received malformed PresetSyncPacket");
            return;
        }
        globalValues.forcedPreset = packet.Preset;
        buildWaves(container);
    });

    CoopPacketRouter.Handle("moar/syncPreset", (packet: PresetSyncPacket) => {
        if (!packet?.Preset) {
            console.warn("[MOAR:FIKA] Received malformed preset packet via CoopPacketRouter");
            return;
        }
        globalValues.forcedPreset = packet.Preset;
        buildWaves(container);
    });

    interface AddSpawnRequest {
        map: string;
        position: Ixyz;
        type: "player" | "pmc" | "scav" | "sniper";
    }

    staticRouterModService.registerStaticRouter(
        `moarAddBotSpawn`,
        [
            {
                url: "/moar/addBotSpawn",
                action: async (_url, req: AddSpawnRequest) => {
                    updateBotSpawn(req.map, req.position, req.type);
                    return "success";
                },
            },
        ],
        "moarAddBotSpawn"
    );

    staticRouterModService.registerStaticRouter(
        `moarDeleteBotSpawn`,
        [
            {
                url: "/moar/deleteBotSpawn",
                action: async (_url, req: AddSpawnRequest) => {
                    deleteBotSpawn(req.map, req.position, req.type);
                    return "success";
                },
            },
        ],
        "moarDeleteBotSpawn"
    );

    staticRouterModService.registerStaticRouter(
        `moarUpdater`,
        [
            {
                url: "/client/match/local/end",
                action: async (_url, _info, _sessionId, output) => {
                    buildWaves(container);
                    return output;
                },
            },
        ],
        "moarUpdater"
    );

    staticRouterModService.registerStaticRouter(
        `moarRaidStartUpdater`,
        [
            {
                url: "/client/raid/configuration",
                action: async (_url, _info, _sessionId, output) => {
                    buildWaves(container);
                    return output;
                },
            },
        ],
        "moarRaidStartUpdater"
    );

    staticRouterModService.registerStaticRouter(
        `moarGetCurrentPreset`,
        [
            {
                url: "/moar/currentPreset",
                action: async () => {
                    return globalValues.forcedPreset || "random";
                },
            },
        ],
        "moarGetCurrentPreset"
    );
>>>>>>> Stashed changes

  staticRouterModService.registerStaticRouter(
    `moarGetAnnouncePreset`,
    [
      {
        url: "/moar/announcePreset",
        action: async () => {
          if (globalValues.forcedPreset?.toLowerCase() === "random") {
            return globalValues.currentPreset;
          }
          return globalValues.forcedPreset || globalValues.currentPreset;
        },
      },
    ],
    "moarGetAnnouncePreset"
  );

  staticRouterModService.registerStaticRouter(
    `getDefaultConfig`,
    [
      {
        url: "/moar/getDefaultConfig",
        action: async () => {
          return JSON.stringify(globalValues.baseConfig);
        },
      },
    ],
    "getDefaultConfig"
  );

  staticRouterModService.registerStaticRouter(
    `getServerConfigWithOverrides`,
    [
      {
        url: "/moar/getServerConfigWithOverrides",
        action: async () => {
          return JSON.stringify({
            ...(globalValues.baseConfig || {}),
            ...(globalValues.overrideConfig || {}),
          });
        },
      },
    ],
    "getServerConfigWithOverrides"
  );

<<<<<<< Updated upstream
  staticRouterModService.registerStaticRouter(
    `getServerConfigWithOverrides`,
    [
      {
        url: "/moar/getServerConfigWithOverrides",
        action: async () => {
          return JSON.stringify({
            ...globalValues.baseConfig,
            ...globalValues.overrideConfig,
          });
        },
      },
    ],
    "getServerConfigWithOverrides"
  );

  staticRouterModService.registerStaticRouter(
    `moarGetPresetsList`,
    [
      {
        url: "/moar/getPresets",
        action: async () => {
          let result = [
            ...Object.keys(PresetWeightingsConfig).map((preset) => ({
              Name: kebabToTitle(preset),
              Label: preset,
            })),
            { Name: "Random", Label: "random" },
            { Name: "Custom", Label: "custom" },
          ];

          return JSON.stringify({ data: result });
        },
      },
    ],
    "moarGetPresetsList"
  );

  staticRouterModService.registerStaticRouter(
    "setOverrideConfig",
    [
      {
        url: "/moar/setOverrideConfig",
        action: async (
          url: string,
          overrideConfig: typeof globalValues.overrideConfig = {},
          sessionID,
          output
        ) => {
          globalValues.overrideConfig = overrideConfig;

          buildWaves(container);

          return "Success";
        },
      },
    ],
    "setOverrideConfig"
  );

  staticRouterModService.registerStaticRouter(
    "moarSetPreset",
    [
      {
        url: "/moar/setPreset",
        action: async (url: string, { Preset }, sessionID, output) => {
          globalValues.forcedPreset = Preset;
          buildWaves(container);

          return `Current Preset: ${kebabToTitle(
            globalValues.forcedPreset || "Random"
          )}`;
        },
      },
    ],
    "moarSetPreset"
  );
=======
    staticRouterModService.registerStaticRouter(
        `moarGetDebugState`,
        [
            {
                url: "/moar/debugState",
                action: async () => {
                    return JSON.stringify({
                        currentPreset: globalValues.currentPreset,
                        forcedPreset: globalValues.forcedPreset,
                        overrideConfig: globalValues.overrideConfig,
                        playerSpawn: globalValues.playerSpawn,
                        indexedMapSpawnsCount: globalValues.indexedMapSpawns?.length || 0
                    });
                },
            },
        ],
        "moarGetDebugState"
    );

    staticRouterModService.registerStaticRouter(
        `moarGetPresetsList`,
        [
            {
                url: "/moar/getPresets",
                action: async () => {
                    const result = [
                        ...Object.keys(PresetWeightingsConfig).map((preset) => ({
                            Name: kebabToTitle(preset),
                            Label: preset,
                        })),
                        { Name: "Random", Label: "random" },
                        { Name: "Custom", Label: "custom" },
                    ];

                    return JSON.stringify({ data: result });
                },
            },
        ],
        "moarGetPresetsList"
    );

    staticRouterModService.registerStaticRouter(
        "setOverrideConfig",
        [
            {
                url: "/moar/setOverrideConfig",
                action: async (_url, overrideConfig, _sessionID) => {
                    globalValues.overrideConfig = overrideConfig;
                    buildWaves(container);
                    return "Success";
                },
            },
        ],
        "setOverrideConfig"
    );

    staticRouterModService.registerStaticRouter(
        "moarSetPreset",
        [
            {
                url: "/moar/setPreset",
                action: async (_url, { Preset }) => {
                    globalValues.forcedPreset = Preset;
                    buildWaves(container);
                    return `Current Preset: ${kebabToTitle(
                        globalValues.forcedPreset || "Random"
                    )}`;
                },
            },
        ],
        "moarSetPreset"
    );

    dynamicRouterModService.registerDynamicRouter(
        "moarBuildWavesDynamic",
        {
            routes: [
                {
                    route: "moar/buildWaves",
                    action: async (_url, _info, _sessionId, output) => {
                        buildWaves(container);
                        return output;
                    },
                },
            ],
        }
    );

    console.log(`[MOAR] Using preset: ${globalValues.forcedPreset || globalValues.baseConfig?.defaultPreset}`);
>>>>>>> Stashed changes
};
