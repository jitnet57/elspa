export default function PickupLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen overflow-hidden relative" suppressHydrationWarning>{children}</div>;
}
