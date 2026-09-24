# About

Official WebGL2 port of my **Microprism Glass** shader from Figma Community:

```text
https://www.figma.com/community/shader/1684290436246690557/microprism-glass
```

Apply it to any `<canvas>` from vanilla JS, Vue, Svelte, Angular or React.

- Zero runtime dependencies.
- Ships ESM + CJS + TypeScript types.
- GLSL is inlined at build time — no `?raw`, no loader config on your side.

## Install

npm i microprism-glass

## Quick start (vanilla)
```javascript
import { applyMicroprism } from "microprism-glass";

const canvas = document.querySelector("#fx");
const fx = applyMicroprism(canvas, "/photo.jpg", {
  prismSize: 24,   // 4..32
  focus: 0,        // 0 = max effect, 100 = original
  prismContrast: 50,
});

// later
fx.setParams({ focus: 30 });
fx.destroy();
```

## Params

| param | range | default | note |
|---|---|---|---|
| prismSize | 4..32 | 24 | in OUTPUT canvas pixels, not CSS px |
| focus | 0..100 | 0 | inverted: 0 = strongest |
| prismContrast | 0..100 | 50 | mapped internally as (50 + 0.5*v)/100 to match Figma |

## Browser-only

`applyMicroprism` / `MicroprismEffect.init()` require a real browser canvas
with WebGL2. Importing the package on the server is safe (nothing runs),
but do not call init() outside the browser. Framework adapters should guard
with their platform check (e.g. Angular isPlatformBrowser).

## Security notes

`esbuild` is a devDependency used only for one-shot `build()` bundling.
The project does not use esbuild's `serve` feature, so
GHSA-67mh-4wv8-2f99 (CORS on the dev server) is not applicable here.
esbuild is never shipped in `dist/` and is not a runtime dependency of consumers.

## License

MIT. The visual effect is a port of a Figma Community shader —
check the original resource license before commercial use.


## Maintenance & Contributions

This package is published under the MIT License. You are free to use, modify, and distribute it however you wish.

However, please note:
- This library is currently used only in my private projects.
- I do not have bandwidth to review external Pull Requests or provide long-term support for community features.
- If you need specific functionality, please **fork the repository** and maintain your own version.

Issues regarding bugs will be addressed when possible, but new feature requests may be declined. Thank you for respecting the maintainer's time.