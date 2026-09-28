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

const cornersAndBelowContent = (width: number, height: number, belowContentY: number) => [
  { x: 0, y: 0 },
  { x: width - 1, y: 0 },
  { x: 0, y: height - 1 },
  { x: width - 1, y: height - 1 },
  { x: Math.floor(width / 2), y: belowContentY },
];

const rootBackgroundsAndBodyMargin = (page: Page) =>
  page.evaluate(() => ({
    htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    bodyMarginTop: getComputedStyle(document.body).marginTop,
  }));

test.describe("Rule: The page has no default-coloured margin or gap anywhere", () => {
  test.describe("A small phone-sized viewport is solid black at every corner and below the content", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("A small phone-sized viewport is solid black at every corner and below the content", async ({ page }) => {
      await page.goto("./");
      const pixels = await pixelsAt(page, cornersAndBelowContent(375, 812, 750));
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

  test.describe("A viewport taller than the page's content is solid black at every corner and below the content", () => {
    test.use({ viewport: { width: 1024, height: 1400 } });

    test("A viewport taller than the page's content is solid black at every corner and below the content", async ({ page }) => {
      await page.goto("./");
      const pixels = await pixelsAt(page, cornersAndBelowContent(1024, 1400, 1000));
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

test.describe("Rule: iOS's standalone status bar matches the page's black theme", () => {
  test("index.html sets the apple-mobile-web-app-status-bar-style meta tag to black-translucent", async ({
    page,
  }) => {
    await page.goto("./");
    const statusBarStyle = await page.evaluate(
      () => document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute("content") ?? "",
    );
    expect(statusBarStyle).toBe("black-translucent");
  });
});
