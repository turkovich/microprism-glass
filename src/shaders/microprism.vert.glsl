#version 300 es

/*
  Vertex shader for a fullscreen quad.

  Attribute layout:
    location 0 — aPosition, vec2, clip-space from -1 to 1
    location 1 — aUv, vec2, texture coordinates

  Uses the same geometry as the Figma shader:
    -1, -1,  0, 1
     1, -1,  1, 1
    -1,  1,  0, 0

    -1,  1,  0, 0
     1, -1,  1, 1
     1,  1,  1, 0
*/

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUv;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}