import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KazeApiStatusProps {
  status: "connected" | "disconnected" | "error";
  message?: string;
  className?: string;
}

export function KazeApiStatus({ status, message, className = "" }: KazeApiStatusProps) {
  if (status === "connected") {
    return (
      <Alert className={`bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 ${className}`}>
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          ✅ Connecté à l'API Kaze - Données en temps réel disponibles
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert className={`bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          ❌ Erreur API Kaze: {message || "Erreur de connexion"}
        </AlertDescription>
      </Alert>
    );
  }

  // status === "disconnected"
  return (
    <Alert className={`bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 ${className}`}>
      <WifiOff className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        ⚠️ API Kaze non configurée - {message || "Les créneaux horaires ne sont pas disponibles depuis Kaze"}
        <br />
        <span className="text-xs">
          Pour accéder aux données réelles de Kaze, configurez KAZE_API_TOKEN et KAZE_API_URL dans les variables d'environnement.
        </span>
      </AlertDescription>
    </Alert>
  );
}

export default KazeApiStatus;
