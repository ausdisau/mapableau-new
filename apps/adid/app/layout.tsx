import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { FirebaseAnalytics } from "../components/FirebaseAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "AD.iD | Australian Disability",
  description:
    "Your secure account gateway for Australian Disability services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Clerk Core 3: ClerkProvider must be inside <body>, not wrapping <html>.
  return (
    <html lang="en-AU">
      <body>
        <ClerkProvider afterSignOutUrl="/">
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <FirebaseAnalytics />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
