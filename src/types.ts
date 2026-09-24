export interface MicroprismParams {
  /**
   * Prism cell size in pixels of the output texture.
   * Matches the Figma "Size" parameter.
   */
  prismSize: number;

  /**
   * Focus in the 0..100 range.
   *
   * 0   — maximum effect.
   * 100 — original image.
   */
  focus: number;

  /**
   * Prism contrast in the 0..100 range.
   * To match Figma it is mapped to 0.5..1.0 inside the effect.
   */
  prismContrast: number;
}

export const defaultMicroprismParams: MicroprismParams = {
  prismSize: 24,
  focus: 0,
  prismContrast: 50,
};

export const microprismRanges = {
  prismSize: {
    min: 4,
    max: 32,
    step: 1,
  },
  focus: {
    min: 0,
    max: 100,
    step: 1,
  },
  prismContrast: {
    min: 0,
    max: 100,
    step: 1,
  },
} as const;