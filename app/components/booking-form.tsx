"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useScheduling } from "@/providers/scheduling-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { toast } from "sonner";

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  eventType: {
    title: string;
    description: string;
    length: number;
  };
  onCancel: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export default function BookingForm({
  selectedDate,
  selectedTime,
  eventType,
  onCancel,
}: BookingFormProps) {
  const { createBooking, isLoading } = useScheduling();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [hasDuplicateBooking, setHasDuplicateBooking] = useState(false);

  // Check if user is logged in and pre-fill the form with their data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);

          // Pre-fill form with user data
          setFormData((prevData) => ({
            ...prevData,
            name: data.user.name || prevData.name,
            email: data.user.email || prevData.email,
            phone: data.user.phone || prevData.phone,
          }));

          // Check for duplicate bookings
          await checkDuplicateBookings(data.user.email);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Check if this user already has a booking for this date and time
  const checkDuplicateBookings = async (email: string) => {
    if (!selectedDate || !selectedTime) return;

    setCheckingDuplicates(true);
    try {
      const response = await fetch(
        `/api/cal/bookings/check?email=${encodeURIComponent(
          email
        )}&date=${selectedDate.toISOString()}&time=${encodeURIComponent(
          selectedTime
        )}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.hasDuplicateBooking) {
        setHasDuplicateBooking(true);
        toast.warning("You already have a booking for this time slot");
      }
    } catch (error) {
      console.error("Error checking duplicate bookings:", error);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Veuillez entrer une adresse email valide";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse du service est requise";
    }

    // Check for duplicate bookings
    if (hasDuplicateBooking) {
      newErrors.duplicate =
        "Vous avez déjà une réservation pour ce créneau horaire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await createBooking(formData);
      console.log("Booking created:", result);
      // The provider will handle success message and resetting state
    } catch (error) {
      console.error("Booking failed:", error);
      // The provider will handle error message
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold dark:text-white">
          Confirmer votre réservation
        </CardTitle>

        {/* Booking Summary */}
        <div className="space-y-3 pt-4 border-t dark:border-t-gray-700">
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>
              {selectedDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>
              {selectedTime} ({eventType.length} minutes)
            </span>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {eventType.title}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {hasDuplicateBooking && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Réservation en double détectée
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Vous avez déjà une réservation pour cette date et heure.
                  Veuillez sélectionner un autre créneau horaire.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="dark:text-gray-200">
              Nom complet *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Entrez votre nom complet"
              className={errors.name ? "border-red-500" : ""}
              disabled={user !== null} // Disable if pre-filled from user data
            />
            {user && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pré-rempli depuis votre compte
              </p>
            )}
            {errors.name && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.name === "Name is required"
                  ? "Le nom est requis"
                  : errors.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="dark:text-gray-200">
              Adresse e-mail *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Entrez votre email"
              className={errors.email ? "border-red-500" : ""}
              disabled={user !== null} // Disable if pre-filled from user data
            />
            {user && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pré-rempli depuis votre compte
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.email === "Email is required"
                  ? "L'email est requis"
                  : errors.email === "Please enter a valid email address"
                  ? "Veuillez entrer une adresse email valide"
                  : errors.email}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="dark:text-gray-200">
              Numéro de téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Entrez votre numéro de téléphone"
              disabled={user?.phone ? true : false} // Disable only if user has phone number
            />
            {user?.phone && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pré-rempli depuis votre compte
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="address" className="dark:text-gray-200">
              Adresse du service *
            </Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Où devons-nous fournir le service ?"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.address === "Service address is required"
                  ? "L'adresse du service est requise"
                  : errors.address}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className="dark:text-gray-200">
              Notes supplémentaires
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Informations supplémentaires ou demandes spéciales..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Retour
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Création en cours..." : "Confirmer la réservation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
