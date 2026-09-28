import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceTo, oneBox, openGame, play, sample, untilRestart } from "./probe.ts";

const seedBest = (page: Page, value: number) =>
  page.addInitScript((seeded) => {
    localStorage.setItem("pandaJump.best", String(seeded));
  }, value);

test.describe("Rule: The callout fires the instant the live score first overtakes the stored best", () => {
  test("A first-time player's first cleared column triggers the callout, since the stored best was 0", async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 3300);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 0", color: "#ffffff" });
    await advanceTo(page, 3340);
    expect(await sample(page)).toMatchObject({
      score: { text: "1" },
      best: { text: "Best: 1", color: "#ffd700" },
      restarts: 0,
    });
    await advanceTo(page, 3700);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 1", color: "#ffd700" });
    await advanceTo(page, 4000);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 1", color: "#ffffff" });
  });

  test("A returning player beating a non-zero stored best also gets the callout", async ({ page }) => {
    await seedBest(page, 5);
    await openGame(page, oneBox);
    await play(page, [2700, 4200, 5700, 7200, 8700], 10150);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 5", color: "#ffffff" });
    await play(page, [10200], 10840);
    expect(await sample(page)).toMatchObject({ score: { text: "6" }, best: { text: "Best: 6", color: "#ffd700" } });
  });
});

test.describe("Rule: The callout fires at most once per run", () => {
  test("Clearing a further column after already holding the best does not retrigger the callout", async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 3340);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 1", color: "#ffd700" });
    await advanceTo(page, 4000);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 1", color: "#ffffff" });
    await play(page, [4200], 4840);
    expect(await sample(page)).toMatchObject({
      score: { text: "2" },
      best: { text: "Best: 2", color: "#ffffff" },
      restarts: 0,
    });
  });
});

test.describe("Rule: Dying and restarting resets the callout state", () => {
  test("A later run beating the now-higher stored best triggers the callout again", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 3340);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 1", color: "#ffd700" });
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    expect(restart.after).toMatchObject({ score: { text: "0" }, best: { text: "Best: 1", color: "#ffffff" } });
    await play(page, [2700], 3340);
    expect((await sample(page)).best).toMatchObject({ text: "Best: 1", color: "#ffffff" });
    await play(page, [4200], 4840);
    expect(await sample(page)).toMatchObject({ score: { text: "2" }, best: { text: "Best: 2", color: "#ffd700" } });
  });
});
