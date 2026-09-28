import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

interface Manifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: { src: string }[];
}

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

test.describe("Rule: The manifest's icon points at the real Panda image", () => {
  test("The manifest's icon URL resolves to the Panda.png asset", async ({ page }) => {
    await page.goto("./");
    const { url, manifest } = await fetchManifest(page);
    const icon = manifest.icons[0];
    if (!icon) throw new Error("manifest has no icons");
    const iconUrl = new URL(icon.src, url).toString();
    const response = await page.request.get(iconUrl);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
  });
});

test.describe("Rule: The manifest survives the production build's asset hashing", () => {
  const types: Record<string, string> = { ".html": "text/html", ".json": "application/json", ".png": "image/png" };
  let server: Server;
  let host = "";

  test.beforeAll(() => {
    execSync("npm run build", { stdio: "ignore" });
    const dist = join(process.cwd(), "dist");
    server = createServer((request, response) => {
      const path = new URL(request.url ?? "/", "http://host").pathname;
      const relative = normalize(path.replace(/^\/PandaJump\//, "/").replace(/\/$/, "/index.html"));
      try {
        const body = readFileSync(join(dist, relative));
        response.writeHead(path.startsWith("/PandaJump/") ? 200 : 404, { "content-type": types[extname(relative)] ?? "" });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    return new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        host = `http://localhost:${String(typeof address === "object" && address ? address.port : 0)}`;
        resolve();
      });
    });
  });

  test.afterAll(() => {
    server.close();
  });

  test("The manifest's icon and start_url resolve against the manifest's own hashed-build URL", async ({ page }) => {
    await page.goto(`${host}/PandaJump/`);
    const { url, manifest } = await fetchManifest(page);
    const icon = manifest.icons[0];
    if (!icon) throw new Error("manifest has no icons");
    const iconResponse = await page.request.get(new URL(icon.src, url).toString());
    expect(iconResponse.status()).toBe(200);
    expect(iconResponse.headers()["content-type"]).toContain("image/");
    const startResponse = await page.request.get(new URL(manifest.start_url, url).toString());
    expect(startResponse.status()).toBe(200);
  });
});
