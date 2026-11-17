# Zwei Herzen email designs

Paste these into **Supabase → Authentication → Emails** (the "Templates" tab):

| Template in Supabase | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | `Confirm your Zwei Herzen account ♡` |
| Reset password | `reset-password.html` | `Reset your Zwei Herzen password` |
| Change email address | `change-email.html` | `Confirm your new email ♡` |

For each one: open the template, replace the **Subject**, select everything in **Message body** and paste the file's contents, then **Save**.

They only use Supabase's own placeholders (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`), so links work exactly as before.
