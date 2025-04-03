import { DependencyContainer } from "tsyringe";
import {
    ISeasonalEvent,
    ISeasonalEventConfig
} from "@spt/models/spt/config/ISeasonalEventConfig.d";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
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
            mapInfectionAmount: Object.fromEntries([
                "Interchange",
                "Lighthouse",
                "RezervBase",
                "Sandbox",
                "Shoreline",
                "TarkovStreets",
                "Woods",
                "bigmap",
                "factory4",
                "laboratory"
            ].map(map => [map, count === -1 ? randomNumber100() : count])),
            disableBosses: [],
            disableWaves: []
        }
    }
});

/**
 * Random number helper (0-100)
 */
const randomNumber100 = (): number => Math.round(Math.random() * 100);

/**
 * Reset active seasonal events with updated zombie config
 */
export const resetCurrentEvents = (
    container: DependencyContainer,
    enabled: boolean,
    zombieWaveQuantity: number,
    random: boolean = false
): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const eventConfig = configServer.getConfig<ISeasonalEventConfig>(ConfigTypes.SEASONAL_EVENT);
    const percent = random ? -1 : Math.min(100, Math.round(zombieWaveQuantity * 100));

    eventConfig.events = [baseZombieSettings(enabled, percent)];

    const seasonalEventService = container.resolve<SeasonalEventService>("SeasonalEventService") as any;

    seasonalEventService.currentlyActiveEvents = [];
    seasonalEventService.christmasEventActive = false;
    seasonalEventService.halloweenEventActive = false;

    seasonalEventService.cacheActiveEvents();
};

/**
 * Setup default zombie event config on server init
 */
export const setUpZombies = (container: DependencyContainer): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const eventConfig = configServer.getConfig<ISeasonalEventConfig>(ConfigTypes.SEASONAL_EVENT);

    eventConfig.events = [baseZombieSettings(false, 100)];

    const zombieEvent = eventConfig.events[0];
    eventConfig.eventGear[zombieEvent.name] = {};

    eventConfig.hostilitySettingsForEvent[zombieEvent.name].default = 
        eventConfig.hostilitySettingsForEvent[zombieEvent.name].default
            .filter(({ BotRole }) => !["pmcBEAR", "pmcUSEC"].includes(BotRole))
            .map((host) => ({
                ...host,
                AlwaysEnemies: [
                    "infectedAssault", "infectedPmc", "infectedCivil", "infectedLaborant", "infectedTagilla",
                    "pmcBEAR", "pmcUSEC"
                ],
                AlwaysNeutral: [
                    "marksman", "assault", "bossTest", "bossBully", "followerTest", "bossKilla",
                    "bossKojaniy", "followerKojaniy", "pmcBot", "cursedAssault", "bossGluhar",
                    "followerGluharAssault", "followerGluharSecurity", "followerGluharScout", "followerGluharSnipe",
                    "followerSanitar", "bossSanitar", "test", "assaultGroup", "sectantWarrior", "sectantPriest",
                    "bossTagilla", "followerTagilla", "exUsec", "gifter", "bossKnight", "followerBigPipe",
                    "followerBirdEye", "bossZryachiy", "followerZryachiy", "bossBoar", "followerBoar",
                    "arenaFighter", "arenaFighterEvent", "bossBoarSniper", "crazyAssaultEvent",
                    "peacefullZryachiyEvent", "sectactPriestEvent", "ravangeZryachiyEvent",
                    "followerBoarClose1", "followerBoarClose2", "bossKolontay", "followerKolontayAssault",
                    "followerKolontaySecurity", "shooterBTR", "bossPartisan", "spiritWinter", "spiritSpring",
                    "peacemaker", "skier"
                ],
                SavagePlayerBehaviour: "Neutral",
                BearPlayerBehaviour: "AlwaysEnemies",
                UsecPlayerBehaviour: "AlwaysEnemies"
            }));
};
