export const fixtureVideo = (id = "abcdefghijk") => ({
  id,
  snippet: {
    title: "React tutorial",
    channelTitle: "Creator",
    channelId: "UCabcdefghijklmnopqrstuv",
    categoryId: "28",
    publishedAt: "2026-10-01T00:00:00Z",
    description: "A real API description",
    tags: ["react"],
  },
  statistics: { viewCount: "12345" },
  contentDetails: { duration: "PT1H2M3S" },
  status: { privacyStatus: "public", embeddable: true },
});
