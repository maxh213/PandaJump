import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  advanceTo,
  at,
  columnsAt,
  first,
  heightOf,
  last,
  oneBox,
  oneBoxAndSecond,
  openGame,
  pixelRows,
  play,
  pressSpace,
  sample,
  settle,
  standardJumps,
  standardRandom,
  twoBoxes,
  twoBoxesAndSecond,
  untilGameOver,
  untilRestart,
} from "./probe.ts";
import type { Sample } from "./probe.ts";

const BACKGROUND = [0x71, 0xc5, 0xcf];
const ART_ROWS: Record<number, [number, number]> = {
  16: [336, 355],
  17: [358, 376],
  18: [378, 397],
  19: [399, 418],
  20: [421, 439],
  21: [441, 460],
  22: [463, 481],
  23: [484, 502],
};

const artRowsFor = (frame: number): [number, number] => {
  const rows = ART_ROWS[frame];
  if (!rows) throw new Error(`no art rows for frame ${String(frame)}`);
  return rows;
};

const isBackground = (pixel: number[]) => pixel.every((value, index) => Math.abs(value - (BACKGROUND[index] ?? 0)) <= 2);

const peakOf = (samples: Sample[]) => samples.reduce((best, entry) => (heightOf(entry) > heightOf(best) ? entry : best));

const landingAfter = (samples: Sample[], time: number): Sample => {
  const landing = samples.find((entry) => entry.time > time && heightOf(entry) === 0);
  if (!landing) throw new Error("expected a landing sample");
  return landing;
};

