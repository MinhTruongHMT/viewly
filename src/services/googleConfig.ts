export const googleConfig = {
  apiKey: (import.meta.env.VITE_YOUTUBE_API_KEY ?? "").trim(),
  clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim(),
  region: /^[A-Z]{2}$/.test(import.meta.env.VITE_YOUTUBE_REGION ?? "")
    ? import.meta.env.VITE_YOUTUBE_REGION
    : "VN",
};
export const youtubeReadScope =
  "https://www.googleapis.com/auth/youtube.readonly";
