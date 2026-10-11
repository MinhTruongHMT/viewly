import { useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ImportVideoModal } from "../import/ImportVideoModal";
import { PlaylistPicker } from "../ui/PlaylistPicker";
import { Toast } from "../ui/Toast";
import { useAppStore } from "../../store/useAppStore";
import { useUIStore } from "../../store/useUIStore";
import { VideoGridSkeleton } from "../video/VideoGrid";
import { GoogleSession } from "../google/GoogleConnection";

export function MainLayout() {
  const theme = useAppStore((state) => state.theme);
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const notify = useUIStore((state) => state.notify);
  const location = useLocation();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const onError = () =>
      notify(
        "Browser storage is unavailable or full. Changes will last for this session only.",
      );
    window.addEventListener("viewly-storage-error", onError);
    return () => window.removeEventListener("viewly-storage-error", onError);
  }, [notify]);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <GoogleSession />
      <Sidebar />
      <main
        id="main-content"
        className={`main-content ${collapsed ? "expanded" : ""}`}
      >
        <Suspense fallback={<VideoGridSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <ImportVideoModal />
      <PlaylistPicker />
      <Toast />
    </>
  );
}
