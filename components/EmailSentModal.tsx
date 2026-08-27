'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EmailSentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function EmailSentModal({ 
  isOpen, 
  onClose, 
  userEmail 
}: EmailSentModalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fermeture touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto animate-slide-up border border-gray-100 dark:border-gray-800">
        {/* Header avec gradient vert */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold">Email expédié</h2>
              <p className="text-green-100 text-xs">Identifiants transmis avec succès</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Message de succès */}
          <div className="mb-5">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3.5 mb-4">
              <div className="flex items-start space-x-2.5">
                <span className="text-green-600 dark:text-green-400 text-lg">📧</span>
                <div className="flex-1 min-w-0 text-xs sm:text-sm">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                    Email de secours envoyé !
                  </h3>
                  <p className="text-green-700 dark:text-green-300 break-words">
                    Le mot de passe temporaire a été transmis à : <strong className="break-all">{userEmail}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Informations importantes */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                  <div className="text-blue-800 dark:text-blue-200">
                    <strong>Prochaines étapes :</strong>
                    <ul className="list-disc list-inside mt-1.5 space-y-1">
                      <li>L&apos;étudiant recevra son mot de passe temporaire par email</li>
                      <li>Il sera forcé de définir son mot de passe personnel à sa connexion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center space-x-2 font-medium text-sm shadow-md active:scale-95"
            >
              <span>✅</span>
              <span>Compris</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
