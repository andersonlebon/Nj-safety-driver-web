"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-stone-600 dark:text-slate-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
