import { describe, expect, it } from "vitest";
import { extractYouTubeId } from "./youtube";

describe("YouTube URL validation", () => {
  const id = "dQw4w9WgXcQ";
  it.each([
    `https://youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?list=demo&v=${id}&t=42`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=tracking`,
    `https://www.youtu.be/${id}`,
    `https://youtube.com/shorts/${id}?feature=share`,
    `https://youtube.com/embed/${id}`,
    `https://youtube.com/live/${id}?t=123`,
    `  https://youtube.com/watch?v=${id}  `,
  ])("extracts an ID from %s", (url) => expect(extractYouTubeId(url)).toBe(id));
  it.each([
    "",
    id,
    "not a URL",
    `javascript:alert('${id}')`,
    `ftp://youtube.com/watch?v=${id}`,
    `https://youtube.com.evil.test/watch?v=${id}`,
    `https://evil-youtube.com/watch?v=${id}`,
    `https://youtube.com@evil.test/watch?v=${id}`,
    `https://user:password@youtube.com/watch?v=${id}`,
    `https://youtube.com:8080/watch?v=${id}`,
    `https://youtube.com/watch?v=short`,
    `https://youtube.com/watch?v=${id}extra`,
    `https://youtube.com/watch?v=abcdefghij!`,
    `https://youtube.com/playlist?list=${id}`,
    `https://youtu.be/${id}/extra`,
    `https://youtube.com/shorts/${id}/extra`,
  ])("rejects %s", (url) => expect(() => extractYouTubeId(url)).toThrow());
});
