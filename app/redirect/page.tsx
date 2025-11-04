"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RedirectPage() {
  const { status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Éviter les redirections multiples
    if (hasRedirected.current) return;

    if (status === "authenticated") {
      hasRedirected.current = true;
      // Utiliser setTimeout pour éviter les conflits avec le DOM
      setTimeout(() => {
        router.replace("/dashboard");
      }, 100);
    } else if (status === "unauthenticated") {
      hasRedirected.current = true;
      setTimeout(() => {
        router.replace("/login");
      }, 100);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}
