/**
 * Simple deterministic pseudo-random number generator (PRNG)
 * using a sine-based algorithm. Useful for reproducible randomness.
 */
export class RNG {
    /** Internal seed state */
    private seed: number;

    /**
     * Creates a new RNG instance with optional custom seed.
     * @param seed - Initial seed value. Defaults to current time in milliseconds.
     */
    constructor(seed: number = Date.now()) {
        this.seed = seed;
    }

    /**
     * Generates a pseudo-random float between 0 (inclusive) and 1 (exclusive).
     */
    public next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Returns a pseudo-random integer between min (inclusive) and max (inclusive).
     * @param min - Minimum value
     * @param max - Maximum value
     */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Returns a boolean based on a 50/50 chance.
     */
    public nextBool(): boolean {
        return this.next() >= 0.5;
    }

    /**
     * Returns a random item from an array.
     * @param array - The array to pick from
     */
    public pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }

    /**
     * Returns a new RNG instance with a forked seed.
     * Useful for generating reproducible substreams.
     */
    public fork(): RNG {
        return new RNG(this.seed + 1337);
    }
}
