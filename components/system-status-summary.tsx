"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info, Calendar } from "lucide-react";

export function SystemStatusSummary() {
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Info className="h-5 w-5" />
          État du Système de Réservation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Availability System Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">
                Système de Disponibilité
              </span>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
              >
                Simulation
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Créneaux générés automatiquement (8h-15h30, slots de 90min) car
              l'API Kaze ne fournit pas d'endpoint de disponibilité.
            </p>
          </div>

          {/* Booking System Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">
                Création de Réservations
              </span>
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              >
                Connecté
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Les réservations sont envoyées directement à l'API Kaze via
              job_workflows.
            </p>
          </div>

          {/* Timezone System Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Format Européen</span>
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              >
                Actif
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Format 24h, dates en français, fuseaux horaires européens
              supportés.
            </p>
          </div>

          {/* User Authentication Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">
                Authentification Utilisateur
              </span>
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              >
                Fonctionnel
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Login/logout avec pré-remplissage automatique des formulaires.
            </p>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Note pour la Production
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Pour un environnement de production, intégrez avec un service de
                calendrier externe (Google Calendar, Cal.com, etc.) pour gérer
                la disponibilité réelle des techniciens.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemStatusSummary;