const imageDimensions = (page: Page, url: string) =>
  page.evaluate(async (imageUrl) => {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, url);

const expectRecognisablePanda = async (page: Page, url: string) => {
  const { width, height } = await imageDimensions(page, url);
  expect(width / height).toBeGreaterThan(0.5);
  expect(width / height).toBeLessThan(2);
};


const scoreNow = async (page: Page) => (await sample(page)).score.text;

const scoreAt = async (page: Page, time: number) => {
  await advanceTo(page, time);
  return scoreNow(page);
};

const spawnTimes = (samples: Sample[]) =>
  [
    ...new Set(
      samples.flatMap((entry) =>
        entry.boxes.filter((box) => box.y === 362).map((box) => Math.round(entry.time - (400 - box.x) / 0.2)),
      ),
    ),
  ].sort((a, b) => a - b);

const expectCleanRestart = async (page: Page) => {
  await advanceTo(page, 100);
  const after = await sample(page);
  expect(after.score.text).toBe("0");
  expect(after.panda.x).toBe(100);
  expect(after.panda.bottom).toBe(426);
  expect(after.boxes).toEqual([]);
};

const deathTime = (restart: { before: Sample; after: Sample }) => restart.before.time + 16 - restart.after.time;

test.describe("Rule: The page keeps its content", () => {
  test("The page shows its title, game and text", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveTitle("Panda Jump");
    await expect(page.locator("h1")).toHaveText("Panda Jump");
    const canvas = page.locator("#game_div canvas");
    await expect(canvas).toHaveAttribute("width", "400");
    await expect(canvas).toHaveAttribute("height", "490");
    expect(await canvas.boundingBox()).toMatchObject({ width: 400, height: 490 });
    await expect(page.locator("p").nth(0)).toHaveText("Check it out on Github");
    await expect(page.getByRole("link", { name: "Github" })).toHaveAttribute("href", "https://github.com/maxh213/PandaJump");
    await expect(page.locator("p").nth(1)).toHaveText("Controls: Click, tap or press Space to jump (you can double jump)");
  });

  test("Nothing on the page loads over plain http", async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, body: "" }));
    await openGame(page, oneBox);
    await page.waitForLoadState("networkidle");
    if (!baseURL) throw new Error("baseURL is required");
    const origin = new URL(baseURL).origin;
    expect(requests.some((url) => url.startsWith("https://fonts.googleapis.com/css?family=Lato"))).toBe(true);
    expect(requests.filter((url) => url.startsWith("http://") && !url.startsWith(origin))).toEqual([]);
    expect(requests.filter((url) => /\/(main\.js|phaser\.min\.js)(\?|$)/.test(new URL(url).pathname))).toEqual([]);
  });

  test("The page has a favicon so the browser does not 404", async ({ page }) => {
    await page.goto("./");
    const href = await page.locator('link[rel="icon"]').getAttribute("href");
    if (!href) throw new Error("favicon href is missing");
    const iconUrl = new URL(href, page.url()).toString();
    const response = await page.request.get(iconUrl);
    expect(response.status()).toBe(200);
    const { width, height } = await imageDimensions(page, iconUrl);
    expect(width).toBe(height);
  });

  test("The page has an apple-touch-icon so iOS shows the Panda when added to the home screen", async ({ page }) => {
    await page.goto("./");
    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    if (!href) throw new Error("apple-touch-icon href is missing");
    const iconUrl = new URL(href, page.url()).toString();
    const response = await page.request.get(iconUrl);
    expect(response.status()).toBe(200);
    await expectRecognisablePanda(page, iconUrl);
  });

  test("The page asks iOS and Android to launch standalone when added to the home screen", async ({ page }) => {
    await page.goto("./");
    const mobileWebAppCapable = await page.locator('meta[name="mobile-web-app-capable"]').getAttribute("content");
    expect(mobileWebAppCapable).toBe("yes");
    const appleMobileWebAppCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute("content");
    expect(appleMobileWebAppCapable).toBe("yes");
  });

  test("Shared links show a real preview", async ({ page }) => {
    await page.goto("./");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description?.toLowerCase()).toContain("panda");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBe("Panda Jump");
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDescription).toBeTruthy();
    expect(ogDescription?.toLowerCase()).toContain("panda");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    if (!ogImage) throw new Error("og:image content is missing");
    const ogImagePath = new URL(ogImage).pathname;
    expect(ogImagePath).toBe("/PandaJump/panda-icon.png");
    const ogImageDevPath = ogImagePath.replace(/^\/PandaJump/, "");
    const ogImageUrl = new URL(ogImageDevPath, page.url()).toString();
    await expectRecognisablePanda(page, ogImageUrl);
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
    expect(ogUrl).toBe("https://maxh213.github.io/PandaJump/");
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    expect(twitterCard).toBe("summary");
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute("content");
    expect(twitterTitle).toBe("Panda Jump");
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute("content");
    expect(twitterDescription).toBe(ogDescription);
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute("content");
    if (!twitterImage) throw new Error("twitter:image content is missing");
    const twitterImagePath = new URL(twitterImage).pathname;
    expect(twitterImagePath).toBe("/PandaJump/panda-icon.png");
    const twitterImageDevPath = twitterImagePath.replace(/^\/PandaJump/, "");
    const twitterImageUrl = new URL(twitterImageDevPath, page.url()).toString();
    await expectRecognisablePanda(page, twitterImageUrl);
  });

  test("The page preconnects to the Google Fonts origins so the font loads sooner", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator('link[rel="preconnect"][href="https://fonts.googleapis.com"]')).toHaveCount(1);
    await expect(page.locator('link[rel="preconnect"][href="https://fonts.gstatic.com"]')).toHaveAttribute("crossorigin", "");
  });
});

