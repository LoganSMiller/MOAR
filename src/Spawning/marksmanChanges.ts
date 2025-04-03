import { IDifficultyCategories } from "@spt/models/eft/common/tables/IBotType";
import { IBots } from "@spt/models/spt/bots/IBots";
// import { saveToFile } from "../utils"; // Enable for JSON dump

/**
 * Applies difficulty tuning to the "marksman" bot role.
 * Enhances their vision cone, hearing sensitivity, and threat response.
 *
 * @param bots - Complete bot configuration reference
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

        // === Vision / Scattering / Line of Sight Awareness ===
        difficulty.Core = {
            ...difficulty.Core,
            VisibleAngle: 300,               // Widen FOV
            VisibleDistance: 245,            // Increase sight range
            ScatteringPerMeter: 0.1,         // Lower accuracy spread
            HearingSense: 2.85               // General auditory sensitivity
        };

        // === Aggression / Threat Response ===
        difficulty.Mind = {
            ...difficulty.Mind,
            BULLET_FEEL_DIST: 360,           // Max bullet perception
            CHANCE_FUCK_YOU_ON_CONTACT_100: 10 // Slight aggression boost
        };

        // === Hearing Profile ===
        difficulty.Hearing = {
            ...difficulty.Hearing,
            CHANCE_TO_HEAR_SIMPLE_SOUND_0_1: 0.7,
            DISPERSION_COEF: 3.6,            // Improves sound triangulation
            CLOSE_DIST: 10,
            FAR_DIST: 30
        };
    }

    // === Enable to output full difficulty JSON to disk ===
    // const DEBUG = true;
    // if (DEBUG) {
    //     saveToFile("marksmanDifficulty", marksman.difficulty);
    // }
}
