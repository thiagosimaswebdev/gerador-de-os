// Extracts the two most representative saturated colors from a logo image.
export async function logoColors(src) {
  if (!src) return null;
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = src; });
  const canvas = document.createElement("canvas"); canvas.width = 48; canvas.height = 48;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) return null;
  ctx.drawImage(image, 0, 0, 48, 48);
  const data = ctx.getImageData(0, 0, 48, 48).data; const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = data.slice(i, i + 4); const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (a < 160 || max > 245 && min > 230 || max < 25 || max - min < 28) continue;
    const key = [r, g, b].map(v => Math.round(v / 32)).join("-"); const item = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    item.r += r; item.g += g; item.b += b; item.n++; buckets.set(key, item);
  }
  const colors = [...buckets.values()].sort((a, b) => b.n - a.n).map(c => `rgb(${Math.round(c.r / c.n)} ${Math.round(c.g / c.n)} ${Math.round(c.b / c.n)})`);
  return colors.length ? [colors[0], colors[1] || colors[0]] : null;
}
