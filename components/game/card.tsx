import { cn } from "@/lib/utils";

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
