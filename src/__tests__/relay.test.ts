import { helloBox, inboxFor, otherRole, RelayError, relayConfig, relayFetch, relaySend } from "../lib/relay";

const cfg = { url: "https://abc.supabase.co", key: "aaa.bbb.ccc" };

function fakeFetch(status: number, body: unknown) {
  return jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response);
}

describe("mailboxes", () => {
  it("are 43-character names matching the database rule", () => {
    for (const box of [inboxFor("c", "k", "creator"), helloBox("c", "k")]) expect(box).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("differ per role, couple, key and purpose", () => {
    const a = inboxFor("c", "k", "creator");
    expect(inboxFor("c", "k", "joiner")).not.toBe(a);
    expect(inboxFor("c2", "k", "creator")).not.toBe(a);
    expect(inboxFor("c", "k2", "creator")).not.toBe(a);
    expect(helloBox("c", "k")).not.toBe(a);
    expect(inboxFor("c", "k", "creator")).toBe(a);
  });

  it("swap roles", () => {
    expect(otherRole("creator")).toBe("joiner");
    expect(otherRole("joiner")).toBe("creator");
  });
});

describe("config", () => {
  it("is off unless both values are set to something sensible", () => {
    expect(relayConfig("", "")).toBeNull();
    expect(relayConfig("https://abc.supabase.co", undefined)).toBeNull();
    expect(relayConfig("http://insecure.example.com", "k")).toBeNull();
    expect(relayConfig("https://evil.com/path?x=1", "k")).toBeNull();
    expect(relayConfig("https://abc.supabase.co/", "k")).toEqual({ url: "https://abc.supabase.co", key: "k" });
    expect(relayConfig("http://localhost:8081", "k")).toEqual({ url: "http://localhost:8081", key: "k" });
    expect(relayConfig("http://localhost.evil.com", "k")).toBeNull();
  });
});

describe("relay calls", () => {
  it("sends to the RPC with the anon key", async () => {
    const f = fakeFetch(200, 7);
    await expect(relaySend(cfg, "box", "payload", f)).resolves.toBe(7);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://abc.supabase.co/rest/v1/rpc/relay_send");
    expect(init.headers).toMatchObject({ apikey: "aaa.bbb.ccc", Authorization: "Bearer aaa.bbb.ccc" });
    expect(JSON.parse(init.body as string)).toEqual({ p_mailbox: "box", p_payload: "payload" });
  });

  it("sends new publishable keys only as apikey", async () => {
    const f = fakeFetch(200, 1);
    await relaySend({ ...cfg, key: "sb_publishable_abc123" }, "box", "payload", f);
    const headers = (f.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.apikey).toBe("sb_publishable_abc123");
    expect(headers.Authorization).toBeUndefined();
  });

  it("fetches rows after a cursor and drops malformed ones", async () => {
    const f = fakeFetch(200, [{ id: 3, payload: "abc" }, { id: "x" }, null, { id: 4, payload: "def" }]);
    await expect(relayFetch(cfg, "box", 2, f)).resolves.toEqual([
      { id: 3, payload: "abc" },
      { id: 4, payload: "def" },
    ]);
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ p_mailbox: "box", p_after: 2 });
  });

  it("turns failures into friendly errors", async () => {
    await expect(relaySend(cfg, "b", "p", fakeFetch(503, {}))).rejects.toThrow(/Too many/);
    await expect(relaySend(cfg, "b", "p", fakeFetch(400, {}))).rejects.toThrow(RelayError);
    const offline = jest.fn(async () => {
      throw new TypeError("Network request failed");
    });
    await expect(relayFetch(cfg, "b", 0, offline as unknown as typeof fetch)).rejects.toThrow(/Can't reach/);
    await expect(relayFetch(cfg, "b", 0, fakeFetch(200, { not: "an array" }))).rejects.toThrow(RelayError);
  });
});
