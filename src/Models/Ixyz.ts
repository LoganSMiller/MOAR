/**
 * Represents a 3D vector position (x, y, z) used for spawn-related data exchanges in MOAR.
 */
export class Ixyz {
    /** The X-axis coordinate. */
    x: number;

    /** The Y-axis coordinate. */
    y: number;

    /** The Z-axis coordinate. */
    z: number;

    /**
     * Default constructor sets (0, 0, 0)
     */
    constructor();

    /**
     * Constructs a new Ixyz with the given coordinates.
     * @param x - X-axis position
     * @param y - Y-axis position
     * @param z - Z-axis position
     */
    constructor(x: number, y: number, z: number);

    constructor(x?: number, y?: number, z?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }

    /**
     * Returns a string representation of the position, formatted as (x, y, z).
     */
    toString(): string {
        return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)}, ${this.z.toFixed(1)})`;
    }

    /**
     * Returns a plain JS object representation (useful for JSON serialization).
     */
    toObject(): { x: number; y: number; z: number } {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * Creates a new Ixyz from a plain object (e.g., from JSON).
     */
    static fromObject(obj: Partial<Ixyz>): Ixyz {
        return new Ixyz(obj.x ?? 0, obj.y ?? 0, obj.z ?? 0);
    }

    /**
     * Deep copy of this Ixyz.
     */
    clone(): Ixyz {
        return new Ixyz(this.x, this.y, this.z);
    }

    /**
     * Returns true if this Ixyz is equal to another.
     */
    equals(other: Ixyz): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    /**
     * Returns squared distance between this and another Ixyz.
     */
    distanceSqTo(other: Ixyz): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * Type guard to validate a runtime object as Ixyz-compatible.
     */
    static isIxyz(obj: unknown): obj is Ixyz {
        return typeof obj === "object" &&
            obj !== null &&
            "x" in obj && typeof (obj as any).x === "number" &&
            "y" in obj && typeof (obj as any).y === "number" &&
            "z" in obj && typeof (obj as any).z === "number";
    }
}

/**
 * Factory alias for safe construction from unknown input.
 */
export function createIxyz(obj: unknown): Ixyz {
    if (Ixyz.isIxyz(obj)) {
        return new Ixyz(obj.x, obj.y, obj.z);
    }

    console.warn("[MOAR] Invalid input to createIxyz, defaulting to (0,0,0)");
    return new Ixyz();
}
