import { test, expect, type Page } from "@playwright/test";
import { fixtureVideo } from "../tests/fixtures/youtube";
const channelOne = "UC" + "a".repeat(22),
  channelTwo = "UC" + "b".repeat(22);
const video = (id: string, title: string, channelId = channelOne) => ({
  ...fixtureVideo(id),
  snippet: {
    ...fixtureVideo(id).snippet,
    title,
    channelId,
    channelTitle: channelId === channelOne ? "Creator One" : "Creator Two",
  },
});
async function prepare(page: Page) {
  await page.route("**/fonts.googleapis.com/**", (route) => route.abort());
  await page.route("**/i.ytimg.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#677864"/></svg>',
    }),
  );
  await page.route("**/accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.google={accounts:{oauth2:{initTokenClient:c=>({requestAccessToken:()=>setTimeout(()=>c.callback({access_token:'fixture-access-token',expires_in:3600,scope:'https://www.googleapis.com/auth/youtube.readonly'}),20)}),hasGrantedAllScopes:()=>true,revoke:(token,callback)=>callback()}}};`,
    }),
  );
  await page.route("**/www.googleapis.com/oauth2/v3/userinfo", (route) =>
    route.fulfill({
      json: { name: "Fixture account", email: "fixture@example.test" },
    }),
  );
  await page.route("**/www.googleapis.com/youtube/v3/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/subscriptions"))
      return route.fulfill({
        json: url.searchParams.get("pageToken")
          ? {
              items: [
                {
                  snippet: {
                    title: "Creator Two",
                    resourceId: { channelId: channelTwo },
                  },
                },
              ],
            }
          : {
              items: [
                {
                  snippet: {
                    title: "Creator One",
                    resourceId: { channelId: channelOne },
                  },
                },
              ],
              nextPageToken: "channels-next",
            },
      });
    if (url.pathname.endsWith("/channels"))
      return route.fulfill({
        json: {
          items: [
            {
              contentDetails: {
                relatedPlaylists: {
                  uploads:
                    url.searchParams.get("id") === channelTwo
                      ? "uploads-two"
                      : "uploads-one",
                },
              },
            },
          ],
        },
      });
    if (url.pathname.endsWith("/playlistItems"))
      return route.fulfill({
        json: {
          items: [
            {
              contentDetails: {
                videoId:
                  url.searchParams.get("playlistId") === "uploads-two"
                    ? "subscribed2"
                    : "subscribed1",
              },
            },
          ],
        },
      });
    if (url.pathname.endsWith("/search"))
      return route.fulfill({
        json: { items: [{ id: { videoId: "personal001" } }] },
      });
    const ids = url.searchParams.get("id");
    if (ids)
      return route.fulfill({
        json: {
          items: ids
            .split(",")
            .map((id) =>
              video(
                id,
                id === "personal001"
                  ? "TypeScript for your interests"
                  : id === "subscribed1"
                    ? "Latest from Creator One"
                    : "Latest from Creator Two",
                id === "subscribed2" ? channelTwo : channelOne,
              ),
            ),
        },
      });
    return route.fulfill({
      json: url.searchParams.get("pageToken")
        ? {
            items: [
              video("popular0001", "React popular one"),
              video("popular0002", "React popular two"),
            ],
          }
        : {
            items: [video("popular0001", "React popular one")],
            nextPageToken: "popular-next",
          },
    });
  });
}
test.beforeEach(async ({ page }) => {
  await prepare(page);
  await page.goto("/");
});

