"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CreateGroupChatCard({ basePath }: { basePath: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Start a group chat</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Invite family, workers, or providers into one thread.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-3 min-h-11 w-full">
        <Link href={`${basePath}/group/new`}>Create group</Link>
      </Button>
    </div>
  );
}
