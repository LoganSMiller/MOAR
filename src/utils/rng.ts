export class RNG {
    seed: number;

    constructor(seed = Date.now()) {
        this.seed = seed;
    }

    next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}
