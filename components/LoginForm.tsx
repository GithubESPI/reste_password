"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoginForm() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleAzureLogin = () => {
    signIn("azure-ad", { callbackUrl: "/dashboard" });
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/espi-campus-marseille.jpg"
          alt="Campus ESPI Marseille"
          fill
          priority
          className="object-cover object-center"
          quality={100}
        />
        {/* Overlay pour assombrir l'image et améliorer la lisibilité */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 animate-slide-up">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 transform transition-all">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <span className="text-white text-4xl">🔐</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Bienvenue
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Connectez-vous pour accéder au portail
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleAzureLogin}
              className="w-full flex justify-center items-center px-6 py-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 font-semibold text-lg group"
            >
              <svg className="w-6 h-6 mr-3 transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Connexion avec Microsoft
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Portail de gestion des mots de passe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
