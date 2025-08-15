import { NextRequest } from "next/server";
import { isValidPassword } from "./lib/isValidPassword";

export async function middleware(req: NextRequest) {
  if ((await isAuthenticated(req)) === false) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const authHeaders =
    req.headers.get("Authorization") || req.headers.get("authorization");

  if (!authHeaders) return false;

  const [username, password] = Buffer.from(authHeaders.split(" ")[1], "base64")
    .toString()
    .split(":");

  return (
    username === process.env.ADMIN_USERNAME &&
    (await isValidPassword(
      password,
      process.env.ADMIN_HASHED_PASSWORD as string
    ))
  );
}

export const config = {
  matcher: "/admin/:path*",
};
