import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Width = "data" | "reading" | "wide";

interface PageBodyProps {
  children: ReactNode;
  width?: Width;
  className?: string;
}

const widthClass: Record<Width, string> = {
  data: "max-w-7xl",
  reading: "max-w-3xl",
  wide: "",
};

/**
 * Standard page body wrapper. Replaces per-page `mx-auto max-w-7xl space-y-6 p-6`
 * repetitions. Pair with <PageHeader> for a consistent layout shell.
 */
export default function PageBody({
  children,
  width = "data",
  className,
}: PageBodyProps) {
  return (
    <div className={cn("mx-auto px-6 py-6 space-y-6", widthClass[width], className)}>
      {children}
    </div>
  );
}
