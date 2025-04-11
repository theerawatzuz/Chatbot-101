import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  if (hostname.startsWith("talk.")) {
    return NextResponse.rewrite(new URL("/talk", request.url));
  }

  return NextResponse.next();
}
