export { MicroprismEffect } from "./webgl/MicroprismEffect";

export {
  defaultMicroprismParams,
  microprismRanges,
  type MicroprismParams,
} from "./types";

export { microprismVert, microprismFrag } from "./shaders";

import { MicroprismEffect } from "./webgl/MicroprismEffect";
import { defaultMicroprismParams, type MicroprismParams } from "./types";

/**
 * Handle returned by applyMicroprism().
 * Everything you need to drive the effect from vanilla code.
 */
export interface MicroprismHandle {
  /** Change the params and redraw. */
  setParams(next: Partial<MicroprismParams>): void;
  /** Read the current params. */
  getParams(): MicroprismParams;
  /** Force a redraw of the current frame. */
  render(): void;
  /** Replace the source image (async). */
  setImage(src: string): Promise<void>;
  /** Promise that resolves when the first frame is ready. */
  readonly ready: Promise<void>;
  /** Release GPU resources. Must be called when the canvas is removed. */
  destroy(): void;
}

/**
 * Quick start for simple projects without frameworks.
 *
 * Works ONLY in the browser (needs WebGL2 and a real <canvas>).
 * Do not call it on the server/SSR — there is no isPlatform guard here,
 * that is the responsibility of the adapters (Angular/React).
 *
 * @example
 * const fx = applyMicroprism(canvas, "/photo.jpg", { prismSize: 24 });
 * fx.setParams({ focus: 30 });
 * // ...later: fx.destroy();
 */
export function applyMicroprism(
  canvas: HTMLCanvasElement,
  src: string,
  params: Partial<MicroprismParams> = {},
): MicroprismHandle {
  const instance = new MicroprismEffect(canvas, {
    ...defaultMicroprismParams,
    ...params,
  });

  instance.init();

  const ready = instance.setImage(src);

  return {
    setParams: (next) => instance.setParams(next),
    getParams: () => instance.getParams(),
    render: () => instance.render(),
    setImage: (s) => instance.setImage(s),
    ready,
    destroy: () => instance.destroy(),
  };
}