'use client';

import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full max-h-[95vh] overflow-y-auto">
        {/* Header avec gradient vert */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl sm:text-2xl">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white">Email envoyé</h2>
              <p className="text-green-100 text-xs sm:text-sm">Opération réussie</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {/* Message de succès */}
          <div className="mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 dark:text-green-400 text-lg">📧</span>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                    Email de secours envoyé avec succès !
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Le mot de passe temporaire a été envoyé à : <span className="font-semibold">{userEmail}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Informations importantes */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Prochaines étapes :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>L&apos;utilisateur recevra l&apos;email avec le mot de passe temporaire</li>
                      <li>Il devra se reconnecter avec ce nouveau mot de passe</li>
                      <li>Il sera forcé de changer son mot de passe à la prochaine connexion</li>
                      <li>Vérifiez que l&apos;email est bien arrivé dans la boîte de réception</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Important :</strong>
                    <p className="mt-1">
                      Assurez-vous que l&apos;utilisateur a bien accès à cette adresse email. 
                      Si l&apos;email n&apos;arrive pas, vérifiez les spams ou contactez l&apos;utilisateur directement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>✅</span>
              <span>Parfait</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
