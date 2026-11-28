"use client";

import React from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GroupMemberAvatar {
  name: string;
  role?: string;
  isLeader?: boolean;
}

export function AvatarGroup({
  members,
  showLeaderBadge = true,
  className,
}: {
  members: GroupMemberAvatar[];
  showLeaderBadge?: boolean;
  className?: string;
}) {
  const leader = members.find((m) => m.isLeader);

  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <div className="flex -space-x-2">
        {members.map((member) => (
          <div
            key={member.name}
            title={`${member.name}${member.isLeader ? " (Leader)" : ""}`}
            className={cn(
              "w-8 h-8 rounded-full border-2 border-[var(--neutral-card)] flex items-center justify-center text-xs font-semibold",
              member.isLeader
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--neutral-surface)] text-[var(--neutral-text)]"
            )}
          >
            {initials(member.name)}
          </div>
        ))}
      </div>

      {showLeaderBadge && leader && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)] dark:text-indigo-300">
          <Crown className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>Leader: {leader.name.split(" ")[0]}</span>
        </span>
      )}
    </div>
  );
}
