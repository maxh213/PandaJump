import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceTo, columnsAt, openGame, oneBox, play, sample, untilGameOver } from "./probe.ts";

const seedBest = (page: Page, value: number) =>
  page.addInitScript((seeded) => {
    localStorage.setItem("pandaJump.best", String(seeded));
  }, value);

test.describe("Rule: The marker sits over the column whose clearing would beat the stored best", () => {
  test("No marker shows before that column has spawned", async ({ page }) => {
    await seedBest(page, 1);
    await openGame(page, oneBox);
    await advanceTo(page, 1600);
    expect((await sample(page)).bestMarker.visible).toBe(false);
  });

  test("The marker appears over that column once it spawns, and moves left with it", async ({ page }) => {
    await seedBest(page, 1);
    await openGame(page, oneBox);
    await play(page, [2700], 3100);
    const marked = await sample(page);
    const column = columnsAt(marked).find((entry) => entry.x === 380);
    expect(column).toBeDefined();
    expect(marked.bestMarker).toMatchObject({
      visible: true,
      text: "Best",
      color: "#ffd700",
      fontSize: "16px",
      originX: 0.5,
      originY: 1,
      x: (column?.x ?? 0) + 32,
      y: (column?.boxes[0]?.y ?? 0) - 8,
    });
    await advanceTo(page, 3600);
    const later = await sample(page);
    expect(later.bestMarker.visible).toBe(true);
    expect(later.bestMarker.x).toBeLessThan(marked.bestMarker.x);
  });
});

test.describe("Rule: The marker disappears once the run overtakes the stored best", () => {
  test("Clearing the marked column takes the score past the stored best and hides the marker", async ({ page }) => {
    await seedBest(page, 1);
    await openGame(page, oneBox);
    await play(page, [2700, 4200], 4900);
    expect((await sample(page)).score.text).toBe("2");
    expect((await sample(page)).bestMarker.visible).toBe(false);
  });
});

test.describe("Rule: With no stored best, the marker never appears", () => {
  test("A run with no stored best never shows a marker, even as columns spawn and the panda dies", async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await advanceTo(page, 1600);
    expect((await sample(page)).bestMarker.visible).toBe(false);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.score.text).toBe("0");
    expect(diedAt.bestMarker.visible).toBe(false);
  });
});
