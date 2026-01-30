import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: Pick<React.HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  return (
    <div
      className={cn(
        "absolute inset-0 size-full border bg-neutral-600 rounded-md transition-all backface-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative group w-10/12 sm:size-96 aspect-square perspective-distant">
      {children}
    </div>
  );
}
