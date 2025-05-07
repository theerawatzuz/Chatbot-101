import { headers } from "next/headers";
import "@/styles/globals.css";

export async function generateMetadata() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  return {
    title: hostname.startsWith("plan.") ? "Just Easy Plan?" : "Just Easy Chat?",
    description: "This is the Plan page for Just Easy Chat.",
    generator: "v1",
    icons: {
      icon: "/apple-touch-icon.png",
    },
  };
}

export default function PlanPage() {
  return (
    <div>
      <h1>Welcome to the Plan Page</h1>
      <p>This is the plan page content.</p>
    </div>
  );
}
