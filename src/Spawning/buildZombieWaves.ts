import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBotType } from "@spt/models/spt/bots/IBotType";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { MOARConfig, HealthPart } from "../types";
import { buildZombie } from "../spawnUtils";
import { defaultEscapeTimes } from "./constants";
import globalValues from "../GlobalValues";

/** Runtime guard to ensure an object is a valid HealthPart */
function isHealthPart(obj: unknown): obj is HealthPart {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "Current" in obj &&
        "Maximum" in obj &&
        typeof (obj as any).Current === "number" &&
        typeof (obj as any).Maximum === "number"
    );
}

/**
 * Injects zombie waves into maps with optional per-map health scaling.
 */
export function buildZombieWaves(
    config: MOARConfig,
    locationList: ILocation[],
    bots: Record<string, IBotType>
): void {
    for (let i = 0; i < locationList.length; i++) {
        const location = locationList[i];
        const base = location?.base;

        if (!base) {
            console.warn(`[MOAR] [Zombies] Skipping map index ${i} — base missing.`);
            continue;
        }

        const mapId = base.Id ?? `map_${i}`;
        const escapeMin = Number.isFinite(base.EscapeTimeLimit) ? base.EscapeTimeLimit : defaultEscapeTimes[mapId] ?? 45;
        const timeLimit = escapeMin * 60;
        const waveCount = Math.max(1, Math.round(config.zombieWaveQuantity));

        const newWaves = buildZombie(waveCount, timeLimit);
        const existing = base.BossLocationSpawn ?? [];

        const seen = new Set<string>();
        const merged = [...existing, ...newWaves].filter((wave): wave is IBossLocationSpawn => {
            const time = Number.isFinite(wave.Time) ? wave.Time : 0;
            wave.Time = time;

            const key = `${wave.BossName}-${wave.BossZone}-${time}`;
            if (seen.has(key)) return false;

            seen.add(key);
            wave.BossChance = Math.max(1, Math.min(100, wave.BossChance ?? 100));
            return true;
        });

        base.BossLocationSpawn = merged;

        if (config.debug?.enabled) {
            console.log(`[MOAR] [Zombies] ${mapId}: Injected ${newWaves.length} waves → Total: ${merged.length}`);
        }

        // === Zombie health scaling
        const scalePct = config.zombieHealth;
        if (typeof scalePct === "number" && scalePct > 0 && scalePct !== 100) {
            const zombieBot = bots["cursedAssault"];
            const bodyParts = zombieBot?.health?.BodyParts;

            if (bodyParts && typeof bodyParts === "object") {
                const scale = scalePct / 100;

                for (const part of Object.values(bodyParts)) {
                    if (isHealthPart(part)) {
                        const scaled = Math.floor(part.Maximum * scale);
                        part.Maximum = scaled;
                        part.Current = scaled;
                    }
                }

                if (config.debug?.enabled) {
                    console.log(`[MOAR] [Zombies] ${mapId}: Scaled health to ${scalePct}%`);
                }
            }
        }
    }
}
