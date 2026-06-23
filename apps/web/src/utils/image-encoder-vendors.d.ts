declare module "gifenc" {
  export type GifPalette = number[][];

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { clearAlpha?: boolean; format?: "rgb565" | "rgb444" | "rgba4444"; oneBitAlpha?: boolean | number },
  ): GifPalette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): {
    bytes: () => Uint8Array;
    finish: () => void;
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      options?: { delay?: number; palette?: GifPalette; repeat?: number },
    ) => void;
  };
}

declare module "utif2" {
  export function encodeImage(
    rgba: ArrayBuffer,
    width: number,
    height: number,
    metadata?: Record<string, unknown>,
  ): ArrayBuffer;
}
