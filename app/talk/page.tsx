import { headers } from "next/headers";

export async function generateMetadata() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  return {
    title: hostname.startsWith("talk.") ? "Talk?" : "Just Easy Chat?",
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
