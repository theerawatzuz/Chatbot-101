import { headers } from "next/headers";
import "@/styles/globals.css";

export async function generateMetadata() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  return {
    title: hostname.startsWith("talk.") ? "Just Easy Talk?" : "Just Easy Chat?",
    description: "This is the Talk page for Just Easy Chat.",
    generator: "v1",
    icons: {
      icon: "/apple-touch-icon.png",
    },
  };
}

export default function TalkPage() {
  return (
    <div>
      <h1>Welcome to the Talk Page</h1>
      <p>This is the talk page content.</p>
    </div>
  );
}
