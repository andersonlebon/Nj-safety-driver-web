import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata = {
  title: "First-time setup | NJ Safety Driver",
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle size="sm" />
      </div>
      <main className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
