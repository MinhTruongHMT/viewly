import { NavLink } from "react-router-dom";
import {
  Home,
  Clapperboard,
  Users,
  History,
  Clock,
  ThumbsUp,
  ListVideo,
  Compass,
  Settings,
  ChevronRight,
  Plus,
  X,
  Play,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useUIStore } from "../../store/useUIStore";
import { Avatar } from "../ui/Avatar";
import { Modal } from "../ui/Modal";

const groups: { label: string; icon: LucideIcon; to: string }[][] = [
  [
    { label: "Home", icon: Home, to: "/" },
    { label: "Shorts", icon: Clapperboard, to: "/shorts" },
    { label: "Subscriptions", icon: Users, to: "/subscriptions" },
  ],
  [
    { label: "History", icon: History, to: "/history" },
    { label: "Watch later", icon: Clock, to: "/watch-later" },
    { label: "Liked videos", icon: ThumbsUp, to: "/liked" },
    { label: "Playlists", icon: ListVideo, to: "/playlists" },
  ],
  [
    { label: "Explore", icon: Compass, to: "/explore" },
    { label: "Settings", icon: Settings, to: "/settings" },
  ],
];
function Navigation() {
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const close = useUIStore((state) => state.closeMobileNav);
  const subscriptions = useAppStore((state) => state.subscriptions);
  const setImportOpen = useUIStore((state) => state.setImportOpen);
  return (
    <>
      <nav aria-label="Main navigation">
        {groups.map((group, index) => (
          <div className="nav-group" key={index}>
            {index === 1 && (
              <p className="nav-section-title">
                YOUR LIBRARY <ChevronRight size={13} />
              </p>
            )}
            {group.map(({ label, icon: Icon, to }) => (
              <NavLink
                title={collapsed ? label : undefined}
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={close}
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-subscriptions">
        <p className="nav-section-title">SUBSCRIPTIONS</p>
        {subscriptions.length ? (
          subscriptions.slice(0, 5).map((channel) => (
            <NavLink
              className="channel-link"
              onClick={close}
              to={`/subscriptions?channel=${encodeURIComponent(channel)}`}
              key={channel}
            >
              <Avatar name={channel} small />
              <span>{channel}</span>
              <span className="channel-dot" />
            </NavLink>
          ))
        ) : (
          <p className="sidebar-hint">
            Your favorite creators,
            <br />
            all in one place.
          </p>
        )}
      </div>
      <div className="sidebar-card">
        <span className="sidebar-card-icon">
          <Play size={19} />
        </span>
        <strong>Make it your own.</strong>
        <p>Bring your favorite YouTube videos into Viewly.</p>
        <button
          className="button"
          onClick={() => {
            close();
            setImportOpen(true);
          }}
        >
          <Plus size={16} />
          Import a video
        </button>
      </div>
      <div className="sidebar-footer">
        <span>Made for the curious.</span>
        <p>Local demo · No account needed</p>
        <span>© 2026 Viewly</span>
      </div>
    </>
  );
}
export function Sidebar() {
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const mobileOpen = useUIStore((state) => state.mobileNavOpen);
  const close = useUIStore((state) => state.closeMobileNav);
  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <Navigation />
      </aside>
      <Modal open={mobileOpen} onClose={close} title="Explore Viewly">
        <div className="mobile-navigation">
          <Navigation />
        </div>
        <button className="button drawer-close" onClick={close}>
          <X size={16} />
          Close navigation
        </button>
      </Modal>
    </>
  );
}
