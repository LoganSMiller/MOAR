import { IDifficultyCategories } from "@spt/models/eft/common/tables/IBotType";
import { IBots } from "@spt/models/spt/bots/IBots";
<<<<<<< Updated upstream
import { saveToFile } from "../utils";

export default function marksmanChanges(bots: IBots) {
  // saveToFile(bots.types.marksman.difficulty, "marksmanDifficulty.json");
  for (const diff in bots.types.marksman.difficulty) {
    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Core = {
      ...bots.types.marksman.difficulty[diff].Core,
      VisibleAngle: 300,
      VisibleDistance: 245,
      ScatteringPerMeter: 0.1,
      HearingSense: 2.85,
    };

    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Mind = {
      ...bots.types.marksman.difficulty[diff].Mind,
      BULLET_FEEL_DIST: 360,
      CHANCE_FUCK_YOU_ON_CONTACT_100: 10,
    };

    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Hearing = {
      ...bots.types.marksman.difficulty[diff].Hearing,
      CHANCE_TO_HEAR_SIMPLE_SOUND_0_1: 0.7,
      DISPERSION_COEF: 3.6,
      CLOSE_DIST: 10,
      FAR_DIST: 30,
    };
  }
  // saveToFile(bots.types.marksman.difficulty, "marksmanDifficulty2.json");
=======

/**
 * Applies balance and behavioral changes to the "marksman" bot type.
 * Intended to make snipers more aware and aggressive while keeping difficulty balanced.
 *
 * @param bots - Bot configuration reference passed from the SPT mod server
 */
export default function marksmanChanges(bots: IBots): void {
    const marksman = bots.types.marksman;

    for (const difficultyKey in marksman.difficulty) {
        const difficulty = marksman.difficulty[difficultyKey] as IDifficultyCategories;

        // Adjust visibility and shooting accuracy
        difficulty.Core = {
            ...difficulty.Core,
            VisibleAngle: 300,
            VisibleDistance: 245,
            ScatteringPerMeter: 0.1,
            HearingSense: 2.85
        };

        // Modify aggression and response to bullets
        difficulty.Mind = {
            ...difficulty.Mind,
            BULLET_FEEL_DIST: 360,
            CHANCE_FUCK_YOU_ON_CONTACT_100: 10
        };

        // Improve hearing behavior
        difficulty.Hearing = {
            ...difficulty.Hearing,
            CHANCE_TO_HEAR_SIMPLE_SOUND_0_1: 0.7,
            DISPERSION_COEF: 3.6,
            CLOSE_DIST: 10,
            FAR_DIST: 30
        };
    }

    // Uncomment to save difficulty output for debug:
    // saveToFile(marksman.difficulty, "marksmanDifficulty.json");
>>>>>>> Stashed changes
}
