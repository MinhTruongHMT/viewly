import { googleConfig, youtubeReadScope } from "./googleConfig";
import { useAuthStore } from "../store/useAuthStore";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
}
interface TokenClient {
  requestAccessToken: (options: { prompt: string }) => void;
}
interface OAuthLibrary {
  initTokenClient: (options: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback: (error: { type: string }) => void;
  }) => TokenClient;
  hasGrantedAllScopes: (
    response: TokenResponse,
    ...scopes: string[]
  ) => boolean;
  revoke: (token: string, callback: () => void) => void;
}
declare global {
  interface Window {
    google?: { accounts: { oauth2: OAuthLibrary } };
  }
}
let pending: Promise<void> | null = null;
let client: TokenClient | null = null;
let createClient: (() => TokenClient) | null = null;
let attempt = 0;
let activeAttempt = 0;
let popupTimeout: ReturnType<typeof setTimeout> | undefined;

function settle() {
  clearTimeout(popupTimeout);
  popupTimeout = undefined;
}
export function prepareGoogleIdentity(): Promise<void> {
  if (!googleConfig.clientId)
    return Promise.reject(
      new Error("Chưa cấu hình OAuth Client ID. Xem hướng dẫn trong Settings."),
    );
  if (client) return Promise.resolve();
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    const init = () => {
      const oauth = window.google?.accounts.oauth2;
      if (!oauth) {
        reject(new Error("Google Identity chưa tải được. Hãy thử lại."));
        return;
      }
      createClient = () => {
        const clientAttempt = activeAttempt;
        return oauth.initTokenClient({
          client_id: googleConfig.clientId,
          scope: `openid email profile ${youtubeReadScope}`,
          callback: (response) => {
            if (
              clientAttempt !== attempt ||
              useAuthStore.getState().status !== "connecting"
            )
              return;
            settle();
            if (response.error || !response.access_token) {
              useAuthStore
                .getState()
                .fail(
                  "Đăng nhập chưa hoàn tất hoặc quyền truy cập đã bị từ chối.",
                );
              return;
            }
            if (!oauth.hasGrantedAllScopes(response, youtubeReadScope)) {
              useAuthStore
                .getState()
                .fail(
                  "Hãy cấp quyền chỉ đọc YouTube để xem các kênh đã đăng ký.",
                );
              return;
            }
            const lifetime = Number(response.expires_in);
            if (!Number.isFinite(lifetime) || lifetime <= 0) {
              useAuthStore
                .getState()
                .fail("Google trả về phiên không hợp lệ. Hãy thử lại.");
              return;
            }
            useAuthStore.getState().accept(response.access_token, lifetime);
            void fetchGoogleProfile(response.access_token);
          },
          error_callback: (error) => {
            if (clientAttempt === attempt) {
              settle();
              useAuthStore
                .getState()
                .fail(
                  error.type === "popup_closed"
                    ? "Bạn đã đóng cửa sổ đăng nhập."
                    : "Không mở được cửa sổ Google. Hãy cho phép popup và thử lại.",
                );
            }
          },
        });
      };
      client = createClient();
      resolve();
    };
    if (window.google?.accounts.oauth2) {
      init();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    const timer = setTimeout(() => {
      script.remove();
      reject(
        new Error("Google phản hồi quá chậm. Kiểm tra kết nối và thử lại."),
      );
    }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      try {
        init();
      } catch {
        reject(
          new Error(
            "Không khởi tạo được đăng nhập Google. Kiểm tra Client ID và thử lại.",
          ),
        );
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(
        new Error(
          "Không tải được đăng nhập Google. Kiểm tra mạng hoặc trình chặn nội dung.",
        ),
      );
    };
    document.head.appendChild(script);
  }).catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}
async function fetchGoogleProfile(token: string) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return;
    const data: unknown = await response.json();
    if (data && typeof data === "object") {
      const profile = data as Record<string, unknown>;
      useAuthStore
        .getState()
        .setProfile(token, {
          name:
            typeof profile.name === "string"
              ? profile.name
              : "Tài khoản Google",
          email: typeof profile.email === "string" ? profile.email : undefined,
        });
    }
  } catch {
    /* YouTube access remains useful even when optional profile information is unavailable. */
  }
}
export function connectGoogle() {
  // Client is prepared before the click so the popup opens directly from a user gesture.
  if (!client) {
    useAuthStore
      .getState()
      .fail("Đăng nhập Google chưa sẵn sàng. Hãy thử tải lại trong Settings.");
    return;
  }
  if (useAuthStore.getState().status === "connecting") return;
  activeAttempt = ++attempt;
  useAuthStore.getState().begin();
  popupTimeout = setTimeout(() => {
    attempt++;
    useAuthStore
      .getState()
      .fail("Đăng nhập chưa hoàn tất. Hãy thử kết nối lại.");
  }, 120000);
  try {
    client = createClient?.() ?? client;
    client.requestAccessToken({ prompt: "select_account" });
  } catch {
    settle();
    useAuthStore
      .getState()
      .fail("Không mở được đăng nhập Google. Hãy thử lại.");
  }
}
export function disconnectGoogle(revoke = false) {
  attempt++;
  settle();
  const token = useAuthStore.getState().accessToken;
  useAuthStore.getState().disconnect();
  if (revoke && token)
    window.google?.accounts.oauth2.revoke(token, () => undefined);
}
