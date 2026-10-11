import { describe, expect, it } from "vitest";
import { mockVideos } from "../data/mockVideos";
import {
  preferredTopics,
  recommendVideos,
  type Preferences,
} from "./recommendations";
const blank: Preferences = {
  liked: [],
  history: [],
  subscriptions: [],
  interests: [],
};
describe("Viewly preferences", () => {
  it("prioritizes selected interests and inferred liked topics", () => {
    const preferences = {
      ...blank,
      interests: ["Programming" as const],
      liked: [mockVideos[6].id],
    };
    expect(preferredTopics(mockVideos, preferences)).toEqual([
      "Programming",
      "Music",
    ]);
    expect(recommendVideos(mockVideos, preferences)[0].category).toBe(
      "Programming",
    );
  });
  it("moves watched videos behind unseen discoveries", () => {
    const videos = mockVideos.slice(0, 3);
    expect(
      recommendVideos(videos, { ...blank, history: [videos[0].id] }).at(-1)?.id,
    ).toBe(videos[0].id);
  });
  it("diversifies creators, deduplicates IDs, and applies a limit", () => {
    const videos = Array.from({ length: 5 }, (_, i) => ({
      ...mockVideos[0],
      id: String(i).padStart(11, "0"),
      channel: i === 4 ? "Other creator" : "Same creator",
    }));
    const result = recommendVideos([...videos, videos[0]], blank, 4);
    expect(result).toHaveLength(4);
    expect(new Set(result.map((video) => video.id)).size).toBe(4);
    expect(result[2].channel).toBe("Other creator");
  });
});
