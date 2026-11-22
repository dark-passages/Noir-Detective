/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Deterministic pseudo-random number generator implementation using Mulberry32 / SplitMix32.
 * Ensures that identical seeds and ruleset versions produce identical cases, clues, timelines, and dialogue.
 */

export function hashString(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

export class SeededRNG {
  private s: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.s = hashString(seed);
    } else {
      this.s = seed >>> 0;
    }
    // Warm up generator
    this.next();
    this.next();
  }

  /** Returns an unsigned 32-bit integer */
  public next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  }

  /** Returns float in range [0, 1) */
  public float(): number {
    return this.next() / 4294967296;
  }

  /** Returns integer in range [min, max] inclusive */
  public int(min: number, max: number): number {
    return min + Math.floor(this.float() * (max - min + 1));
  }

  /** Picks a random element from an array deterministically */
  public pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.int(0, array.length - 1)];
  }

  /** Deterministic array shuffle (Fisher-Yates) */
  public shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  /** Samples k unique items from array */
  public sample<T>(array: readonly T[], k: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(k, array.length));
  }

  /**
   * Derives an independent sub-stream for a specific generation phase
   * (e.g. 'cast', 'solution', 'map', 'timeline', 'clues', 'dialogue')
   */
  public subStream(subKey: string): SeededRNG {
    const subSeed = (this.next() ^ hashString(subKey)) >>> 0;
    return new SeededRNG(subSeed);
  }
}
