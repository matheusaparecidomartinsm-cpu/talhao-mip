import { BottomDock, OfflineBanner } from "@/components/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
      <BottomDock />
    </>
  );
}
