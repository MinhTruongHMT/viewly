import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, Settings, ShieldCheck } from "lucide-react";
import { googleConfig } from "../../services/googleConfig";
import {
  connectGoogle,
  disconnectGoogle,
  prepareGoogleIdentity,
} from "../../services/googleIdentity";
import { useAuthStore } from "../../store/useAuthStore";

export function GoogleSession() {
  const token = useAuthStore((state) => state.accessToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  useEffect(() => {
    if (!token) return;
    const expire = () => {
      if (
        useAuthStore.getState().accessToken === token &&
        Date.now() >= expiresAt
      )
        useAuthStore
          .getState()
          .disconnect(
            "Phiên Google đã hết hạn. Kết nối lại để tiếp tục đọc YouTube.",
          );
    };
    const timer = setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    const onVisible = () => {
      if (document.visibilityState === "visible") expire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, expiresAt]);
  return null;
}
export function GoogleConnection({
  onNavigate,
}: { onNavigate?: () => void } = {}) {
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const [sdk, setSdk] = useState<"loading" | "ready" | "error">("loading");
  const [sdkError, setSdkError] = useState("");
  useEffect(() => {
    if (!googleConfig.clientId) return;
    let disposed = false;
    prepareGoogleIdentity()
      .then(() => {
        if (!disposed) setSdk("ready");
      })
      .catch((reason: unknown) => {
        if (!disposed) {
          setSdk("error");
          setSdkError(
            reason instanceof Error
              ? reason.message
              : "Không tải được đăng nhập Google.",
          );
        }
      });
    return () => {
      disposed = true;
    };
  }, []);
  const retry = () => {
    setSdk("loading");
    setSdkError("");
    void prepareGoogleIdentity()
      .then(() => setSdk("ready"))
      .catch((reason: unknown) => {
        setSdk("error");
        setSdkError(
          reason instanceof Error ? reason.message : "Không tải được Google.",
        );
      });
  };
  if (!googleConfig.clientId)
    return (
      <div className="connection-panel">
        <ShieldCheck size={24} />
        <h3>Kết nối tài khoản Google</h3>
        <p>
          Chưa cấu hình OAuth Client ID. Bạn vẫn có thể sử dụng thư viện demo và
          lưu video trong trình duyệt.
        </p>
        <Link className="button" to="/settings" onClick={onNavigate}>
          <Settings size={16} />
          Xem hướng dẫn cấu hình
        </Link>
      </div>
    );
  return (
    <div className="connection-panel">
      <h3>
        {status === "connected"
          ? (profile?.name ?? "Đã kết nối Google / YouTube")
          : "Kết nối Google / YouTube"}
      </h3>
      {profile?.email && <p>{profile.email}</p>}
      <p>
        {status === "connected"
          ? "Viewly được phép đọc các kênh bạn đã đăng ký. Token chỉ giữ trong phiên này; tải lại trang cần kết nối lại."
          : "Đăng nhập tại Google và cấp quyền chỉ đọc YouTube để xem video từ các kênh đã đăng ký."}
      </p>
      <p className="demo-note">
        Like, Subscribe, Watch later và playlist trong Viewly vẫn lưu cục bộ;
        không thay đổi tài khoản YouTube.
      </p>
      {status === "connected" ? (
        <div className="connection-actions">
          <button className="button" onClick={() => disconnectGoogle()}>
            <LogOut size={16} />
            Ngắt kết nối
          </button>
          <button
            className="text-button"
            onClick={() => disconnectGoogle(true)}
          >
            Thu hồi quyền truy cập
          </button>
        </div>
      ) : (
        <button
          className="button primary"
          disabled={sdk !== "ready" || status === "connecting"}
          onClick={connectGoogle}
        >
          <LogIn size={17} />
          {status === "connecting"
            ? "Đang chờ Google…"
            : sdk === "loading"
              ? "Đang tải Google…"
              : "Kết nối Google"}
        </button>
      )}
      {sdk === "error" && (
        <>
          <p className="form-error" role="alert">
            {sdkError}
          </p>
          <button className="text-button" onClick={retry}>
            Tải lại đăng nhập Google
          </button>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
