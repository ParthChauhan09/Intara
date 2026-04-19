import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "intara_access_token";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/sign-in", "/sign-up"]
};

