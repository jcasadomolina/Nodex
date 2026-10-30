import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/registro"];

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("nodex.sid");
  const onAuthPage = AUTH_PAGES.includes(request.nextUrl.pathname);

  if (!hasSession && !onAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && onAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
