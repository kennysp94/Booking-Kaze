"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, X, ExternalLink } from "lucide-react";

export function KazeApiNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 mb-6">
      {/* <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-start justify-between">
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">
            📋 Information sur l'intégration Kaze API
          </p>
          <p>
            L'API Kaze ne fournit pas d'endpoint de disponibilité. Kaze utilise des{" "}
            <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-xs">
              job_workflows
            </code>{" "}
            pour créer des jobs, pas pour vérifier la disponibilité.
          </p>
          <p>
            <strong>Fonctionnalité actuelle :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              ✅ <strong>Création de réservations</strong> - Les réservations sont envoyées à Kaze via l'API job_workflows
            </li>
            <li>
              🔄 <strong>Créneaux de démonstration</strong> - Les créneaux disponibles sont simulés pour cette démonstration
            </li>
            <li>
              🕐 <strong>Format européen</strong> - Heures en format 24h et dates en français
            </li>
          </ul>
          <p className="text-xs mt-2">
            Pour un système de production, vous devrez implémenter votre propre logique de disponibilité ou intégrer avec un service de calendrier externe.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription> */}
    </Alert>
  );
}

export default KazeApiNotice;
