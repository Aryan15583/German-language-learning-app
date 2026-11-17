import { platformOf } from "../install";

describe("download the app", () => {
  it("knows which steps to show", () => {
    expect(platformOf("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148")).toBe("ios");
    expect(platformOf("Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36")).toBe("android");
    expect(platformOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36")).toBe("desktop");
  });
});
