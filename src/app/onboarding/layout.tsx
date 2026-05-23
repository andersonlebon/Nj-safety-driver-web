import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-slate-950">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle size="sm" />
      </div>
      <main className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
