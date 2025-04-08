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
     * Default constructor sets position to (0, 0, 0).
     */
    constructor();

    /**
     * Constructs a new Ixyz with the given coordinates.
     * @param x - X-axis coordinate
     * @param y - Y-axis coordinate
     * @param z - Z-axis coordinate
     */
    constructor(x: number, y: number, z: number);

    constructor(x?: number, y?: number, z?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }

    /** Returns a string formatted as (x, y, z). */
    toString(): string {
        return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)}, ${this.z.toFixed(1)})`;
    }

    /** Returns a plain object form for serialization. */
    toObject(): { x: number; y: number; z: number } {
        return { x: this.x, y: this.y, z: this.z };
    }

    /** Clones this vector as a new Ixyz. */
    clone(): Ixyz {
        return new Ixyz(this.x, this.y, this.z);
    }

    /**
     * Checks if two Ixyz instances are equal.
     * Optionally allows a tolerance threshold for float comparisons.
     */
    equals(other: Ixyz, tolerance = 0): boolean {
        return Math.abs(this.x - other.x) <= tolerance &&
               Math.abs(this.y - other.y) <= tolerance &&
               Math.abs(this.z - other.z) <= tolerance;
    }

    /** Returns squared distance to another Ixyz. */
    distanceSqTo(other: Ixyz): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /** Returns actual (non-squared) distance to another Ixyz. */
    distanceTo(other: Ixyz): number {
        return Math.sqrt(this.distanceSqTo(other));
    }

    /** Static: creates an Ixyz from a raw object (e.g. JSON) */
    static fromObject(obj: Partial<Ixyz>): Ixyz {
        return new Ixyz(obj.x ?? 0, obj.y ?? 0, obj.z ?? 0);
    }

    /**
     * Static: runtime check if a value is Ixyz-compatible.
     */
    static isIxyz(obj: unknown): obj is Ixyz {
        return typeof obj === "object" && obj !== null &&
            typeof (obj as any).x === "number" &&
            typeof (obj as any).y === "number" &&
            typeof (obj as any).z === "number";
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
