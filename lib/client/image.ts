"use client";
// Reduz a foto no aparelho (≤1280 px, JPEG) — redesenhar no canvas remove o EXIF,
// inclusive o GPS — e calcula estatísticas simples usadas pelo diagnóstico provisório.

export type PreparedImage = {
  blob: Blob;
  stats: { brightness: number; green: number; brown: number; hash: number };
};

export async function prepareImage(file: Blob, max = 1280): Promise<PreparedImage> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.82));

  // estatísticas em 64×64
  const s = document.createElement("canvas");
  s.width = 64; s.height = 64;
  const sc = s.getContext("2d", { willReadFrequently: true })!;
  sc.drawImage(canvas, 0, 0, 64, 64);
  const { data } = sc.getImageData(0, 0, 64, 64);
  let lum = 0, green = 0, brown = 0, hash = 2166136261;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    lum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (g > r * 1.05 && g > b * 1.1) green++;
    if (r > g && g > b * 1.15 && r > 70) brown++;
    if (i % 64 === 0) hash = Math.imul(hash ^ (r + g + b), 16777619) >>> 0;
  }
  const n = data.length / 4;
  return { blob, stats: { brightness: lum / n, green: green / n, brown: brown / n, hash } };
}
