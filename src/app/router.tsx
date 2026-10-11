import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";

const HomePage = lazy(() => import("../pages/HomePage"));
const WatchPage = lazy(() => import("../pages/WatchPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const LibraryPage = lazy(() => import("../pages/LibraryPage"));
const PlaylistPage = lazy(() => import("../pages/PlaylistPage"));
const ShortsPage = lazy(() => import("../pages/ShortsPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const SubscriptionsPage = lazy(() => import("../pages/SubscriptionsPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/watch", element: <WatchPage /> },
      { path: "/results", element: <SearchPage /> },
      { path: "/shorts", element: <ShortsPage /> },
      { path: "/history", element: <LibraryPage kind="history" /> },
      { path: "/watch-later", element: <LibraryPage kind="later" /> },
      { path: "/liked", element: <LibraryPage kind="liked" /> },
      { path: "/subscriptions", element: <SubscriptionsPage /> },
      { path: "/playlists", element: <PlaylistPage /> },
      { path: "/playlists/:playlistId", element: <PlaylistPage /> },
      { path: "/explore", element: <HomePage explore /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
