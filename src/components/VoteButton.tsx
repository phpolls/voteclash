"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function VoteButton({ candidateId }: { candidateId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleVote() {
    startTransition(async () => {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      router.refresh();
    });
  }

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className="
        w-full rounded-2xl py-3 text-sm font-bold text-white
        bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600
        shadow-lg shadow-purple-500/30
        hover:scale-[1.02] hover:brightness-110
        active:scale-[0.98]
        disabled:opacity-50
        transition
      "
    >
      {isPending ? "Voting..." : "🔥 Vote Now"}
    </button>
  );
}
