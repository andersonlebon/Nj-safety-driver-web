"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StaffDocumentsLoader } from "@/components/documents/StaffDocumentsLoader";

type Props = {
  ownerId?: string | null;
  vehicleId?: string | null;
};

export function PlateSearchDocumentsSection({ ownerId, vehicleId }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!ownerId && !vehicleId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-stone-500 dark:text-slate-400" />
            Documents
          </CardTitle>
          <CardDescription>
            Driver ID and vehicle registration files on file.
            {!expanded ? " Expand to view all uploads." : null}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full shrink-0 sm:w-auto"
          aria-expanded={expanded}
          aria-controls="plate-search-documents-panel"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? (
            <>
              Collapse
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Expand
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardHeader>
      {expanded && (
        <CardBody id="plate-search-documents-panel" className="pt-0">
          <StaffDocumentsLoader
            ownerId={ownerId}
            vehicleId={vehicleId}
            title="Driver and vehicle files"
            sectionId="plate-search-documents"
          />
        </CardBody>
      )}
    </Card>
  );
}