test.describe("Rule: The production build", () => {
  test.describe.configure({ mode: "serial" });

  const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".json": "application/json",
  };
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

  test("The production build runs from a plain file host", async ({ page }) => {
    test.setTimeout(120_000);
    const images: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "image" || response.url().endsWith(".png")) {
        images.push({ url: response.url(), status: response.status() });
      }
    });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, body: "" }));
    await page.goto(`${host}/PandaJump/`);
    await page.waitForFunction(() => (window.pandaJump?.run.view().time ?? 0) > 500);
    await expect(page.locator("#game_div canvas")).toBeVisible();
    const frames = new Set<number>();
    for (let index = 0; index < 10; index += 1) {
      frames.add(
        await page.evaluate(() => {
          const handle = window.pandaJump;
          if (!handle) throw new Error("PandaJump has not started");
          return handle.run.view().pandaFrame;
        }),
      );
      await page.waitForTimeout(70);
    }
    expect(frames.size).toBeGreaterThan(1);
    for (const name of ["Panda", "dirt_06", "rock_06", "top_grass_01"]) {
      expect(images.filter((image) => image.url.includes(`/${name}`) && image.status === 200)).not.toEqual([]);
    }
    expect(images.filter((image) => image.status !== 200)).toEqual([]);
  });

  test("The favicon resolves from the production build's path prefix", async ({ page }) => {
    await page.goto(`${host}/PandaJump/`);
    const href = await page.locator('link[rel="icon"]').getAttribute("href");
    if (!href) throw new Error("favicon href is missing");
    const iconUrl = new URL(href, page.url()).toString();
    const response = await page.request.get(iconUrl);
    expect(response.status()).toBe(200);
    const { width, height } = await imageDimensions(page, iconUrl);
    expect(width).toBe(height);
  });

  test("The shared preview image resolves from the production build's path prefix", async ({ page }) => {
    await page.goto(`${host}/PandaJump/`);
    const content = await page.locator('meta[property="og:image"]').getAttribute("content");
    if (!content) throw new Error("og:image content is missing");
    const imageUrl = new URL(new URL(content).pathname, host).toString();
    const response = await page.request.get(imageUrl);
    expect(response.status()).toBe(200);
    await expectRecognisablePanda(page, imageUrl);
  });

  test("The apple-touch-icon resolves from the production build's path prefix", async ({ page }) => {
    await page.goto(`${host}/PandaJump/`);
    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    if (!href) throw new Error("apple-touch-icon href is missing");
    const iconUrl = new URL(href, page.url()).toString();
    const response = await page.request.get(iconUrl);
    expect(response.status()).toBe(200);
    await expectRecognisablePanda(page, iconUrl);
  });

  test("The standalone-launch meta tags resolve from the production build's path prefix", async ({ page }) => {
    await page.goto(`${host}/PandaJump/`);
    const mobileWebAppCapable = await page.locator('meta[name="mobile-web-app-capable"]').getAttribute("content");
    expect(mobileWebAppCapable).toBe("yes");
    const appleMobileWebAppCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute("content");
    expect(appleMobileWebAppCapable).toBe("yes");
  });

  test("The manifest's icon and start_url resolve from the production build's path prefix", async ({ page }) => {
    await page.goto(`${host}/PandaJump/`);
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    if (!href) throw new Error("manifest href is missing");
    const manifestUrl = new URL(href, page.url()).toString();
    const response = await page.request.get(manifestUrl);
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as { start_url: string; icons: { src: string }[] };
    const icon = manifest.icons[0];
    if (!icon) throw new Error("manifest has no icons");
    const iconUrl = new URL(icon.src, manifestUrl).toString();
    const iconResponse = await page.request.get(iconUrl);
    expect(iconResponse.status()).toBe(200);
    expect(iconResponse.headers()["content-type"]).toContain("image/");
    const { width, height } = await imageDimensions(page, iconUrl);
    expect(width).toBe(height);
    const startResponse = await page.request.get(new URL(manifest.start_url, manifestUrl).toString());
    expect(startResponse.status()).toBe(200);
  });
});

