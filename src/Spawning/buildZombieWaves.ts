import {ILocation} from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {configLocations, defaultEscapeTimes} from "./constants";
import {
    buildZombie,
    getHealthBodyPartsByPercentage,
    zombieTypes
} from "./utils";
import {IBots} from "@spt/models/spt/bots/IBots";

export default function buildZombieWaves(
    config: typeof _config,
    locationList: ILocation[],
    bots: IBots
) {
    const {debug, zombieWaveDistribution, zombieWaveQuantity, zombieHealth} =
        config;

    const zombieBodyParts = getHealthBodyPartsByPercentage(zombieHealth);
    zombieTypes.forEach((type) => {
        bots.types?.[type]?.health?.BodyParts?.forEach((_, index) => {
            bots.types[type].health.BodyParts[index] = zombieBodyParts;
        });
    });

    for (let index = 0; index < locationList.length; index++) {
        const location = locationList[index].base;
        const mapSettingsList = Object.keys(mapConfig) as Array<keyof typeof mapConfig>;
        const map = mapSettingsList[index];

        // eslint-disable-next-line no-unsafe-optional-chaining
        const {zombieWaveCount} = mapConfig?.[configLocations[index]];

        // if (location.Events?.Halloween2024?.MaxCrowdAttackSpawnLimit)
        //   location.Events.Halloween2024.MaxCrowdAttackSpawnLimit = 100;
        // if (location.Events?.Halloween2024?.CrowdCooldownPerPlayerSec)
        //   location.Events.Halloween2024.CrowdCooldownPerPlayerSec = 60;
        // if (location.Events?.Halloween2024?.CrowdCooldownPerPlayerSec)
        //   location.Events.Halloween2024.CrowdsLimit = 10;
        // if (location.Events?.Halloween2024?.CrowdAttackSpawnParams)
        //   location.Events.Halloween2024.CrowdAttackSpawnParams = [];

        if (!zombieWaveCount) return;

        const escapeTimeLimitRatio = Math.round(
            locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
        );

        const zombieTotalWaveCount = Math.round(
            zombieWaveCount * zombieWaveQuantity * escapeTimeLimitRatio
        );

        config.debug &&
        escapeTimeLimitRatio !== 1 &&
        console.log(
            `${map} Zombie wave count changed from ${zombieWaveCount} to ${zombieTotalWaveCount} due to escapeTimeLimit adjustment`
        );

        const zombieWaves = buildZombie(
            zombieTotalWaveCount,
            location.EscapeTimeLimit * 60,
            zombieWaveDistribution,
            9999
        );

        debug &&
        console.log(
            configLocations[index],
            " generated ",
            zombieWaves.length,
            "Zombies"
        );

        location.BossLocationSpawn.push(...zombieWaves);

        // console.log(zombieWaves[0], zombieWaves[7]);
    }
}
