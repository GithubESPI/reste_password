'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface LastResetInfo {
  timestamp: string;
  performedByName: string;
  performedByEmail: string;
}

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: (temporaryPassword: string) => void;
  isLoading?: boolean;
  lastResetInfo?: LastResetInfo | null;
}

// Fonction pure de génération cryptographique sécurisée (CSPRNG)
function createSecurePassword(): string {
  if (typeof window === 'undefined' || !window.crypto) {
    return 'Espi2026!Secure';
  }

  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%&*+=-';
  const allChars = upper + lower + digits + specials;

  const getRandomChar = (charset: string) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return charset[array[0] % charset.length];
  };

  // Assurer au moins 2 majuscules, 2 minuscules, 2 chiffres, 2 symboles
  const requiredChars = [
    getRandomChar(upper),
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(lower),
    getRandomChar(digits),
    getRandomChar(digits),
    getRandomChar(specials),
    getRandomChar(specials),
  ];

  // Compléter jusqu'à 14 caractères au total
  for (let i = 0; i < 6; i++) {
    requiredChars.push(getRandomChar(allChars));
  }

  // Mélange de Fisher-Yates cryptographique
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]];
  }

  return requiredChars.join('');
}

export default function PasswordResetModal({ 
  isOpen, 
  onClose, 
  userName, 
  onConfirm, 
  isLoading = false,
  lastResetInfo
}: PasswordResetModalProps) {
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Génération du mot de passe uniquement à l'ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      setTemporaryPassword(createSecurePassword());
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleRegeneratePassword = () => {
    setIsRolling(true);
    setTemporaryPassword(createSecurePassword());
    setTimeout(() => setIsRolling(false), 300);
  };

  const handleConfirm = () => {
    if (temporaryPassword.trim() && !isLoading) {
      onConfirm(temporaryPassword);
    }
  };

  const handleClose = useCallback(() => {
    setTemporaryPassword('');
    setShowPassword(false);
    onClose();
  }, [onClose]);

  // Fermeture par la touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full max-h-[95vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">🔐</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white">Réinitialisation de mot de passe</h2>
              <p className="text-red-100 text-xs sm:text-sm">Action administrative sécurisée</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            {/* Alerte si le mot de passe a déjà été réinitialisé par un autre utilisateur */}
            {lastResetInfo ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-3.5 mb-4 shadow-sm">
                <div className="flex items-start space-x-2.5">
                  <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                  <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    <strong className="block mb-1 font-semibold text-amber-800 dark:text-amber-300">
                      Attention : Action récente détectée
                    </strong>
                    <p className="leading-relaxed">
                      Ce mot de passe a déjà été réinitialisé le{' '}
                      <strong>
                        {new Date(lastResetInfo.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>{' '}
                      par <span className="font-semibold">{lastResetInfo.performedByName}</span>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1 text-sm">
                      Confirmation requise
                    </h3>
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      Vous êtes sur le point de réinitialiser le mot de passe pour <strong>{userName}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe temporaire généré
                </label>
                <div className="flex space-x-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    placeholder="Générer un mot de passe temporaire"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    title="Générer un nouveau mot de passe aléatoire hautement sécurisé"
                    className={`px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all ${
                      isRolling ? 'rotate-180 scale-110' : ''
                    }`}
                  >
                    🎲
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  14 caractères haute sécurité (Majuscules, Minuscules, Chiffres, Symboles).
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                  <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                    <strong>Après la réinitialisation :</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>L&apos;étudiant sera invité à définir son propre mot de passe à sa connexion</li>
                      <li>Le mot de passe temporaire sera à usage unique</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!temporaryPassword.trim() || isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium text-sm shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Réinitialisation...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>{lastResetInfo ? 'Confirmer quand même' : 'Confirmer la réinitialisation'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
