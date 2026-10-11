import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Menu,
  Search,
  Plus,
  Bell,
  Moon,
  Sun,
  X,
  ArrowLeft,
  Play,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useUIStore } from "../../store/useUIStore";
import { Modal } from "../ui/Modal";
import { GoogleConnection } from "../google/GoogleConnection";
import { useAuthStore } from "../../store/useAuthStore";

export function Header() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mobileSearch, setMobileSearch] = useState(false);
  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setImportOpen = useUIStore((state) => state.setImportOpen);
  const profile = useAuthStore((state) => state.profile);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = String(
      new FormData(event.currentTarget).get("search") ?? "",
    ).trim();
    if (query) {
      const next = new URLSearchParams({ search_query: query });
      const source = params.get("source");
      if (source === "library" || source === "youtube") next.set("source", source);
      navigate(`/results?${next.toString()}`);
      setMobileSearch(false);
    }
  };
  return (
    <>
      <header className={`header ${mobileSearch ? "mobile-search-open" : ""}`}>
        <div className="header-brand">
          <button
            className="icon-button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
          >
            <Menu size={22} />
          </button>
          <Link className="brand" to="/" aria-label="Viewly home">
            <span className="brand-mark">
              <Play size={20} fill="currentColor" />
            </span>
            viewly<span className="brand-dot">.</span>
          </Link>
        </div>
        <form
          className="search-form"
          role="search"
          onSubmit={submit}
          key={params.get("search_query") ?? ""}
        >
          {mobileSearch && (
            <button
              type="button"
              className="icon-button mobile-back"
              aria-label="Close search"
              onClick={() => setMobileSearch(false)}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Search size={18} className="search-leading" />
          <input
            name="search"
            type="search"
            aria-label="Search videos"
            placeholder="Find your next rabbit hole"
            defaultValue={params.get("search_query") ?? ""}
            maxLength={200}
            autoFocus={mobileSearch}
          />
          <button className="search-submit" aria-label="Search" type="submit">
            <Search size={20} />
          </button>
        </form>
        <div className="header-actions">
          <button
            className="icon-button mobile-search-trigger"
            aria-label="Open search"
            onClick={() => setMobileSearch(true)}
          >
            <Search size={21} />
          </button>
          <button
            className="button create-button"
            aria-label="Import video"
            onClick={() => setImportOpen(true)}
          >
            <Plus size={19} />
            <span>Import video</span>
          </button>
          <button
            className="icon-button theme-toggle"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            onClick={toggleTheme}
          >
            {theme === "light" ? <Moon size={21} /> : <Sun size={21} />}
          </button>
          <button
            className="icon-button notification-button"
            aria-label="Notifications"
            onClick={() => setPanel("notifications")}
          >
            <Bell size={21} />
            <span className="notification-dot" />
          </button>
          <button
            className="profile-avatar"
            aria-label="Tài khoản Google"
            onClick={() => setPanel("profile")}
          >
            {profile?.name[0]?.toUpperCase() ?? "J"}
          </button>
        </div>
      </header>
      <Modal
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={
          panel === "notifications"
            ? "You’re all caught up"
            : "Your little corner of Viewly"
        }
      >
        {panel === "notifications" ? (
          <p className="muted">
            No new notifications. Find something worth watching today.
          </p>
        ) : (
          <GoogleConnection onNavigate={() => setPanel(null)} />
        )}
        <button className="button primary mt-6" onClick={() => setPanel(null)}>
          <X size={16} />
          Close
        </button>
      </Modal>
    </>
  );
}
