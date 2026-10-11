import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.VIEWLY_URL || "http://127.0.0.1:5173";
await mkdir("test-results/visual", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 768, 1024],
    ["compact", 320, 740],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(baseURL);
    await page.locator(".video-card").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll(".video-thumbnail"))
          .filter((image) => image.getBoundingClientRect().top < innerHeight)
          .every(
            (image) => image instanceof HTMLImageElement && image.complete,
          ),
      undefined,
      { timeout: 15000 },
    );
    await page.screenshot({ path: `test-results/visual/${name}.png` });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw new Error(`Horizontal overflow at ${width}px`);
    if (name === "desktop") {
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
      await page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
      await page.screenshot({ path: "test-results/visual/desktop-dark.png" });
      await page.getByRole("button", { name: "Switch to light theme" }).click();
    }
    if (name === "mobile") {
      await page
        .getByRole("button", { name: "Import video", exact: true })
        .first()
        .click();
      await page.screenshot({ path: "test-results/visual/mobile-import.png" });
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Desktop, tablet, mobile, dark theme, and import dialog captured. No page errors or horizontal overflow.",
  );
} finally {
  await browser.close();
}
