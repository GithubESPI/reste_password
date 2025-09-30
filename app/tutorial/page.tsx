"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Connexion sécurisée",
      description: "Connectez-vous avec votre compte Microsoft Azure AD",
      icon: "🔐",
      details: "Utilisez vos identifiants professionnels pour accéder à la plateforme de manière sécurisée.",
      animation: "login"
    },
    {
      id: 2,
      title: "Recherche d'étudiant",
      description: "Trouvez rapidement l'étudiant par nom ou email",
      icon: "🔍",
      details: "Saisissez le nom ou l'email de l'étudiant pour le localiser dans la base de données Azure AD.",
      animation: "search"
    },
    {
      id: 3,
      title: "Réinitialisation",
      description: "Générez un nouveau mot de passe temporaire",
      icon: "🔄",
      details: "Créez un mot de passe sécurisé que l'étudiant devra changer à sa prochaine connexion.",
      animation: "reset"
    },
    {
      id: 4,
      title: "Envoi par email",
      description: "Transmettez le mot de passe par email de secours",
      icon: "📧",
      details: "Le mot de passe temporaire est automatiquement envoyé à l'email de récupération de l'étudiant.",
      animation: "email"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const handleLearnMore = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation */}
      <nav className="relative px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <span className="text-white font-bold text-lg group-hover:animate-pulse">🔐</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">PasswordManager</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-20">
              <div className="w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              {/* Welcome message */}
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Tutoriel interactif
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Comment fonctionne
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}PasswordManager
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Découvrez en 4 étapes simples comment gérer et réinitialiser les mots de passe des étudiants
                de manière sécurisée et efficace.
              </p>
            </div>
          </div>

          {/* Tutorial Steps */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`relative p-6 rounded-2xl transition-all duration-500 ${
                    currentStep === index
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl scale-105"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg hover:shadow-xl"
                  } ${isAnimating ? "animate-pulse" : ""}`}
                >
                  {/* Step Number */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === index
                      ? "bg-white text-blue-600"
                      : "bg-blue-600 text-white"
                  }`}>
                    {step.id}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-4 text-center">
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold mb-2 text-center">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-center mb-4">
                    {step.description}
                  </p>

                  {/* Details */}
                  <p className={`text-xs text-center ${
                    currentStep === index
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {step.details}
                  </p>

                  {/* Animation Indicator */}
                  {currentStep === index && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ping"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {steps[currentStep].icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Étape {steps[currentStep].id} : {steps[currentStep].title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {steps[currentStep].details}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentStep + 1} sur {steps.length} étapes
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-4 text-center">🛡️</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Sécurité maximale
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Intégration Azure AD avec authentification multi-facteurs
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-4 text-center">⚡</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Rapidité
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Recherche et réinitialisation en quelques clics
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-4 text-center">📊</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Traçabilité
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Historique complet des actions et notifications automatiques
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">
                  Prêt à commencer ?
                </h2>
                <p className="text-lg mb-6 text-blue-100">
                  Connectez-vous maintenant et découvrez la puissance de PasswordManager
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleLearnMore}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🚀</span>
                    <span>Commencer maintenant</span>
                  </button>
                  <Link
                    href="/"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                  >
                    Retour à l&apos;accueil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
