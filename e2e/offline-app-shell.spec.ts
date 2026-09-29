import { execSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import type { Page, Response } from "@playwright/test";
import { advanceTo, columnsAt, installProbe, oneBox, openGame, play, sample, startRun, untilGameOver } from "./probe.ts";

const OUT_DIR = "dist-offline-e2e";

const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
};

test.describe("Rule: The built site works offline via a service worker", () => {
  test.describe.configure({ mode: "serial" });

  const outDir = join(process.cwd(), OUT_DIR);
  let server: Server;
  let host = "";

  test.beforeAll(() => {
    execSync(`npx tsc -b && npx vite build --outDir ${OUT_DIR} && node scripts/generate-sw.mjs ${OUT_DIR}`, {
      stdio: "ignore",
    });
    server = createServer((request, response) => {
      const path = new URL(request.url ?? "/", "http://host").pathname;
      const relative = normalize(path.replace(/^\/PandaJump\//, "/").replace(/\/$/, "/index.html"));
      try {
        const body = readFileSync(join(outDir, relative));
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
    rmSync(outDir, { recursive: true, force: true });
  });

  const openOffline = async (page: Page, random: number[]) => {
    await page.goto(`${host}/PandaJump/?clock=manual&random=${random.join(",")}`);
    await page.waitForFunction(() => window.pandaJump?.game.scene.isActive("run"));
  };

  const activeWorkerState = (page: Page) =>
    page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration.active?.state ?? null;
    });

  test("Visiting the built site registers an active service worker", async ({ page }) => {
    await openOffline(page, oneBox);
    const registrations = await page.evaluate(() => navigator.serviceWorker.getRegistrations());
    expect(registrations.length).toBeGreaterThan(0);
    expect(await activeWorkerState(page)).toBe("activated");
  });

  test("Reloading offline after one visit still plays a full run to game over", async ({ page, context }) => {
    test.setTimeout(60_000);
    await openOffline(page, oneBox);
    await activeWorkerState(page);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    await context.setOffline(true);
    const responses: Response[] = [];
    page.on("response", (response) => responses.push(response));

    await page.reload();
    await page.waitForFunction(() => window.pandaJump?.game.scene.isActive("run"));
    await page.evaluate(installProbe);
    await startRun(page);

    await advanceTo(page, 1600);
    expect(columnsAt(await sample(page)).length).toBeGreaterThan(0);

    await play(page, [2700], 3340);
    expect((await sample(page)).score.text).toBe("1");

    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverTitle.text).toBe("Game over");
    expect(diedAt.gameOverTitle.visible).toBe(true);

    await context.setOffline(false);
    const networkResponses = responses.filter((response) => response.url().startsWith("http"));
    expect(networkResponses.length).toBeGreaterThan(0);
    expect(networkResponses.every((response) => response.fromServiceWorker())).toBe(true);
  });

  test("The generated service worker's cache name changes when the built output changes", () => {
    const swPath = join(outDir, "sw.js");
    const manifestPath = join(outDir, "manifest.json");
    const before = readFileSync(swPath, "utf8");
    const originalManifest = readFileSync(manifestPath, "utf8");
    try {
      writeFileSync(manifestPath, `${originalManifest} `);
      execSync(`node scripts/generate-sw.mjs ${OUT_DIR}`, { stdio: "ignore" });
      expect(readFileSync(swPath, "utf8")).not.toBe(before);
    } finally {
      writeFileSync(manifestPath, originalManifest);
      execSync(`node scripts/generate-sw.mjs ${OUT_DIR}`, { stdio: "ignore" });
    }
  });

  test("A revisit after a redeploy serves the new build and drops the previous cache", async ({ page }) => {
    test.setTimeout(30_000);
    await openOffline(page, oneBox);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const before = await page.evaluate(() => caches.keys());
    expect(before).toHaveLength(1);

    const manifestPath = join(outDir, "manifest.json");
    const originalManifest = readFileSync(manifestPath, "utf8");
    const mutatedManifest = `${originalManifest} `;
    try {
      writeFileSync(manifestPath, mutatedManifest);
      execSync(`node scripts/generate-sw.mjs ${OUT_DIR}`, { stdio: "ignore" });

      const documentLoads: Response[] = [];
      page.on("response", (response) => {
        if (response.request().resourceType() === "document") documentLoads.push(response);
      });

      await page.reload();
      await expect.poll(() => documentLoads.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
      await page.waitForFunction(() => window.pandaJump?.game.scene.isActive("run"));

      const after = await page.evaluate(() => caches.keys());
      expect(after).toHaveLength(1);
      expect(after[0]).not.toBe(before[0]);

      const manifestText = await page.evaluate(async () => (await fetch("manifest.json")).text());
      expect(manifestText).toBe(mutatedManifest);
    } finally {
      writeFileSync(manifestPath, originalManifest);
      execSync(`node scripts/generate-sw.mjs ${OUT_DIR}`, { stdio: "ignore" });
    }
  });

  test("A new deploy's service worker does not reload the page in the middle of a run", async ({ page }) => {
    test.setTimeout(30_000);
    await openOffline(page, oneBox);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.evaluate(installProbe);
    await startRun(page);
    await advanceTo(page, 1000);
    await page.evaluate(() => {
      Object.assign(window, { survivedUpdate: true });
      Object.assign(window, {
        controllerChanged: new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            resolve();
          });
        }),
      });
    });

    const manifestPath = join(outDir, "manifest.json");
    const originalManifest = readFileSync(manifestPath, "utf8");
    try {
      writeFileSync(manifestPath, `${originalManifest} `);
      execSync(`node scripts/generate-sw.mjs ${OUT_DIR}`, { stdio: "ignore" });

      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        await (window as unknown as { controllerChanged: Promise<void> }).controllerChanged;
      });
      await page.waitForTimeout(1500);

      const state = await page.evaluate(() => ({
        survived: (window as unknown as { survivedUpdate?: boolean }).survivedUpdate,
        view: window.pandaJump?.run.view(),
      }));
      expect(state.survived).toBe(true);
      expect(state.view?.ready).toBe(false);
      expect(state.view?.gameOver).toBe(false);
      expect(state.view?.time).toBe(1000);
    } finally {
      writeFileSync(manifestPath, originalManifest);
      execSync(`node scripts/generate-sw.mjs ${OUT_DIR}`, { stdio: "ignore" });
    }
  });
});

test.describe("Rule: The unbuilt dev server never registers a service worker", () => {
  test("Running npm run dev does not install an offline cache", async ({ page }) => {
    await openGame(page, oneBox);
    const registrations = await page.evaluate(() => navigator.serviceWorker.getRegistrations());
    expect(registrations).toHaveLength(0);
  });
});
