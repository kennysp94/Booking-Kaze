"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Download,
} from "lucide-react";

interface BookingConfirmationProps {
  booking: {
    id: string;
    uid?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    start_time?: string;
    end_time?: string;
    customer?: {
      name: string;
      email: string;
      phone?: string;
    };
    attendees?: Array<{
      name: string;
      email: string;
      phone?: string;
    }>;
    service?: {
      title: string;
    };
    location?: string;
    job_address?: string;
  };
  onNewBooking: () => void;
}

export default function BookingConfirmation({
  booking,
  onNewBooking,
}: BookingConfirmationProps) {
  // Handle both old and new data structures
  const startTimeStr = booking.startTime || booking.start_time;
  const endTimeStr = booking.endTime || booking.end_time;
  const startTime = startTimeStr ? new Date(startTimeStr) : new Date();
  const endTime = endTimeStr
    ? new Date(endTimeStr)
    : new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour later

  // Get customer info from either structure
  const customer =
    booking.customer ||
    (booking.attendees?.[0] && {
      name: booking.attendees[0].name,
      email: booking.attendees[0].email,
      phone: booking.attendees[0].phone,
    });

  // Get service title from either structure
  const serviceTitle =
    booking.service?.title || booking.title || "Service Appointment";

  // Get location from either structure
  const location = booking.location || booking.job_address || "Location TBD";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Generate calendar event file (ICS format)
  const downloadCalendarEvent = () => {
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kaze Scheduling//FR",
      "BEGIN:VEVENT",
      `UID:${booking.id}@kazescheduling.com`,
      `DTSTART:${formatICSDate(startTime)}`,
      `DTEND:${formatICSDate(endTime)}`,
      `SUMMARY:${serviceTitle} - ${customer?.name || "Customer"}`,
      `DESCRIPTION:Rendez-vous de service programmé via Kaze Scheduling\\nID de réservation: ${booking.id}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Rappel: Rendez-vous de service dans 15 minutes",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `booking-${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Réservation Confirmée!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Votre service a été programmé avec succès
          </p>
        </div>
      </div>

      {/* Booking Details Card */}
      <Card className="border border-green-200 bg-green-50/30 dark:bg-green-900/20 dark:border-green-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 dark:text-white">
            Détails de la réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {serviceTitle}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ID de réservation: {booking.id || booking.uid}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(startTime)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatTime(startTime)} - {formatTime(endTime)}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {customer?.name || "Customer Name"}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {customer?.email || "No email"}
                  </p>
                </div>
                {customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {customer.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          {location && location !== "Location TBD" && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Lieu du service
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {location}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 dark:text-white">
            Quelle est la prochaine étape ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 mt-0.5">
              1
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Vous recevrez un e-mail de confirmation avec tous les détails
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 mt-0.5">
              2
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Notre équipe vous contactera avant l'heure prévue pour confirmer
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 mt-0.5">
              3
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Nous arriverons à votre adresse à l'heure prévue
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={downloadCalendarEvent} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Ajouter au calendrier
        </Button>
        <Button variant="outline" onClick={onNewBooking} className="w-full">
          Réserver un autre service
        </Button>
      </div>
    </div>
  );
}
