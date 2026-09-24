import { microprismVert as vertexShaderSource, microprismFrag as fragmentShaderSource } from "../shaders";

import { clamp, createProgramFromSources } from "./utils";
import { createTextureFromImage, loadImage } from "./texture";

import {
  defaultMicroprismParams,
  microprismRanges,
  type MicroprismParams,
} from "../types";

interface UniformLocations {
  uImage: WebGLUniformLocation | null;
  uFrameData: WebGLUniformLocation | null;
  uPrismSize: WebGLUniformLocation | null;
  uFocus: WebGLUniformLocation | null;
  uPrismContrast: WebGLUniformLocation | null;
}

/**
 * Lightweight WebGL2 host for the Microprism Glass effect.
 *
 * How it works:
 *   image -> texture -> fullscreen quad -> fragment shader -> canvas
 *
 * No 3D scene is involved.
 */
export class MicroprismEffect {
  private canvas: HTMLCanvasElement;
  private params: MicroprismParams;

  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;

  private vao: WebGLVertexArrayObject | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;

  private uniformLocations: UniformLocations = {
    uImage: null,
    uFrameData: null,
    uPrismSize: null,
    uFocus: null,
    uPrismContrast: null,
  };

  constructor(
    canvas: HTMLCanvasElement,
    params: Partial<MicroprismParams> = {}
  ) {
    this.canvas = canvas;
    this.params = {
      ...defaultMicroprismParams,
      ...params,
    };
  }

  /**
   * Initializes WebGL2, compiles the shaders and creates the quad.
   */
  init(): void {
    if (this.gl) {
      return;
    }

    const gl = this.canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error("WebGL2 is not supported by this browser or device");
    }

    this.gl = gl;

    this.program = createProgramFromSources(
      gl,
      vertexShaderSource,
      fragmentShaderSource
    );

    this.cacheUniformLocations();
    this.createQuad();
  }

  /**
   * Loads an image and applies the effect.
   *
   * The internal canvas size is set to naturalWidth/naturalHeight.
   * If you need responsive/DPR rendering, adapt this method to your project.
   */
  async setImage(src: string): Promise<void> {
    if (!this.gl) {
      this.init();
    }

    const gl = this.gl;

    if (!gl) {
      throw new Error("WebGL2 context is not initialized");
    }

    const image = await loadImage(src);

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error("Image has zero size");
    }

    this.canvas.width = image.naturalWidth;
    this.canvas.height = image.naturalHeight;

    if (this.texture) {
      gl.deleteTexture(this.texture);
    }

    this.texture = createTextureFromImage(gl, image);

    this.render();
  }

  /**
   * Updates the params and redraws the frame.
   */
  setParams(next: Partial<MicroprismParams>): void {
    this.params = {
      ...this.params,
      ...next,
    };

    this.render();
  }

  /**
   * Current effect params.
   */
  getParams(): MicroprismParams {
    return { ...this.params };
  }

  /**
   * Renders a single frame.
   *
   * For a static effect it is enough to call this method only when:
   * - an image is loaded;
   * - params change;
   * - the canvas size changes.
   */
  render(): void {
    const gl = this.gl;

    if (!gl || !this.program || !this.texture || !this.vao) {
      return;
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    const loc = this.uniformLocations;

    gl.uniform1i(loc.uImage, 0);

    const width = Math.max(1, this.canvas.width);
    const height = Math.max(1, this.canvas.height);

    const prismSize = clamp(
      this.params.prismSize,
      microprismRanges.prismSize.min,
      microprismRanges.prismSize.max
    );

    const focus = clamp(
      this.params.focus,
      microprismRanges.focus.min,
      microprismRanges.focus.max
    );

    const prismContrast = clamp(
      this.params.prismContrast,
      microprismRanges.prismContrast.min,
      microprismRanges.prismContrast.max
    );

    /*
      Parameter mapping is kept exactly as in the Figma wrapper.

      focus:
        0..100 -> 0..1

      prismContrast:
        0..100 -> 0.5..1.0

      This non-linear contrast mapping is what matters for a visual
      match with the original Figma shader.
    */
    const focus01 = focus / 100;
    const contrast01 = (50 + 0.5 * prismContrast) / 100;

    gl.uniform4f(loc.uFrameData, 0, width, height, 0);
    gl.uniform4f(loc.uPrismSize, prismSize, 0, 0, 0);
    gl.uniform4f(loc.uFocus, focus01, 0, 0, 0);
    gl.uniform4f(loc.uPrismContrast, contrast01, 0, 0, 0);

    gl.viewport(0, 0, width, height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
  }

  /**
   * Releases GPU resources.
   *
   * Always call it when a component is destroyed in an SPA,
   * to avoid memory leaks.
   */
  destroy(): void {
    const gl = this.gl;

    if (!gl) {
      return;
    }

    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }

    if (this.quadBuffer) {
      gl.deleteBuffer(this.quadBuffer);
      this.quadBuffer = null;
    }

    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }

    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }

    this.uniformLocations = {
      uImage: null,
      uFrameData: null,
      uPrismSize: null,
      uFocus: null,
      uPrismContrast: null,
    };

    this.gl = null;
  }

  private cacheUniformLocations(): void {
    const gl = this.gl;
    const program = this.program;

    if (!gl || !program) {
      return;
    }

    this.uniformLocations = {
      uImage: gl.getUniformLocation(program, "uImage"),
      uFrameData: gl.getUniformLocation(program, "uFrameData"),
      uPrismSize: gl.getUniformLocation(program, "uPrismSize"),
      uFocus: gl.getUniformLocation(program, "uFocus"),
      uPrismContrast: gl.getUniformLocation(program, "uPrismContrast"),
    };
  }

  private createQuad(): void {
    const gl = this.gl;

    if (!gl) {
      return;
    }

    /*
      The same fullscreen quad as in the Figma code.

      Vertex format:
        x, y, u, v

      Two triangles, 6 vertices.
    */
    const quadVertices = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,

      -1,  1, 0, 0,
       1, -1, 1, 1,
       1,  1, 1, 0,
    ]);

    this.quadBuffer = gl.createBuffer();

    if (!this.quadBuffer) {
      throw new Error("Failed to create a WebGL buffer for the quad");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    this.vao = gl.createVertexArray();

    if (!this.vao) {
      throw new Error("Failed to create WebGLVertexArrayObject");
    }

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

    // location 0 — aPosition
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(
      0,
      2,
      gl.FLOAT,
      false,
      4 * 4,
      0
    );

    // location 1 — aUv
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(
      1,
      2,
      gl.FLOAT,
      false,
      4 * 4,
      2 * 4
    );

    gl.bindVertexArray(null);
  }
}