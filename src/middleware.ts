import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = [
  "/",
  "/member/login",
  "/member/register",
  "/admin/login",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/member/auth/login",
  "/api/register",
  "/api/v1",
];

function isPublicPath(pathname: string) {
  return PUBLIC.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/banners/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (
    pathname === "/api/auth/login" ||
    pathname.startsWith("/api/auth/login/") ||
    pathname === "/api/member/auth/login" ||
    pathname.startsWith("/api/member/auth/login/")
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname) || pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  const userSession = req.cookies.get("smh_session")?.value;
  const memberSession = req.cookies.get("smh_member_session")?.value;

  const isMemberArea =
    (pathname.startsWith("/member") &&
      pathname !== "/member/login" &&
      pathname !== "/member/register" &&
      !pathname.startsWith("/member/login/") &&
      !pathname.startsWith("/member/register/")) ||
    pathname.startsWith("/api/member/");

  const isAdminArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/auth/");

  if (isMemberArea) {
    if (memberSession) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/member/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminArea) {
    if (userSession) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Shared APIs (e.g. /api/account) - either session
  if (pathname.startsWith("/api/")) {
    if (userSession || memberSession) return NextResponse.next();
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (userSession || memberSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/member/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
