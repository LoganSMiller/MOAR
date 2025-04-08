import fs from "fs";
import path from "path";
import { DependencyContainer } from "tsyringe";

import { ISeasonalEvent, ISeasonalEventConfig } from "@spt/models/spt/config/ISeasonalEventConfig.d";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { SeasonalEventService } from "@spt/services/SeasonalEventService";

/**
 * Generate a full seasonal zombie event configuration object
 */
export const baseZombieSettings = (enabled: boolean, count: number): ISeasonalEvent => ({
    enabled,
    name: "zombies",
    type: "Zombies",
    startDay: "1",
    startMonth: "1",
    endDay: "31",
    endMonth: "12",
    settings: {
        enableSummoning: false,
        removeEntryRequirement: [],
        replaceBotHostility: true,
        zombieSettings: {
            enabled: true,
            mapInfectionAmount: Object.fromEntries(
                [
                    "Interchange", "Lighthouse", "RezervBase", "Sandbox", "Shoreline",
                    "TarkovStreets", "Woods", "bigmap", "factory4", "laboratory"
                ].map((map) => [map, count === -1 ? randomNumber100() : count])
            ),
            disableBosses: [],
            disableWaves: []
        }
    }
});

/**
 * Random number generator helper (0-100)
 */
const randomNumber100 = (): number => Math.round(Math.random() * 100);

/**
 * Reset current seasonal event configuration and apply zombie mode
 */
export const resetCurrentEvents = (
    container: DependencyContainer,
    enabled: boolean,
    zombieWaveQuantity: number,
    random = false
): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const seasonalConfig = configServer.getConfig<ISeasonalEventConfig>(ConfigTypes.SEASONAL_EVENT);

    const percent = random ? -1 : Math.min(100, Math.round(zombieWaveQuantity * 100));
    seasonalConfig.events = [baseZombieSettings(enabled, percent)];

    const seasonalEventService = container.resolve<SeasonalEventService>("SeasonalEventService") as any;
    seasonalEventService.currentlyActiveEvents = [];
    seasonalEventService.christmasEventActive = false;
    seasonalEventService.halloweenEventActive = false;
    seasonalEventService.cacheActiveEvents();
};

/**
 * Initialize the default zombie event configuration at server start
 */
export const setUpZombies = (container: DependencyContainer): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const seasonalConfig = configServer.getConfig<ISeasonalEventConfig>(ConfigTypes.SEASONAL_EVENT);

    const zombieEvent = baseZombieSettings(false, 100);
    seasonalConfig.events = [zombieEvent];

    // Prepare hostility fallback rules
    seasonalConfig.eventGear[zombieEvent.name] = {};
    const baseHostility = seasonalConfig.hostilitySettingsForEvent[zombieEvent.name];

    if (!baseHostility || !baseHostility.default) {
        console.warn("[MOAR] Zombie event hostility settings were missing or incomplete.");
        return;
    }

    baseHostility.default = baseHostility.default
        .filter(({ BotRole }) => !["pmcBear", "pmcUsec"].includes(BotRole))
        .map((host) => ({
            ...host,
            AlwaysEnemies: [
                "infectedAssault", "infectedPmc", "infectedCivil", "infectedLaborant", "infectedTagilla",
                "pmcBear", "pmcUsec"
            ],
            AlwaysNeutral: [
                "marksman", "assault", "bossTest", "bossBully", "followerTest", "bossKilla", "bossKojaniy",
                "followerKojaniy", "pmcBot", "cursedAssault", "bossGluhar", "followerGluharAssault",
                "followerGluharSecurity", "followerGluharScout", "followerGluharSnipe", "followerSanitar",
                "bossSanitar", "test", "assaultGroup", "sectantWarrior", "sectantPriest", "bossTagilla",
                "followerTagilla", "exUsec", "gifter", "bossKnight", "followerBigPipe", "followerBirdEye",
                "bossZryachiy", "followerZryachiy", "bossBoar", "followerBoar", "arenaFighter",
                "arenaFighterEvent", "bossBoarSniper", "crazyAssaultEvent", "peacefullZryachiyEvent",
                "sectactPriestEvent", "ravangeZryachiyEvent", "followerBoarClose1", "followerBoarClose2",
                "bossKolontay", "followerKolontayAssault", "followerKolontaySecurity", "shooterBTR",
                "bossPartisan", "spiritWinter", "spiritSpring", "peacemaker", "skier"
            ],
            SavagePlayerBehaviour: "Neutral",
            BearPlayerBehaviour: "AlwaysEnemies",
            UsecPlayerBehaviour: "AlwaysEnemies"
        }));
};
