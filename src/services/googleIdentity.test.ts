import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
interface TokenOptions {
  callback: (response: {
    access_token?: string;
    expires_in?: number;
    error?: string;
  }) => void;
  error_callback: (error: { type: string }) => void;
}
let callbacks: TokenOptions[];
let identity: typeof import("./googleIdentity");
let store: typeof import("../store/useAuthStore").useAuthStore;
beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv(
    "VITE_GOOGLE_CLIENT_ID",
    "fixture-client.apps.googleusercontent.com",
  );
  callbacks = [];
  vi.stubGlobal("window", {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (options: TokenOptions) => {
            callbacks.push(options);
            return { requestAccessToken: vi.fn() };
          },
          hasGrantedAllScopes: () => true,
          revoke: vi.fn(),
        },
      },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Fixture user",
            email: "fixture@example.test",
          }),
        ),
      ),
  );
  store = (await import("../store/useAuthStore")).useAuthStore;
  identity = await import("./googleIdentity");
  await identity.prepareGoogleIdentity();
});
afterEach(() => {
  identity.disconnectGoogle();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Google authorization lifecycle", () => {
  it("accepts a scoped, expiring token and disconnects without persistence", () => {
    identity.connectGoogle();
    callbacks
      .at(-1)!
      .callback({ access_token: "ephemeral-token", expires_in: 3600 });
    expect(store.getState().status).toBe("connected");
    expect(store.getState().expiresAt).toBeGreaterThan(Date.now());
    identity.disconnectGoogle();
    expect(store.getState().accessToken).toBeNull();
    expect(store.getState().profile).toBeNull();
  });
  it("does not accept a late callback after disconnect or another connection attempt", () => {
    identity.connectGoogle();
    const old = callbacks.at(-1)!;
    identity.disconnectGoogle();
    identity.connectGoogle();
    const current = callbacks.at(-1)!;
    old.callback({ access_token: "old-account", expires_in: 3600 });
    expect(store.getState().accessToken).toBeNull();
    expect(store.getState().status).toBe("connecting");
    old.error_callback({ type: "popup_closed" });
    expect(store.getState().status).toBe("connecting");
    current.callback({ access_token: "new-account", expires_in: 3600 });
    expect(store.getState().accessToken).toBe("new-account");
  });
  it("handles declined access and closed popups", () => {
    identity.connectGoogle();
    callbacks.at(-1)!.callback({ error: "access_denied" });
    expect(store.getState().error).toContain("từ chối");
    identity.connectGoogle();
    callbacks.at(-1)!.error_callback({ type: "popup_closed" });
    expect(store.getState().status).toBe("disconnected");
  });
  it("rejects tokens without the required YouTube scope", () => {
    window.google!.accounts.oauth2.hasGrantedAllScopes = () => false;
    identity.connectGoogle();
    callbacks
      .at(-1)!
      .callback({ access_token: "missing-scope", expires_in: 3600 });
    expect(store.getState().accessToken).toBeNull();
    expect(store.getState().error).toContain("chỉ đọc");
  });
  it("rejects an invalid token lifetime", () => {
    identity.connectGoogle();
    callbacks
      .at(-1)!
      .callback({ access_token: "bad-lifetime", expires_in: -1 });
    expect(store.getState().accessToken).toBeNull();
  });
});
