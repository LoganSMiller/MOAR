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
     * Populates the Ixyz fields from a basic JS object (e.g., from JSON).
     */
    static fromObject(obj: Partial<Ixyz>): Ixyz {
        return new Ixyz(obj.x ?? 0, obj.y ?? 0, obj.z ?? 0);
    }

    /**
     * Converts this Ixyz to a plain object for JSON serialization.
     */
    toObject(): { x: number, y: number, z: number } {
        return { x: this.x, y: this.y, z: this.z };
    }
}
