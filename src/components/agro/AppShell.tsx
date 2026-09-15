import type { ReactNode } from "react";
import { MarketBar } from "./MarketBar";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  onHelp,
}: {
  children: ReactNode;
  onHelp?: () => void;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-soil-brown selection:bg-clay/20">
      <MarketBar {...(onHelp ? { onHelp } : {})} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-8 px-4 py-6 sm:px-6 lg:p-8">
        <Sidebar />
        <main className="col-span-12 space-y-8 lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
