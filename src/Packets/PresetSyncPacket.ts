/**
 * Packet used to synchronize the selected preset from server to client via FIKA.
 */
export class PresetSyncPacket {
    /** Internal name of the preset (e.g., "live-like", "chaos-mode"). */
    PresetName: string;

    /** Human-readable label of the preset (e.g., "Live-Like", "Chaos Mode"). */
    PresetLabel: string;

    /**
     * Constructs a PresetSyncPacket.
     * @param presetName - Internal preset name
     * @param presetLabel - Human-readable label
     */
    constructor(presetName: string, presetLabel: string) {
        this.PresetName = presetName;
        this.PresetLabel = presetLabel;
    }

    /**
     * Serializes the packet to JSON for sending over network or storage.
     */
    toJSON(): Record<string, string> {
        return {
            PresetName: this.PresetName,
            PresetLabel: this.PresetLabel
        };
    }

    /**
     * Constructs a PresetSyncPacket from plain object (e.g., parsed JSON).
     * @param data - Object containing PresetName and PresetLabel
     */
    static fromJSON(data: Partial<PresetSyncPacket>): PresetSyncPacket {
        return new PresetSyncPacket(
            data.PresetName ?? "unknown",
            data.PresetLabel ?? "Unknown"
        );
    }
}