test.describe("Rule: The panda runs on a scrolling floor", () => {
  test("The opening scene", async ({ page }) => {
    await openGame(page, oneBox);
    const start = await sample(page);
    const row = first(await pixelRows(page, [150]));
    expect(isBackground(at(row, 300))).toBe(true);
    expect(start.panda).toMatchObject({ x: 100, bottom: 426, width: 25, height: 26.25, key: "Panda.png" });
    expect(start.score).toEqual({ text: "0", x: 20, y: 20, color: "#ffffff", fontSize: "30px" });
    expect(start.boxes).toEqual([]);
    const restart = await untilRestart(page);
    expect(deathTime(restart)).toBeGreaterThanOrEqual(2875);
    expect(deathTime(restart)).toBeLessThanOrEqual(2891);
  });

  test("The run cycle plays whole frames", async ({ page }) => {
    await openGame(page, oneBox);
    const samples = await advance(page, 1000);
    expect([...new Set(samples.map((entry) => entry.panda.frame))].sort((a, b) => a - b)).toEqual([17, 18, 19, 20, 21, 22]);
    for (const entry of samples) {
      expect(entry.panda.frame).toBe(17 + (Math.floor((entry.time * 15) / 1000) % 6));
      const top = entry.panda.cutY;
      const bottom = entry.panda.cutY + entry.panda.cutHeight - 1;
      const [artTop, artBottom] = artRowsFor(entry.panda.frame);
      expect(top).toBeLessThanOrEqual(artTop);
      expect(bottom).toBeGreaterThanOrEqual(artBottom);
      expect(top).toBeGreaterThan(artRowsFor(entry.panda.frame - 1)[1]);
      expect(bottom).toBeLessThan(artRowsFor(entry.panda.frame + 1)[0]);
    }
  });

  test("The floor scrolls without a seam", async ({ page }) => {
    await openGame(page, oneBox);
    const rows = [424, ...Array.from({ length: 64 }, (_, index) => 426 + index)];
    const before = first(await pixelRows(page, [460]));
    const samples: Sample[] = [];
    for (let moment = 0; moment < 16; moment += 1) {
      samples.push(...(await advance(page, 125)));
      for (const pixels of await pixelRows(page, rows)) {
        expect(pixels.filter(isBackground)).toEqual([]);
      }
    }
    const scrolled = (strip: "rock" | "grass") =>
      samples.reduce(
        (total, entry, index) => total + ((entry[strip].scroll - (samples[index - 1]?.[strip].scroll ?? 0) + 64) % 64),
        0,
      );
    expect(scrolled("rock")).toBeCloseTo(400);
    expect(scrolled("grass")).toBeCloseTo(400);
    expect(samples.at(-1)).toMatchObject({ time: 2000, rock: { y: 426, key: "rock_06.png" }, grass: { y: 392, key: "top_grass_01.png" } });
    const after = first(await pixelRows(page, [460]));
    const shifted = after.slice(0, 380);
    expect(shifted).toEqual(before.slice(16, 396));
  });
});

test.describe("Rule: The panda jumps once from the floor and once more in the air", () => {
  const controls: Record<string, (page: Page) => Promise<void>> = {
    "click the canvas": (page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } }),
    "tap the canvas": (page) => page.locator("#game_div canvas").tap({ position: { x: 200, y: 200 } }),
    "press Space": (page) => page.keyboard.press("Space"),
  };

  test.describe("Each control makes the panda jump", () => {
    for (const [action, act] of Object.entries(controls)) {
      test.describe(action, () => {
        test.use({ hasTouch: action === "tap the canvas" });

        test(`Each control makes the panda jump: ${action}`, async ({ page }) => {
          await openGame(page, oneBox);
          await act(page);
          await settle(page);
          const samples = await advance(page, 1300);
          expect(heightOf(first(samples))).toBeGreaterThan(0);
          const peak = peakOf(samples);
          expect(heightOf(peak)).toBeCloseTo(168, -0.5);
          expect(Math.abs(peak.time - 580)).toBeLessThanOrEqual(16);
          expect(Math.abs(landingAfter(samples, peak.time).time - 1160)).toBeLessThanOrEqual(16);
        });
      });
    }
  });

  test.describe("Pressing Space does not scroll the page", () => {
    test.use({ viewport: { width: 800, height: 500 } });

    test("Pressing Space does not scroll the page", async ({ page }) => {
      await openGame(page, oneBox);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(500);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await pressSpace(page);
      const samples = await advance(page, 100);
      expect(heightOf(last(samples))).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  });

  test("A double jump adds a smaller boost", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    const samples = await play(page, [580], 1300);
    expect(Math.abs(heightOf(peakOf(samples)) - 199)).toBeLessThanOrEqual(3);
  });

  test("A third jump in the air is ignored", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    const samples = await play(page, [580, 680], 1600);
    const peak = peakOf(samples);
    expect(Math.abs(heightOf(peak) - 199)).toBeLessThanOrEqual(3);
    expect(Math.abs(landingAfter(samples, peak.time).time - 1460)).toBeLessThanOrEqual(16);
  });

  test("Landing gives both jumps back", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    const firstRun = await play(page, [580], 1600);
    expect(Math.abs(landingAfter(firstRun, 600).time - 1460)).toBeLessThanOrEqual(16);
    const second = await play(page, [1600, 2180], 2800);
    const peak = peakOf(second);
    expect(Math.abs(heightOf(peak) - 199)).toBeLessThanOrEqual(3);
    expect(Math.abs(peak.time - 2430)).toBeLessThanOrEqual(16);
  });
});

