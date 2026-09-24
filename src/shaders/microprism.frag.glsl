#version 300 es

/*
  Fragment shader — a port of Microprism Glass from Figma/WebGPU WGSL
  to GLSL ES 3.00 for WebGL2.

  Input:
    uImage — texture with the source image.

  Control parameters:
    uFrameData.yz       — width and height of the output canvas.
    uPrismSize.x        — prism cell size.
    uFocus.x            — normalized focus, 0..1.
    uPrismContrast.x    — normalized contrast, 0..1.

  Important:
    focus and contrast must be pre-mapped in JS
    the way the Figma wrapper does it.
*/

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;

// x — time, usually 0
// y — output width
// z — output height
uniform vec4 uFrameData;

// x — prism size in output pixels
uniform vec4 uPrismSize;

// x — normalized focus, 0..1
uniform vec4 uFocus;

// x — normalized prism contrast, 0..1
uniform vec4 uPrismContrast;

vec4 sampleInput(vec2 p) {
    return textureLod(
        uImage,
        clamp(p, vec2(0.0), vec2(1.0)),
        0.0
    );
}

void main() {
    vec2 dims = max(uFrameData.yz, vec2(1.0));
    vec2 uv = vUv;

    float prismSize = uPrismSize.x;
    float focus = uFocus.x;
    float prismContrast = uPrismContrast.x;

    vec4 inputColor = sampleInput(uv);

    float cell = max(prismSize, 4.0);

    vec2 p = uv * dims;
    vec2 local = fract(p / cell) - vec2(0.5);

    // A square cell behaves like a tiny pyramid.
    // The diagonals pick one of the four triangular facets.
    float sx = local.x >= 0.0 ? 1.0 : -1.0;
    float sy = local.y >= 0.0 ? 1.0 : -1.0;

    vec2 xFace = vec2(sx, 0.0);
    vec2 yFace = vec2(0.0, sy);

    float faceMetric = abs(local.x) - abs(local.y);

    // Subpixel AA band along the diagonal to avoid shimmering.
    float faceAa = max(fwidth(faceMetric) * 0.85, 0.002);
    float xWeight = smoothstep(-faceAa, faceAa, faceMetric);

    vec2 direction = normalize(mix(yFace, xFace, xWeight));
    vec2 tangent = vec2(-direction.y, direction.x);

    // focus = 1 -> defocus = 0 -> original image.
    // focus = 0 -> defocus = 1 -> maximum effect.
    float defocus = pow(1.0 - clamp(focus, 0.0, 1.0), 1.35);

    float displacementPx = cell * 0.82 * defocus;
    vec2 refractedUv = uv + direction * displacementPx / dims;

    // The dominant refraction sample keeps the contours readable.
    vec4 dominant = sampleInput(refractedUv);

    // Secondary samples produce a soft optical gather / dispersion-like look.
    float spreadPx = cell * 4.5 * defocus;

    vec4 secondary = vec4(0.0);

    secondary += sampleInput(
        refractedUv + (direction * -0.90 + tangent * 0.18) * spreadPx / dims
    ) * 0.06;

    secondary += sampleInput(
        refractedUv + (direction * -0.58 - tangent * 0.24) * spreadPx / dims
    ) * 0.09;

    secondary += sampleInput(
        refractedUv + (direction * -0.30 + tangent * 0.16) * spreadPx / dims
    ) * 0.13;

    secondary += sampleInput(
        refractedUv + (direction *  0.24 - tangent * 0.18) * spreadPx / dims
    ) * 0.15;

    secondary += sampleInput(
        refractedUv + (direction *  0.48 + tangent * 0.22) * spreadPx / dims
    ) * 0.12;

    secondary += sampleInput(
        refractedUv + (direction *  0.76 - tangent * 0.15) * spreadPx / dims
    ) * 0.08;

    secondary += sampleInput(
        refractedUv + (direction *  1.00 + tangent * 0.12) * spreadPx / dims
    ) * 0.05;

    secondary /= 0.68;

    float secondaryAmount = 0.28 * defocus;
    vec4 opticalColor = mix(dominant, secondary, secondaryAmount);

    // Contrast controls how far the optical result comes forward.
    float contrastValue = clamp(prismContrast, 0.0, 1.0);
    float contrastStrength = pow(contrastValue, 1.8);

    float quietOpticalAmount = 0.24 + 0.06 * defocus;
    vec4 quietBaseline = mix(inputColor, opticalColor, quietOpticalAmount);

    vec4 color = mix(quietBaseline, opticalColor, contrastStrength);

    // The local facet response is taken from the scene itself,
    // not from an explicit pattern, so the effect stays photographic.
    float probePx = max(1.0, cell * 0.18);

    vec4 probeA = sampleInput(
        refractedUv + direction * probePx / dims
    );

    vec4 probeB = sampleInput(
        refractedUv - direction * probePx / dims
    );

    float lumA = dot(probeA.rgb, vec3(0.2126, 0.7152, 0.0722));
    float lumB = dot(probeB.rgb, vec3(0.2126, 0.7152, 0.0722));

    float lumDelta = lumA - lumB;

    float detailGate = smoothstep(0.008, 0.075, abs(lumDelta));
    float directionalResponse = lumDelta / (0.08 + abs(lumDelta));

    float safeAlpha = max(color.a, 0.001);

    float baseLum = clamp(
        dot(color.rgb / safeAlpha, vec3(0.2126, 0.7152, 0.0722)),
        0.0,
        1.0
    );

    // Shadow and highlight protection so that the gain does not break the tonality.
    float shadowRoom = smoothstep(0.015, 0.20, baseLum);
    float highlightRoom = 1.0 - smoothstep(0.80, 0.985, baseLum);

    float tonalProtection = 0.18 + 0.82 * shadowRoom * highlightRoom;

    float orientation = direction.x * 0.65 - direction.y * 0.35;

    float faceSignal =
        (directionalResponse * 0.10 + orientation * 0.018) * detailGate;

    float gainOffset = clamp(
        faceSignal * contrastStrength * tonalProtection,
        -0.12,
        0.12
    );

    float facetGain = 1.0 + gainOffset;

    color = vec4(
        clamp(color.rgb * facetGain, vec3(0.0), vec3(color.a)),
        color.a
    );

    // At focus = 100 we return exactly the source pixel,
    // regardless of all the rest of the facet math.
    fragColor = mix(inputColor, color, defocus);

    // If you work only with opaque JPG/PNG and do not need alpha,
    // you can uncomment:
    // fragColor.a = 1.0;
}