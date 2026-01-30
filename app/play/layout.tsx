export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card">
      <main className="max-w-7xl mx-auto min-h-dvh flex flex-col p-4 pb-12 relative">
        {children}
      </main>
    </div>
  );
}
