import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/care/:path*", "/provider/care/:path*", "/worker/:path*"],
};
