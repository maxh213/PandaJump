import { expect, test, type Page } from "@playwright/test";

const BLACK = [0, 0, 0];

const pixelsAt = async (page: Page, points: { x: number; y: number }[]): Promise<number[][]> => {
  const shot = await page.screenshot();
  return page.evaluate(
    async ({ data, wanted }) => {
      const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("2d context is not available");
      context.drawImage(bitmap, 0, 0);
      return wanted.map(({ x, y }) => Array.from(context.getImageData(x, y, 1, 1).data.slice(0, 3)));
    },
    { data: shot.toString("base64"), wanted: points },
  );
};

const corners = (width: number, height: number) => [
  { x: 0, y: 0 },
  { x: width - 1, y: 0 },
  { x: 0, y: height - 1 },
  { x: width - 1, y: height - 1 },
];

const overscrollBehaviours = (page: Page) =>
  page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).overscrollBehaviorY,
    body: getComputedStyle(document.body).overscrollBehaviorY,
  }));

const rootBackgroundsAndBodyMargin = (page: Page) =>
  page.evaluate(() => ({
    htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    bodyMarginTop: getComputedStyle(document.body).marginTop,
  }));

test.describe("Rule: The page opts out of the browser's pull-to-refresh gesture", () => {
  test.describe("The html and body elements contain vertical overscroll instead of the default", () => {
    test("The html and body elements contain vertical overscroll instead of the default", async ({ page }) => {
      await page.goto("./");
      const behaviours = await overscrollBehaviours(page);
      expect(behaviours.html).not.toBe("auto");
      expect(behaviours.body).not.toBe("auto");
    });
  });

  test.describe("The solid black edge-to-edge page still has no visible layout regression", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("The solid black edge-to-edge page still has no visible layout regression", async ({ page }) => {
      await page.goto("./");
      const pixels = await pixelsAt(page, corners(375, 812).filter(({ y }) => y > 0));
      pixels.forEach((pixel) => {
        expect(pixel).toEqual(BLACK);
      });
      expect(await rootBackgroundsAndBodyMargin(page)).toEqual({
        htmlBackground: "rgb(0, 0, 0)",
        bodyBackground: "rgb(0, 0, 0)",
        bodyMarginTop: "0px",
      });
    });
  });
});
