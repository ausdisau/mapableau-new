"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function RegisterPrompt() {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        New to MapAble? Create your secure account through Australian Disability
        Ltd identity services.
      </p>
      <Button asChild variant="default" size="lg" className="w-full">
        <a href="/auth/login?screen_hint=signup&returnTo=/onboarding">
          Get started securely
        </a>
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
