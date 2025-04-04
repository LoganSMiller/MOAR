/**
 * Packet used to synchronize the selected preset from server to client via FIKA.
 */
export class PresetSyncPacket {
    /** Internal name of the preset (e.g., "live-like", "chaos-mode"). */
    public readonly PresetName: string;

    /** Human-readable label of the preset (e.g., "Live-Like", "Chaos Mode"). */
    public readonly PresetLabel: string;

    /**
     * Constructs a PresetSyncPacket.
     * @param presetName - Internal preset name (slug)
     * @param presetLabel - User-facing label for the preset
     */
    constructor(presetName: string, presetLabel: string) {
        this.PresetName = presetName.trim().toLowerCase() || "unknown";
        this.PresetLabel = presetLabel.trim() || "Unknown";
    }

    /**
     * Serializes the packet into a plain object for network transmission.
     */
    public toJSON(): Record<string, string> {
        return {
            PresetName: this.PresetName,
            PresetLabel: this.PresetLabel
        };
    }

    /**
     * Reconstructs a PresetSyncPacket from a plain object.
     * @param data - Partial data object (e.g., parsed JSON)
     */
    public static fromJSON(data: Partial<PresetSyncPacket>): PresetSyncPacket {
        const name = typeof data?.PresetName === "string" ? data.PresetName : "unknown";
        const label = typeof data?.PresetLabel === "string" ? data.PresetLabel : "Unknown";
        return new PresetSyncPacket(name, label);
    }
}
