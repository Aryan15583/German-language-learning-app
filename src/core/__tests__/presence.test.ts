import { newKey } from "../lib/crypto";
import { isOnline, openPresence, presenceLabel, sealPresence } from "../lib/presence";

const at = (h: number, m: number, dayOffset = 0) => {
  const d = new Date(2026, 10, 24, h, m);
  d.setDate(d.getDate() + dayOffset);
  return d.getTime();
};

describe("online / last seen", () => {
  it("is end-to-end encrypted, and a wrong key or junk reads as unknown", () => {
    const key = newKey();
    const sealed = sealPresence(key, { at: at(14, 5), online: true });
    expect(sealed).not.toContain("online");
    expect(openPresence(key, sealed, at(14, 6))).toEqual({ at: at(14, 5), online: true });
    expect(openPresence(newKey(), sealed, at(14, 6))).toBeNull();
    expect(openPresence(key, "not-valid", at(14, 6))).toBeNull();
    expect(openPresence(key, null, at(14, 6))).toBeNull();
    // A time in the future is capped at now.
    expect(openPresence(key, sealPresence(key, { at: at(20, 0), online: true }), at(14, 6))?.at).toBe(at(14, 6));
  });
  it("says online only while the heartbeat is fresh", () => {
    expect(isOnline({ at: at(14, 5), online: true }, at(14, 6))).toBe(true);
    expect(isOnline({ at: at(14, 5), online: true }, at(14, 8))).toBe(false);
    expect(isOnline({ at: at(14, 5), online: false }, at(14, 5))).toBe(false);
  });
  it("reads like WhatsApp", () => {
    const now = at(14, 30);
    expect(presenceLabel({ at: at(14, 29), online: true }, now)).toBe("online");
    expect(presenceLabel({ at: at(14, 29), online: false }, now)).toBe("last seen just now");
    expect(presenceLabel({ at: at(14, 10), online: false }, now)).toBe("last seen 20 min ago");
    expect(presenceLabel({ at: at(9, 5), online: false }, now)).toMatch(/^last seen today at 0?9:05/);
    expect(presenceLabel({ at: at(22, 10, -1), online: false }, now)).toMatch(/^last seen yesterday at 22:10|^last seen yesterday at 10:10/);
    expect(presenceLabel({ at: at(8, 0, -3), online: false }, now)).toMatch(/^last seen \w+ at /);
    expect(presenceLabel({ at: at(8, 0, -20), online: false }, now)).toMatch(/^last seen \d+ \w+|^last seen \w+ \d+/);
    expect(presenceLabel(null, now)).toBeNull();
  });
});
