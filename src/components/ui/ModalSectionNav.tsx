"use client";

import { cn } from "@/lib/utils";

export type ModalSectionLink = {
  id: string;
  label: string;
};

type Props = {
  links: ModalSectionLink[];
  /** Scrollable modal body element id */
  scrollContainerId: string;
  className?: string;
};

export function ModalSectionNav({ links, scrollContainerId, className }: Props) {
  if (links.length === 0) return null;

  const scrollTo = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    const container = document.getElementById(scrollContainerId);
    if (!section) return;

    if (container) {
      const top =
        section.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        8;
      container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Jump to section"
      className={cn(
        "mt-3 flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1",
        "snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {links.map((link) => (
        <button
          key={link.id}
          type="button"
          onClick={() => scrollTo(link.id)}
          className={cn(
            "snap-start shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            "bg-stone-100 text-stone-700 hover:bg-brand-100 hover:text-brand-800",
            "dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          )}
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}
