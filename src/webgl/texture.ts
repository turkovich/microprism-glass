/**
 * Image loading and WebGL2 texture creation.
 */

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    // Needed for images served from another domain.
    // For local files from public/ it usually does not get in the way.
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));

    image.src = src;
  });
}

export function createTextureFromImage(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement
): WebGLTexture {
  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("Failed to create WebGL texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  /*
    The Figma quad uses a UV layout where the bottom edge has v = 1
    and the top edge has v = 0.

    That is why we explicitly keep UNPACK_FLIP_Y_WEBGL = false here.

    If the image turns out flipped, change this value to true
    OR invert the UV in the vertex shader, but never both at once.
  */
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}