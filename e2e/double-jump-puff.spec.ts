import { expect, test } from "@playwright/test";
import { advanceTo, at, oneBox, openGame, pixelRows, pressSpace, sample } from "./probe.ts";

const WHITE = [255, 255, 255];

const isWhite = (pixel: number[]) => pixel.every((value) => Math.abs(value - (WHITE[0] ?? 0)) <= 4);

test.describe("Rule: The puff appears only when the air jump actually fires", () => {
  test("A single floor jump never shows a puff", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    expect((await sample(page)).viewAirPuff).toBeNull();
    await advanceTo(page, 290);
    expect((await sample(page)).viewAirPuff).toBeNull();
    await advanceTo(page, 580);
    expect((await sample(page)).viewAirPuff).toBeNull();
    await advanceTo(page, 1160);
    const landed = await sample(page);
    expect(landed.viewAirPuff).toBeNull();
    expect(landed.airPuff.visible).toBe(false);
  });
});

test.describe("Rule: A second tap while airborne marks the moment the air jump fires", () => {
  test("The puff appears at the panda's feet, fully opaque, then fades to gone over 250ms", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    await advanceTo(page, 580);
    await pressSpace(page);
    const atJump = await sample(page);
    expect(atJump.viewAirPuff).toMatchObject({ x: 112.5, alpha: 1 });
    expect(atJump.viewAirPuff?.y).toBeCloseTo(257.8);
    expect(atJump.airPuff).toMatchObject({ x: 112.5, alpha: 1, visible: true });

    const centerY = atJump.viewAirPuff?.y ?? 0;
    const rows = await pixelRows(page, [Math.round(centerY), Math.round(centerY + 7), Math.round(centerY + 9)]);
    expect(isWhite(at(at(rows, 0), 113))).toBe(true);
    expect(isWhite(at(at(rows, 1), 113))).toBe(true);
    expect(isWhite(at(at(rows, 2), 113))).toBe(false);

    await advanceTo(page, 705);
    const fading = await sample(page);
    expect(fading.viewAirPuff?.alpha).toBeCloseTo(0.5);
    expect(fading.viewAirPuff).toMatchObject({ x: 112.5 });
    expect(fading.viewAirPuff?.y).toBeCloseTo(257.8);

    await advanceTo(page, 830);
    const gone = await sample(page);
    expect(gone.viewAirPuff).toBeNull();
    expect(gone.airPuff.visible).toBe(false);
  });
});

test.describe("Rule: A third tap in the air, with the air jump already used, shows no new puff", () => {
  test("The puff already showing keeps fading on its original schedule", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    await advanceTo(page, 580);
    await pressSpace(page);
    await advanceTo(page, 680);
    const beforeThirdTap = (await sample(page)).viewAirPuff;
    await pressSpace(page);
    expect((await sample(page)).viewAirPuff).toEqual(beforeThirdTap);
    await advanceTo(page, 830);
    expect((await sample(page)).viewAirPuff).toBeNull();
  });
});
