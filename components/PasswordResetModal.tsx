'use client';

import React, { useState } from 'react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: (temporaryPassword: string) => void;
  isLoading?: boolean;
}

export default function PasswordResetModal({ 
  isOpen, 
  onClose, 
  userName, 
  onConfirm, 
  isLoading = false 
}: PasswordResetModalProps) {
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTemporaryPassword(password);
  };

  const handleConfirm = () => {
    if (temporaryPassword.trim()) {
      onConfirm(temporaryPassword);
    }
  };

  const handleClose = () => {
    setTemporaryPassword('');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🔐</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Réinitialisation de mot de passe</h2>
              <p className="text-red-100 text-sm">Action administrative</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Attention
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Vous êtes sur le point de réinitialiser le mot de passe pour <strong>{userName}</strong>. 
                    Cette action est irréversible et l'utilisateur devra se reconnecter.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe temporaire
                </label>
                <div className="flex space-x-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    placeholder="Générer un mot de passe temporaire"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    🎲
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et symboles.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Après la réinitialisation :</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>L'utilisateur recevra le nouveau mot de passe</li>
                      <li>Il devra se reconnecter immédiatement</li>
                      <li>Il sera forcé de changer son mot de passe à la prochaine connexion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!temporaryPassword.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Réinitialisation...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Réinitialiser</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
