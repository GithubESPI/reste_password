'use client';

import React from 'react';

interface EmailSendingAnimationProps {
  isOpen: boolean;
  userEmail: string;
}

export default function EmailSendingAnimation({ 
  isOpen, 
  userEmail 
}: EmailSendingAnimationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">📧</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Envoi en cours</h2>
              <p className="text-blue-100 text-sm">Préparation de l'email</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Animation du mail en papier */}
          <div className="mb-6">
            <div className="relative h-32 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden">
              {/* Mail en papier volant */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 animate-fly">
                <div className="text-4xl">📧</div>
              </div>
              
              {/* Nuages de fond */}
              <div className="absolute top-4 left-8 text-2xl opacity-30 animate-float">☁️</div>
              <div className="absolute top-8 right-12 text-xl opacity-40 animate-float-delayed">☁️</div>
              <div className="absolute bottom-4 left-16 text-lg opacity-25 animate-float-slow">☁️</div>
              
              {/* Ligne de vol */}
              <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            </div>
          </div>

          {/* Message d'envoi */}
          <div className="text-center mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Envoi du mail en cours...
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Destination : <span className="font-semibold">{userEmail}</span>
              </p>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">ℹ️</span>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Veuillez patienter...</strong>
                <p className="mt-1">
                  L'email avec le mot de passe temporaire est en cours d'envoi. 
                  Cette opération peut prendre quelques secondes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fly {
          0% {
            transform: translateX(-50px) translateY(-50%) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          25% {
            transform: translateX(25%) translateY(-60%) rotate(5deg);
          }
          50% {
            transform: translateX(50%) translateY(-40%) rotate(-3deg);
          }
          75% {
            transform: translateX(75%) translateY(-55%) rotate(8deg);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw + 50px)) translateY(-50%) rotate(15deg);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-fly {
          animation: fly 3s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
