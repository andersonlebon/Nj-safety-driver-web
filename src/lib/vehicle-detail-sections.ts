import type { ModalSectionLink } from "@/components/ui/ModalSectionNav";

export function vehicleDetailSectionLinks(options: {
  showId?: boolean;
  showOwner?: boolean;
  hasInfractions?: boolean;
  hasTracking?: boolean;
}): ModalSectionLink[] {
  const links: ModalSectionLink[] = [
    { id: "vehicle-detail-summary", label: "Overview" },
    { id: "vehicle-detail-registration", label: "Registration" },
  ];

  if (options.showId) {
    links.push({ id: "vehicle-detail-id", label: "ID docs" });
  }
  if (options.showOwner) {
    links.push({ id: "vehicle-detail-owner", label: "Owner" });
  }

  links.push({ id: "vehicle-detail-fines", label: "Fines" });

  if (options.hasInfractions) {
    links.push({ id: "vehicle-detail-infractions", label: "Infractions" });
  }
  if (options.hasTracking) {
    links.push({ id: "vehicle-detail-tracking", label: "Tracking" });
  }

  return links;
}
