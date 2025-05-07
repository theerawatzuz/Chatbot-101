import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const path = request.nextUrl.pathname;

  // อนุญาตให้ static assets ผ่านไปได้
  if (path.startsWith("/_next/") || path.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  // อนุญาตให้เข้าถึง /talk ผ่าน subdomain talk. เท่านั้น
  if (path.startsWith("/talk")) {
    if (!hostname.startsWith("talk.")) {
      // หากไม่ใช่ subdomain talk. ให้ redirect ไปยังหน้าหลัก
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  if (path.startsWith("/plan")) {
    if (!hostname.startsWith("plan.")) {
      // หากไม่ใช่ subdomain plan. ให้ redirect ไปยังหน้าหลัก
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // หากเป็น subdomain talk. ให้ rewrite ไปยัง /talk
  if (hostname.startsWith("talk.")) {
    return NextResponse.rewrite(new URL("/talk", request.url));
  }
  if (hostname.startsWith("plan.")) {
    return NextResponse.rewrite(new URL("/plan", request.url));
  }

  return NextResponse.next();
}
