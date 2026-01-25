"use client";

import { RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset: _,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh space-y-4">
      <h2>Etwas ist schiefgelaufen!</h2>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        <RotateCcwIcon />
        Neu laden
      </Button>
    </div>
  );
}
