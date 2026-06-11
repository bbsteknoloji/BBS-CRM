"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-destructive"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">Bir hata oluştu</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Sayfa yüklenirken beklenmedik bir sorun oluştu. Lütfen tekrar deneyin
          ya da ana sayfaya dönün.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Ana Sayfa
        </Button>
        <Button onClick={reset}>Tekrar Dene</Button>
      </div>
    </div>
  );
}
