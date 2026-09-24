import microprismVertRaw from "./microprism.vert.glsl";
import microprismFragRaw from "./microprism.frag.glsl";

/**
 * GLSL sources inlined by the package bundler as strings.
 * We expose them as strings on purpose so that no *.glsl leaks into the public types.
 */
export const microprismVert: string = microprismVertRaw;
export const microprismFrag: string = microprismFragRaw;