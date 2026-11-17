import { AppShell } from "./AppShell";
import { Button, Card, Spinner } from "./ui";

/** Shown while the address is read (null) or when the item doesn't exist. */
export function Missing({ loading }: { loading?: boolean }) {
  return (
    <AppShell focus>
      {loading ? (
        <Spinner />
      ) : (
        <Card className="mx-auto mt-10 max-w-md text-center">
          <p className="text-5xl">🧭</p>
          <p className="mt-2 text-lg font-bold">We couldn’t find that.</p>
          <Button href="/" className="mt-4">
            Go home
          </Button>
        </Card>
      )}
    </AppShell>
  );
}
