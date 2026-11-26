import Head from "next/head";

/** Privacy policy (for Google Play and anyone curious). Open without signing in. */
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-ink">
      <Head>
        <title>Privacy · Zwei Herzen ♡</title>
      </Head>
      <h1 className="font-script text-4xl font-bold text-plum">Privacy</h1>
      <p className="mt-2 text-sm text-muted">Zwei Herzen ♡ Until Berlin — website and Android app. Last updated November 2026.</p>
      <Section title="In short">
        Zwei Herzen is a private German-learning app for two people. Your chats, photos, videos and voice messages are end-to-end encrypted: only your two phones can read them. We don’t sell data, show ads or use trackers.
      </Section>
      <Section title="What is stored">
        <ul className="list-disc pl-5">
          <li>Your account: email address and a hashed password (Supabase).</li>
          <li>An encrypted backup of your progress, locked with your password — we can’t open it.</li>
          <li>Messages and media in transit, encrypted; media is deleted from the server once delivered (and after 30 days at the latest).</li>
          <li>For notifications: your phone’s notification address and, if you set one, your reminder time and time zone. Notifications only say “New message”, never the text.</li>
          <li>“Last seen”: an encrypted note only your partner can read (can be turned off).</li>
        </ul>
      </Section>
      <Section title="Permissions (Android app)">
        <ul className="list-disc pl-5">
          <li>Microphone — only while you record a voice message.</li>
          <li>Notifications — for new messages and your daily reminder.</li>
          <li>Saving to the gallery — only photos and videos you choose to save. The app never reads your other photos.</li>
        </ul>
      </Section>
      <Section title="Services used">
        Supabase (accounts and the encrypted relay) and Firebase Cloud Messaging (Google) to deliver notifications. The website is hosted on Vercel.
      </Section>
      <Section title="Deleting your data">
        Signing out deletes everything stored on the phone. To delete your account and server data, use the contact below and it will be removed.
      </Section>
      <Section title="Contact">Through the app’s GitHub page: github.com/Aryan15583/German-language-learning-app/issues</Section>
    </main>
  );
}
Privacy.isPublic = true;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-1 leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}
