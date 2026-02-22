import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { cn } from "../../utils/cn";

interface DashboardCardProps {
  title?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export function DashboardCard({
  title,
  headerAction,
  children,
  className,
  contentClassName,
  headerClassName,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "rounded-card border-slate-200 overflow-hidden h-full bg-white",
        className,
      )}
    >
      {(title || headerAction) && (
        <CardHeader
          className={cn(
            "p-6 border-b border-slate-100 flex flex-row items-center justify-between space-y-0",
            headerClassName,
          )}
        >
          {title && (
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {title}
            </CardTitle>
          )}
          {headerAction}
        </CardHeader>
      )}
      <CardContent className={cn("p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
