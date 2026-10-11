export const categories = [
  "All",
  "Music",
  "Gaming",
  "Programming",
  "Technology",
  "Live",
  "Podcasts",
  "Education",
  "Other",
] as const;
export type Category = Exclude<(typeof categories)[number], "All">;
export interface Video {
  id: string;
  title: string;
  channel: string;
  category: Category;
  thumbnail: string;
  avatarColor: string;
  views: number;
  publishedAt: string;
  duration?: string;
  description: string;
  imported?: boolean;
  short?: boolean;
  source?: "youtube";
  channelId?: string;
  categoryId?: string;
  tags?: string[];
}
export interface Playlist {
  id: string;
  name: string;
  videoIds: string[];
}
export interface Comment {
  id: string;
  author: string;
  text: string;
  time: string;
  likes: number;
}
