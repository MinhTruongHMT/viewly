import { Moon, Sun, ShieldCheck, ExternalLink } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { googleConfig } from "../services/googleConfig";
import { GoogleConnection } from "../components/google/GoogleConnection";
import { InterestPicker } from "../components/google/InterestPicker";

export default function SettingsPage() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A SPACE THAT FEELS LIKE YOU</div>
          <h1>The little details</h1>
          <p>Make Viewly feel right at home.</p>
        </div>
      </div>
      <div className="settings-stack">
        <section className="settings-card settings-integration">
          <div>
            <h2>Google / YouTube</h2>
            <p>
              Video phổ biến:{" "}
              {googleConfig.apiKey ? "đã cấu hình API key" : "chưa có API key"}{" "}
              · Đăng nhập:{" "}
              {googleConfig.clientId
                ? "đã cấu hình Client ID"
                : "chưa có Client ID"}{" "}
              · Khu vực: {googleConfig.region}
            </p>
            <p>
              Để bật dữ liệu thật, tạo Google Cloud project, bật YouTube Data
              API v3, cấu hình OAuth cho ứng dụng web và điền các giá trị vào
              .env.local. Xem README để làm từng bước; khởi động lại Vite sau
              khi cấu hình.
            </p>
          </div>
          <GoogleConnection />
        </section>
        <section className="settings-card">
          <InterestPicker />
        </section>
        <section className="settings-card">
          <div>
            <h2>Appearance</h2>
            <p>Choose the mood. Your preference stays in this browser.</p>
          </div>
          <button className="button" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}Switch
            to {theme === "light" ? "dark" : "light"}
          </button>
        </section>
        <section className="settings-card">
          <ShieldCheck size={26} />
          <div>
            <h2>Your library, your browser</h2>
            <p>
              Imports, likes, subscriptions, history, and playlists are stored
              in LocalStorage on this device. Clearing site data removes your
              collection. Viewly is a frontend demo with no backend, database,
              or automatic account sync. Optional Google connection reads your
              YouTube subscriptions; local actions stay in this browser.
            </p>
          </div>
        </section>
        <section className="settings-card">
          <ExternalLink size={26} />
          <div>
            <h2>Playback comes from YouTube</h2>
            <p>
              Videos play through the official YouTube iframe. Availability,
              ads, and embedding restrictions are controlled by YouTube and the
              video creator. Mock metadata may differ from YouTube. Shorts use a
              vertical interface with public demo videos that may be landscape.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