test.describe("Rule: Box columns come from the right", () => {
  test.describe("A column of one or two boxes spawns every 1500 ms", () => {
    for (const [boxes, top, random] of [
      [1, 362, oneBox],
      [2, 298, twoBoxes],
    ] as const) {
      test(`A column of one or two boxes spawns every 1500 ms: ${String(boxes)}`, async ({ page }) => {
        await openGame(page, [...random]);
        await advanceTo(page, 1600);
        const columns = columnsAt(await sample(page));
        expect(columns).toHaveLength(1);
        const column = first(columns);
        expect(column.x).toBe(380);
        expect(column.boxes).toHaveLength(boxes);
        expect(column.boxes.every((box) => box.key === "dirt_06.png" && box.width === 64)).toBe(true);
        expect(Math.max(...column.boxes.map((box) => box.y)) + 64).toBe(426);
        expect(Math.min(...column.boxes.map((box) => box.y))).toBe(top);
        await advance(page, 500);
        expect(columnsAt(await sample(page))[0]?.x).toBe(280);
      });
    }
  });

  test("Columns keep coming at a steady rate", async ({ page }) => {
    await openGame(page, oneBox);
    const samples = await play(page, [2700, 4200, 5700], 6100);
    expect(spawnTimes(samples)).toEqual([1500, 3000, 4500, 6000]);
    expect(samples.every((entry) => entry.restarts === 0)).toBe(true);
    expect(last(samples).score.text).toBe("2");
  });

  test("No second column while the score is 10 or less", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, standardRandom({ 12: oneBoxAndSecond }));
    await play(page, standardJumps(18000), 18000);
    expect(await scoreNow(page)).toBe("10");
    await advanceTo(page, 18100);
    const columns = columnsAt(await sample(page));
    expect(columns.map((column) => column.x)).toContain(380);
    expect(columns.map((column) => column.x)).not.toContain(444);
    expect((await sample(page)).restarts).toBe(0);
  });

  test("A second column can follow once the score is above 10", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, standardRandom({ 13: twoBoxesAndSecond }));
    await play(page, standardJumps(19500), 19500);
    expect(await scoreNow(page)).toBe("11");
    await advanceTo(page, 20000);
    const columns = columnsAt(await sample(page)).filter((column) => column.x >= 100);
    expect(columns.map((column) => [column.x, column.boxes.length])).toEqual([
      [300, 2],
      [364, 2],
    ]);
  });

  test("A second column is not always added above 10", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, standardRandom());
    await play(page, standardJumps(19500), 19500);
    expect(await scoreNow(page)).toBe("11");
    await advanceTo(page, 20000);
    const columns = columnsAt(await sample(page)).filter((column) => column.x >= 100);
    expect(columns.map((column) => [column.x, column.boxes.length])).toEqual([[300, 1]]);
  });
});

