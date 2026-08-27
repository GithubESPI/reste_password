'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  temporaryPassword: string;
  userEmail?: string;
  onSendEmail?: (userName: string, temporaryPassword: string, userEmail: string) => void;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  userName, 
  temporaryPassword,
  userEmail,
  onSendEmail
}: SuccessModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Erreur lors de la copie dans le presse-papier:', err);
    }
  }, [temporaryPassword]);

  const handleSendEmail = useCallback(async () => {
    if (onSendEmail && userEmail) {
      await onSendEmail(userName, temporaryPassword, userEmail);
    }
  }, [onSendEmail, userName, temporaryPassword, userEmail]);

  // Support touche Échap
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[100dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header avec gradient vert */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl sm:text-2xl">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">Réinitialisation réussie</h2>
              <p className="text-green-100 text-xs sm:text-sm truncate">Mot de passe mis à jour dans Microsoft Entra</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Message de succès */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 dark:text-green-400 text-lg">🎉</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1 text-sm">
                    Succès !
                  </h3>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 break-words">
                    Le mot de passe a été réinitialisé avec succès pour <strong className="break-all">{userName}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Mot de passe temporaire */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🔐 Mot de passe temporaire
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={temporaryPassword}
                    readOnly
                    className="flex-1 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm font-semibold select-all"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-2 shadow-sm ${
                      copied 
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title="Copier le mot de passe dans le presse-papier"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {copied ? '✅ Mot de passe copié dans votre presse-papier' : 'Cliquez sur Copier pour le transmettre facilement'}
                </p>
              </div>

              {/* Instructions importantes */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 dark:text-amber-400 text-sm mt-0.5">⚠️</span>
                  <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 flex-1 min-w-0">
                    <strong className="block mb-1.5 font-semibold">Instructions :</strong>
                    <ul className="list-disc list-outside ml-4 space-y-1">
                      <li>L&apos;étudiant devra se connecter avec ce mot de passe temporaire</li>
                      <li>Il lui sera immédiatement demandé de créer son mot de passe personnel</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email de secours */}
              {userEmail && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 dark:text-purple-400 text-sm mt-0.5">📧</span>
                    <div className="text-xs sm:text-sm text-purple-800 dark:text-purple-200 flex-1 min-w-0">
                      <strong className="block mb-1 font-semibold">Email de secours détecté :</strong>
                      <p className="mb-1 text-xs sm:text-sm">
                        Adresse : <span className="font-semibold break-all text-purple-900 dark:text-purple-100">{userEmail}</span>
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Vous pouvez lui expédier directement ses identifiants en un clic ci-dessous.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions (Footer fixe) */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium order-2 sm:order-1 text-sm"
            >
              Fermer
            </button>
            {userEmail && onSendEmail ? (
              <button
                onClick={handleSendEmail}
                className="w-full sm:flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium order-1 sm:order-2 shadow-sm text-sm"
              >
                <span>📧</span>
                <span>Envoyer par email</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  copyToClipboard();
                  onClose();
                }}
                className="w-full sm:flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium order-1 sm:order-2 shadow-sm text-sm"
              >
                <span>📋</span>
                <span>Copier et fermer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
