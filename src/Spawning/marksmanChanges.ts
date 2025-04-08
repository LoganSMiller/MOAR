import { IDifficultyCategories } from "@spt/models/eft/common/tables/IBotType";
import { IBots } from "@spt/models/spt/bots/IBots";
// import { saveToFile } from "../utils"; // Optional debug export

/**
 * Applies difficulty tuning to the "marksman" bot role.
 * Enhances vision, hearing, and aggression to simulate deadly sniper behavior.
 *
 * @param bots - Full bot type reference from server
 */
export default function marksmanChanges(bots: IBots): void {
    const marksman = bots.types?.marksman;

    if (!marksman?.difficulty || typeof marksman.difficulty !== "object") {
        return;
    }

    for (const difficultyKey of Object.keys(marksman.difficulty)) {
        const difficulty = marksman.difficulty[difficultyKey] as IDifficultyCategories;

        if (!difficulty?.Core || !difficulty.Mind || !difficulty.Hearing) {
            continue;
        }

        // === Vision cone, accuracy, range ===
        difficulty.Core = {
            ...difficulty.Core,
            VisibleAngle: 300,              // Expanded field of view
            VisibleDistance: 245,           // Increased visual range
            ScatteringPerMeter: 0.1,        // Sharpshooter accuracy
            HearingSense: 2.85              // Sound awareness boost
        };

        // === Aggression and contact response ===
        difficulty.Mind = {
            ...difficulty.Mind,
            BULLET_FEEL_DIST: 360,          // Max bullet detection
            CHANCE_FUCK_YOU_ON_CONTACT_100: 10 // Small aggression boost
        };

        // === Hearing behavior for triangulation ===
        difficulty.Hearing = {
            ...difficulty.Hearing,
            CHANCE_TO_HEAR_SIMPLE_SOUND_0_1: 0.7,
            DISPERSION_COEF: 3.6,
            CLOSE_DIST: 10,
            FAR_DIST: 30
        };
    }

    // === Enable to dump tuned difficulty to disk ===
    // const DEBUG = true;
    // if (DEBUG) {
    //     saveToFile("marksmanDifficulty", marksman.difficulty);
    // }
}
