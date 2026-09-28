import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

interface Manifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: { src: string; sizes: string; purpose?: string }[];
}

const MASKABLE_SAFE_ZONE_INSET = 0.17;

const countSafeZoneViolations = (page: Page, url: string, inset: number) =>
  page.evaluate(
    async ({ imageUrl, safeInset }) => {
      const image = new Image();
      image.src = imageUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("2d context unavailable");
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const center = canvas.width / 2;
      const radius = canvas.width * (0.5 - safeInset);
      let violations = 0;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (!alpha) continue;
          const dx = x + 0.5 - center;
          const dy = y + 0.5 - center;
          if (Math.sqrt(dx * dx + dy * dy) > radius) violations += 1;
        }
      }
      return violations;
    },
    { imageUrl: url, safeInset: inset },
  );

const manifestHref = (page: Page) =>
  page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? "");

const themeColorContent = (page: Page) =>
  page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? "");

const fetchManifest = async (page: Page): Promise<{ url: string; manifest: Manifest }> => {
  const href = await manifestHref(page);
  const url = new URL(href, page.url()).toString();
  const response = await page.request.get(url);
  expect(response.status()).toBe(200);
  return { url, manifest: (await response.json()) as Manifest };
};

test.describe("Rule: The page links a web app manifest and a matching theme colour", () => {
  test("index.html links the manifest and sets a matching theme-color meta tag", async ({ page }) => {
    await page.goto("./");
    expect(await manifestHref(page)).toBe("manifest.json");
    expect(await themeColorContent(page)).toBe("#000000");
  });
});

test.describe("Rule: The manifest describes Panda Jump as an installable, standalone app", () => {
  test("The manifest fetches as JSON with the app's name, short name and display mode", async ({ page }) => {
    await page.goto("./");
    const { manifest } = await fetchManifest(page);
    expect(manifest.name).toBe("Panda Jump");
    expect(manifest.short_name).toBe("Panda Jump");
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBe("#000000");
    expect(manifest.theme_color).toBe("#000000");
  });
});

test.describe("Rule: The manifest's icon is a single square Panda icon, not the raw sprite sheet", () => {
  test("The manifest's icon URL resolves to a square image matching its declared sizes", async ({ page }) => {
    await page.goto("./");
    const { url, manifest } = await fetchManifest(page);
    const icon = manifest.icons[0];
    if (!icon) throw new Error("manifest has no icons");
    expect(icon.src).not.toBe("assets/Panda.png");
    const iconUrl = new URL(icon.src, url).toString();
    const response = await page.request.get(iconUrl);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
    const { width, height } = await page.evaluate(async (imageUrl) => {
      const image = new Image();
      image.src = imageUrl;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, iconUrl);
    expect(width).toBe(height);
    expect(icon.sizes).toBe(`${String(width)}x${String(height)}`);
  });
});

test.describe("Rule: The manifest's icon is padded for Android's adaptive-icon mask", () => {
  test("The manifest's icon keeps every panda pixel inside the maskable safe zone", async ({ page }) => {
    await page.goto("./");
    const { url, manifest } = await fetchManifest(page);
    const icon = manifest.icons[0];
    if (!icon) throw new Error("manifest has no icons");
    expect(icon.purpose).toBe("maskable");
    const iconUrl = new URL(icon.src, url).toString();
    const violations = await countSafeZoneViolations(page, iconUrl, MASKABLE_SAFE_ZONE_INSET);
    expect(violations).toBe(0);
  });
});
