import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