test.describe("Rule: The score counts cleared columns", () => {
  test("Clearing a one-box column scores 1", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 2700);
    expect(await scoreAt(page, 3300)).toBe("0");
    expect(await scoreAt(page, 3340)).toBe("1");
  });

  test("Clearing a two-box column with a double jump scores 1", async ({ page }) => {
    await openGame(page, twoBoxes);
    await play(page, [2530, 2930], 2930);
    expect(await scoreAt(page, 3300)).toBe("0");
    const after = await advanceTo(page, 3340);
    expect(last(after).score.text).toBe("1");
    expect(after.every((entry) => entry.restarts === 0)).toBe(true);
  });

  test("A spawning column does not score", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 3000);
    const atSpawn = await sample(page);
    expect(atSpawn.time).toBe(3000);
    const firstColumn = first(columnsAt(atSpawn));
    expect(firstColumn.x).toBeLessThan(125);
    expect(firstColumn.x + 64).toBeGreaterThan(100);
    expect(heightOf(atSpawn)).toBeGreaterThan(64);
    expect(columnsAt(atSpawn).map((column) => column.x)).toContain(400);
    expect(await scoreAt(page, 3010)).toBe("0");
    expect(await scoreAt(page, 3340)).toBe("1");
  });

  test("A column scores only once", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 2700);
    expect(await scoreAt(page, 3340)).toBe("1");
    expect(await scoreAt(page, 4300)).toBe("1");
    expect((await sample(page)).restarts).toBe(0);
  });

  test("A double column counts as one clear", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, standardRandom({ 13: oneBoxAndSecond }));
    await play(page, standardJumps(19500), 19500);
    expect(await scoreNow(page)).toBe("11");
    expect(await scoreAt(page, 19840)).toBe("12");
    await play(page, standardJumps(21680).filter((time) => time > 19840), 21400);
    expect(await scoreNow(page)).toBe("12");
    expect(await scoreAt(page, 21600)).toBe("12");
    expect(await scoreAt(page, 21680)).toBe("13");
    expect((await sample(page)).restarts).toBe(0);
  });
});

