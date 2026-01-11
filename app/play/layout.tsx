export default function PlayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col p-4 pb-12 relative">
      {children}
    </div>
  );
}