test("real metadata, pagination, saves after refresh, and personal discovery", async ({
  page,
}) => {
  await expect(
    page.getByRole("link", { name: "React popular one", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".video-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Tải thêm video", exact: true })
    .click();
  await expect(page.locator(".video-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Options for React popular two", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save to Watch later", exact: true })
    .click();
  await page.goto("/watch-later");
  await expect(
    page.getByRole("link", { name: "React popular two", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "React popular two", exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Dành cho bạn", exact: true }).click();
  await page
    .getByRole("group", { name: "Sở thích của bạn" })
    .getByRole("button", { name: "Programming", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tìm video theo sở thích", exact: true })
    .click();
  await expect(
    page.getByRole("link", {
      name: "TypeScript for your interests",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Google connection, subscriptions pagination and private cleanup on logout", async ({
  page,
}) => {
  await page.goto("/subscriptions");
  await page
    .getByRole("button", { name: "Kết nối Google", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Latest from Creator One", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tải thêm kênh đã đăng ký", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Latest from Creator Two", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Lọc theo kênh" })
    .selectOption(channelTwo);
  await expect(page.locator(".video-card")).toHaveCount(1);
  const stored = await page.evaluate(() =>
    JSON.stringify(
      Object.fromEntries(
        Object.keys(localStorage).map((key) => [
          key,
          localStorage.getItem(key),
        ]),
      ),
    ),
  );
  expect(stored).not.toContain("fixture-access-token");
  expect(stored).not.toContain("fixture@example.test");
  expect(stored).not.toContain(channelTwo);
  await page
    .getByRole("button", { name: "Tài khoản Google", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fixture account", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ngắt kết nối", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: "Latest from Creator Two", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Kết nối Google", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Kết nối Google", exact: true }),
  ).toBeVisible();
});

test("quota errors leave demo usable and never silently replace real data", async ({
  page,
}) => {
  await page.route("**/www.googleapis.com/youtube/v3/videos?*", (route) =>
    route.fulfill({
      status: 403,
      json: { error: { errors: [{ reason: "quotaExceeded" }] } },
    }),
  );
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("hạn mức");
  await page
    .getByRole("button", { name: "Thư viện demo", exact: true })
    .click();
  await expect(page.locator(".video-card")).toHaveCount(26);
});

test("401 expires the account session and allows reconnecting", async ({
  page,
}) => {
  await page.goto("/subscriptions");
  await page
    .getByRole("button", { name: "Kết nối Google", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Latest from Creator One", exact: true }),
  ).toBeVisible();
  await page.route(
    "**/www.googleapis.com/youtube/v3/subscriptions?*",
    (route) =>
      route.fulfill({
        status: 401,
        json: { error: { errors: [{ reason: "authError" }] } },
      }),
  );
  await page
    .getByRole("button", { name: "Làm mới danh sách", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("hết hạn");
  await expect(
    page.getByRole("button", { name: "Kết nối Google", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".video-card")).toHaveCount(0);
  await page.unroute("**/www.googleapis.com/youtube/v3/subscriptions?*");
  await page
    .getByRole("button", { name: "Kết nối Google", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Latest from Creator One", exact: true }),
  ).toBeVisible();
});

test("search submits Unicode queries to YouTube, paginates, and opens the selected video", async ({ page, isMobile }) => {
  const queries: string[] = [];
  await page.route("**/www.googleapis.com/youtube/v3/search?*", (route) => {
    const url = new URL(route.request().url());
    queries.push(url.searchParams.get("q")!);
    return route.fulfill({ json: url.searchParams.get("pageToken")
      ? { items: [{ id: { videoId: "second00001" } }] }
      : { items: [{ id: { videoId: "personal001" } }], nextPageToken: "search-next" },
    });
  });
  if (isMobile) await page.getByRole("button", { name: "Open search", exact: true }).click();
  const input = page.getByRole("searchbox", { name: "Search videos" });
  await input.fill("nhạc Việt & chill");
  expect(queries).toEqual([]);
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Results for “nhạc Việt & chill”" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TypeScript for your interests", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tải thêm kết quả", exact: true }).click();
  await expect(page.locator(".video-card")).toHaveCount(2);
  expect(queries).toEqual(["nhạc Việt & chill", "nhạc Việt & chill"]);
  await page.getByRole("link", { name: "TypeScript for your interests", exact: true }).click();
  await expect(page).toHaveURL(/\/watch\?v=personal001/);
});

test("search errors can be retried and empty queries send no requests", async ({ page }) => {
  let requests = 0;
  await page.route("**/www.googleapis.com/youtube/v3/search?*", (route) => {
    requests++;
    return route.fulfill(requests === 1
      ? { status: 403, json: { error: { errors: [{ reason: "quotaExceeded" }] } } }
      : { json: { items: [] } });
  });
  await page.goto("/results?search_query=no-matches");
  await expect(page.getByRole("alert")).toContainText("hạn mức");
  await expect(page.getByRole("heading", { name: "No finds this time" })).toHaveCount(0);
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No finds this time" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find your next favorite" })).toBeVisible();
  expect(requests).toBe(2);
});

test("library search stays local and preserves its source for another submission", async ({ page, isMobile }) => {
  let requests = 0;
  await page.route("**/www.googleapis.com/youtube/v3/search?*", (route) => {
    requests++;
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/results?search_query=REACT&source=library");
  await expect(page.getByRole("link", { name: "React in 100 Seconds", exact: true })).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search videos" }).fill("popular");
  await page.getByRole("searchbox", { name: "Search videos" }).press("Enter");
  await expect(page).toHaveURL(/source=library/);
  await expect(page.getByRole("button", { name: "Trong thư viện", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(requests).toBe(0);
});
