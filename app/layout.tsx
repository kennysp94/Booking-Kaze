import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SchedulingProvider } from "@/providers/scheduling-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Kaze Scheduling",
  description: "Schedule your plumbing service with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SchedulingProvider>
            {children}
            <Toaster />
          </SchedulingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
