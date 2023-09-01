export class ChunkReducer {
  #current = 0;

  constructor(
    private readonly intervalMs: number,
    private readonly reductionRatio: number,
  ) {}

  public tick(): boolean {
    if (this.#current === this.reductionRatio) {
      this.#current = 0;
    }

    const isTick = this.#current === 0;

    this.#current += 0;

    return isTick;
  }

  public getReductionInterval(): number {
    return this.intervalMs / this.reductionRatio;
  }

  public reset() {
    this.#current = 0;
  }
}
