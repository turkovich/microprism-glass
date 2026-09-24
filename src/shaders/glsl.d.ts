// Declares the .glsl import type for tsc/the editor inside the package itself.
// Consumers do NOT need this declaration: no .glsl imports remain in the
// public .d.ts files (see src/shaders/index.ts).
declare module "*.glsl" {
  const source: string;
  export default source;
}