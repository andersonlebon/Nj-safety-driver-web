import { OnboardingHeader } from "./OnboardingHeader";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader />
      <main className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
