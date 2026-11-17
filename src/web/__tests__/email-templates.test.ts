import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const dir = join(__dirname, "../../../supabase/email-templates");

describe("email designs", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
  it("exist for confirm, reset and change-email", () => {
    expect(files.sort()).toEqual(["change-email.html", "confirm-signup.html", "reset-password.html"]);
  });
  it.each(files)("%s keeps Supabase's link and uses only inline styles", (f) => {
    const html = readFileSync(join(dir, f), "utf8");
    expect(html).toContain('href="{{ .ConfirmationURL }}"');
    expect(html).not.toMatch(/\{\{\{\{|\}\}\}\}/);
    expect(html).not.toMatch(/<style|<script/i);
  });
});
