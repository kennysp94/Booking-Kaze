import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SchedulingProvider } from "@/providers/scheduling-provider";
import { TimezoneProvider } from "@/providers/timezone-provider";
import { Toaster } from "@/components/ui/sonner";
import FetchPatchLoader from "@/components/fetch-patch-loader";

export const metadata: Metadata = {
  title: "Planification Kaze",
  description: "Planifiez votre service de plomberie en toute simplicité",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TimezoneProvider>
            <SchedulingProvider>
              <FetchPatchLoader />
              {children}
              <Toaster />
            </SchedulingProvider>
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
