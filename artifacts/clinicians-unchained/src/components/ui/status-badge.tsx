import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "rejected" | "processing" | "approved" | "available" | "pending";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();
  
  const variants: Record<string, string> = {
    rejected: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    processing: "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20",
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20",
    available: "bg-teal-500/10 text-teal-700 border-teal-500/20 hover:bg-teal-500/20",
  };

  const defaultVariant = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";

  return (
    <Badge 
      variant="outline" 
      className={cn("capitalize font-medium shadow-none", variants[s] || defaultVariant, className)}
    >
      {status}
    </Badge>
  );
}
