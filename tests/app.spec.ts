import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Deterministic player fixture: real external media availability is outside this frontend's control.
  await page.route("**/i.ytimg.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#677864"/></svg>',
    }),
  );
  await page.route("**/www.youtube.com/iframe_api", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.YT={Player: function(iframe, config) { const listener = e => { if(e.source===iframe.contentWindow && e.data==='fixture-play') config.events.onStateChange({data:1}); }; window.addEventListener('message',listener); this.destroy=()=>{window.removeEventListener('message',listener);iframe.remove()};this.getIframe=()=>iframe;setTimeout(()=>{config.events.onReady();if(iframe.src.includes('abcdefghijk'))config.events.onError({data:150})},50); }};window.onYouTubeIframeAPIReady?.();`,
    }),
  );
  await page.route("**/www.youtube.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body style=\"background:#131713;color:white;display:grid;place-items:center;height:90vh\"><button onclick=\"parent.postMessage('fixture-play','*')\">Play fixture video</button></body></html>",
    }),
  );
  await page.route("**/fonts.googleapis.com/**", (route) => route.abort());
  await page.goto("/");
});

test("browse, filter, search, and use mobile navigation", async ({
  page,
  isMobile,
}) => {
  await expect(page.locator(".video-card")).toHaveCount(26);
  await page.getByRole("button", { name: "Programming", exact: true }).click();
  await expect(page.locator(".video-card")).toHaveCount(6);
  if (isMobile)
    await page
      .getByRole("button", { name: "Open search", exact: true })
      .click();
  await page.getByRole("searchbox", { name: "Search videos" }).fill("REACT");
  await page.getByRole("searchbox", { name: "Search videos" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Results for “REACT”" }),
  ).toBeVisible();
  await expect(page.locator(".video-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find your next favorite" }),
  ).toBeVisible();
  if (isMobile)
    await page
      .getByRole("button", { name: "Toggle navigation", exact: true })
      .click();
  await page
    .getByRole("link", { name: "Watch later", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good things can wait" }),
  ).toBeVisible();
  if (!isMobile) {
    await page
      .getByRole("button", { name: "Toggle navigation", exact: true })
      .click();
    await expect(page.locator("aside.sidebar")).toHaveClass(/collapsed/);
    await expect(page.locator("main")).toHaveClass(/expanded/);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("import validation, persistence, duplicate prevention, and removal", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Import video", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("YouTube URL")
    .fill("https://youtube.com.evil.test/watch?v=abcdefghijk");
  await dialog
    .getByLabel("Video title", { exact: true })
    .fill("My imported video");
  await dialog.getByLabel("Channel name").fill("My creator");
  await dialog
    .getByRole("button", { name: "Import video", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "youtube.com or youtu.be",
  );
  await dialog
    .getByLabel("YouTube URL")
    .fill("https://youtu.be/abcdefghijk?si=tracking");
  await dialog
    .getByRole("button", { name: "Import video", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".video-card")).toHaveCount(27);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "My imported video", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Import video", exact: true })
    .first()
    .click();
  await dialog
    .getByLabel("YouTube URL")
    .fill("https://youtube.com/shorts/abcdefghijk");
  await dialog.getByLabel("Video title", { exact: true }).fill("Duplicate");
  await dialog.getByLabel("Channel name").fill("My creator");
  await dialog
    .getByRole("button", { name: "Import video", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "already in your library",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("link", { name: "My imported video", exact: true })
    .click();
  await expect(
    page.getByText(
      "The creator has disabled embedded playback for this video.",
    ),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Options for My imported video", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove import", exact: true })
    .click();
  await expect(page.locator(".video-card")).toHaveCount(26);
  await page.reload();
  await expect(page.locator(".video-card")).toHaveCount(26);
});

test("likes, saves, subscriptions, history, playlists and theme survive reload", async ({
  page,
}) => {
  await page
    .getByRole("link", { name: "React in 100 Seconds", exact: true })
    .click();
  await expect(page.locator(".player-host iframe")).toBeVisible();
  const before = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("viewly-library") ?? '{"state":{"history":[]}}',
      ).state.history,
  );
  expect(before).toEqual([]);
  await page
    .frameLocator(".player-host iframe")
    .getByRole("button", { name: "Play fixture video" })
    .click();
  await page.getByRole("button", { name: "Like", exact: true }).click();
  await page.getByRole("button", { name: "Watch later", exact: true }).click();
  await page.getByRole("button", { name: "Subscribe", exact: true }).click();
  await page.getByRole("button", { name: "Playlist", exact: true }).click();
  await page
    .getByRole("textbox", { name: "New playlist name" })
    .fill("Weekend learning");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Switch to dark theme", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Liked", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Subscribed", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/history");
  await expect(
    page.getByRole("link", { name: "React in 100 Seconds", exact: true }),
  ).toBeVisible();
  await page.goto("/playlists");
  await page.getByRole("heading", { name: "Weekend learning" }).click();
  await expect(
    page.getByRole("link", { name: "React in 100 Seconds", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove from playlist", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Room for your next favorites" }),
  ).toBeVisible();
});

test("Shorts navigation and missing routes", async ({ page }) => {
  await page.goto("/shorts");
  await expect(page.getByText("Shorts · 1 of 3 · Local demo")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous short", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next short", exact: true }).click();
  await expect(page.getByText("Shorts · 2 of 3 · Local demo")).toBeVisible();
  await page.getByRole("button", { name: "Like short", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unlike short", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Show short comments", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/watch?v=missing");
  await expect(
    page.getByRole("heading", { name: "We couldn’t find that video" }),
  ).toBeVisible();
  await page.goto("/unknown-route");
  await expect(
    page.getByRole("heading", { name: "A little off the beaten path" }),
  ).toBeVisible();
});