test.describe("Rule: Touching a box freezes the run and shows a game over screen", () => {
  const controls: Record<string, (page: Page) => Promise<void>> = {
    "click the canvas": (page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } }),
    "tap the canvas": (page) => page.locator("#game_div canvas").tap({ position: { x: 200, y: 200 } }),
    "press Space": (page) => page.keyboard.press("Space"),
  };

  test("Running into a column freezes the run and shows a game over screen", async ({ page }) => {
    await openGame(page, oneBox);
    const { after: diedAt } = await untilGameOver(page);
    expect(Math.abs(diedAt.time - 2875)).toBeLessThanOrEqual(16);
    expect(diedAt.restarts).toBe(0);
    expect(diedAt.gameOverTitle).toMatchObject({ text: "Game over", x: 200, y: 190, color: "#ffffff", fontSize: "40px", visible: true });
    expect(diedAt.gameOverTitle.originX).toBeCloseTo(0.5);
    expect(diedAt.gameOverTitle.originY).toBeCloseTo(0.5);
    expect(diedAt.gameOverScore).toMatchObject({ text: "Score: 0", visible: true });
    expect(diedAt.gameOverBest).toMatchObject({ text: "Best: 0", visible: true });
    expect(diedAt.gameOverPrompt.visible).toBe(false);
    expect(diedAt.gameOverTitle.y).toBeLessThan(diedAt.gameOverScore.y);
    expect(diedAt.gameOverScore.y).toBeLessThan(diedAt.gameOverBest.y);
    expect(diedAt.gameOverBest.y).toBeLessThan(diedAt.gameOverPrompt.y);

    const frozen = last(await advance(page, 300));
    expect(frozen.panda).toEqual(diedAt.panda);
    expect(frozen.boxes).toEqual(diedAt.boxes);
    expect(frozen.rock.scroll).toBe(diedAt.rock.scroll);
    expect(frozen.grass.scroll).toBe(diedAt.grass.scroll);
    expect(frozen.restarts).toBe(0);

    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    await expectCleanRestart(page);
  });

  test("The restart prompt stays hidden until a restart would actually work", async ({ page }) => {
    await openGame(page, oneBox);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverPrompt.visible).toBe(false);
    const stillFrozen = last(await advance(page, 499));
    expect(stillFrozen.gameOverPrompt.visible).toBe(false);
    const ready = last(await advance(page, 1));
    expect(ready.gameOverPrompt).toMatchObject({
      text: "Tap or press Space to play again",
      visible: true,
      color: "#ffffff",
      fontSize: "20px",
    });
  });

  test("Landing on top of a box also freezes the run", async ({ page }) => {
    await openGame(page, twoBoxes);
    await play(page, [2300], 2875);
    expect(Math.abs(heightOf(await sample(page)) - 168)).toBeLessThanOrEqual(3);
    const { after: diedAt } = await untilGameOver(page);
    expect(Math.abs(diedAt.time - 3165)).toBeLessThanOrEqual(16);
    expect(diedAt.gameOverTitle.text).toBe("Game over");
    expect(diedAt.gameOverTitle.visible).toBe(true);
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    await expectCleanRestart(page);
  });

  test("Dying after scoring freezes the run with the score it reached", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700, 4200, 5700], 7300);
    expect(await scoreNow(page)).toBe("3");
    const { after: diedAt } = await untilGameOver(page);
    expect(Math.abs(diedAt.time - 7375)).toBeLessThanOrEqual(16);
    expect(diedAt.score.text).toBe("3");
    expect(diedAt.gameOverScore.text).toBe("Score: 3");
    expect(diedAt.gameOverBest.text).toBe("Best: 3");
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    await expectCleanRestart(page);
  });

  test.describe("No input restarts the run in the first 500ms after death", () => {
    for (const [action, act] of Object.entries(controls)) {
      test.describe(action, () => {
        test.use({ hasTouch: action === "tap the canvas" });

        test(`No input restarts the run in the first 500ms after death: ${action}`, async ({ page }) => {
          await openGame(page, oneBox);
          await untilGameOver(page);
          await advance(page, 400);
          await act(page);
          await settle(page);
          const after = await sample(page);
          expect(after.restarts).toBe(0);
          expect(after.gameOver).toBe(true);
          expect(after.gameOverTitle.visible).toBe(true);
          expect(after.gameOverPrompt.visible).toBe(false);
        });
      });
    }
  });

  test.describe("Each control restarts the run once 500ms have passed", () => {
    for (const [action, act] of Object.entries(controls)) {
      test.describe(action, () => {
        test.use({ hasTouch: action === "tap the canvas" });

        test(`Each control restarts the run once 500ms have passed: ${action}`, async ({ page }) => {
          await openGame(page, oneBox);
          await untilGameOver(page);
          await advance(page, 500);
          await act(page);
          await settle(page);
          const after = await sample(page);
          expect(after.restarts).toBe(1);
          expect(after.score.text).toBe("0");
          expect(after.panda.x).toBe(100);
          expect(after.panda.bottom).toBe(426);
          expect(after.boxes).toEqual([]);
          expect(after.gameOver).toBe(false);
          expect(after.gameOverTitle.visible).toBe(false);
        });
      });
    }
  });

  test("Nothing from the old run survives a restart", async ({ page }) => {
    await openGame(page, oneBox);
    for (let death = 0; death < 3; death += 1) {
      const restart = await untilRestart(page);
      expect(Math.abs(restart.diedAt.time - 2875)).toBeLessThanOrEqual(16);
    }
    const afterThird = await sample(page);
    expect(afterThird.restarts).toBe(3);
    await advanceTo(page, 1400);
    expect((await sample(page)).boxes).toEqual([]);
    await advanceTo(page, 1600);
    expect(columnsAt(await sample(page)).map((column) => column.x)).toEqual([380]);
    await play(page, [2700], 3100);
    const last = await sample(page);
    expect(columnsAt(last).map((column) => column.x)).toEqual([80, 380]);
    expect(last.score.text).toBe("0");
    expect(last.restarts).toBe(3);
  });
});
