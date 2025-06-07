"use client";

// This component doesn't render anything but ensures our fetch patch is loaded
// on the client side
import "@/lib/auth-fetch-patch";

export default function FetchPatchLoader() {
  return null; // This component doesn't render anything
}
