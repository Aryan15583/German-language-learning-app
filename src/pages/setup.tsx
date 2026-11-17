import { useRouter } from "next/router";
import { Setup } from "../components/Setup";

/** Change names, levels or languages (from Settings). */
export default function SetupPage() {
  const router = useRouter();
  return <Setup onDone={() => router.push("/")} />;
}
