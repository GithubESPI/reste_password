'use client';

import React from 'react';
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(temporaryPassword);
    // Optionnel: afficher une notification de copie
  };

  const handleSendEmail = async () => {
    if (onSendEmail && userEmail) {
      await onSendEmail(userName, temporaryPassword, userEmail);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[100dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header avec gradient vert */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl sm:text-2xl">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">Réinitialisation réussie</h2>
              <p className="text-green-100 text-xs sm:text-sm truncate">Mot de passe mis à jour</p>
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
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                    Succès !
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 break-words">
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
                    className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
                    title="Copier le mot de passe"
                  >
                    <span>📋</span>
                    <span className="sm:hidden">Copier</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cliquez sur l&apos;icône pour copier le mot de passe
                </p>
              </div>

              {/* Instructions importantes */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 dark:text-amber-400 text-sm mt-0.5">⚠️</span>
                  <div className="text-sm text-amber-800 dark:text-amber-200 flex-1 min-w-0">
                    <strong className="block mb-2">Instructions importantes :</strong>
                    <ul className="list-disc list-outside ml-4 space-y-1.5">
                      <li>Communiquez ce mot de passe à l&apos;utilisateur</li>
                      <li>L&apos;utilisateur devra se reconnecter immédiatement</li>
                      <li>Il sera forcé de changer son mot de passe à la prochaine connexion</li>
                      <li>Ce mot de passe est temporaire et sécurisé</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email de secours */}
              {userEmail && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 dark:text-purple-400 text-sm mt-0.5">📧</span>
                    <div className="text-sm text-purple-800 dark:text-purple-200 flex-1 min-w-0">
                      <strong className="block mb-1">Email de secours :</strong>
                      <p className="mb-2">
                        Le mot de passe temporaire sera envoyé à l&apos;email personel : <span className="font-semibold break-all">{userEmail}</span>
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Cet email est configuré comme adresse de récupération pour cet utilisateur.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations de sécurité */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-sm mt-0.5">🔒</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200 flex-1 min-w-0">
                    <strong className="block mb-1">Sécurité :</strong>
                    <p>
                      Le mot de passe a été généré automatiquement avec des caractères sécurisés. 
                      Il respecte les politiques de sécurité de votre organisation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions (Footer fixe) */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium order-2 sm:order-1"
            >
              Fermer
            </button>
            {userEmail && onSendEmail ? (
              <button
                onClick={handleSendEmail}
                className="w-full sm:flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium order-1 sm:order-2 shadow-sm"
              >
                <span>📧</span>
                <span>Envoyer par mail</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  copyToClipboard();
                  onClose();
                }}
                className="w-full sm:flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium order-1 sm:order-2 shadow-sm"
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
