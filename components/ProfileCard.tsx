'use client';

import React, { useState } from 'react';
import MagicContainer from './MagicContainer';
import PasswordResetModal from './PasswordResetModal';

interface ProfileCardProps {
  user: {
    id: string;
    displayName?: string;
    mail?: string;
    otherMails?: string[];
    jobTitle?: string;
    department?: string;
    companyName?: string;
    employeeType?: string;
    createdDateTime?: string;
    signInActivity?: {
      lastSignInDateTime?: string;
      lastNonInteractiveSignInDateTime?: string;
      lastSignInRequestId?: string;
    };
  };
  onPasswordReset?: (userId: string, userName: string, temporaryPassword: string) => void;
}

export default function ProfileCard({ user, onPasswordReset }: ProfileCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const handlePasswordReset = async (temporaryPassword: string) => {
    setIsResetting(true);
    try {
      await onPasswordReset?.(user.id, user.displayName || user.mail || 'Utilisateur', temporaryPassword);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    } finally {
      setIsResetting(false);
    }
  };


  return (
    <div className="flex items-center justify-center p-2">
      <MagicContainer className="w-full max-w-xl">
        <div className="w-full rounded-[23px] bg-gray-900 shadow-xl overflow-hidden">
          {/* Profile Section */}
          <div className="p-6">
            {/* Avatar et nom */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {getInitials(user.displayName, user.mail)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">
                  {user.displayName || 'Nom non disponible'}
                </h2>
                <p className="text-sm text-gray-300 truncate">
                  {user.mail || 'Email non disponible'}
                </p>
                {user.otherMails && user.otherMails.length > 0 && (
                  <p className="text-xs text-gray-400 truncate">
                    📧 {user.otherMails[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Informations en grille */}
            <div className="grid grid-cols-1 gap-3">
              {user.jobTitle && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">💼</span>
                    <span className="text-gray-400 text-sm">Poste</span>
                  </div>
                  <div className="text-white font-medium text-sm truncate">{user.jobTitle}</div>
                </div>
              )}
              
              {user.companyName && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">🏢</span>
                    <span className="text-gray-400 text-sm">Entreprise</span>
                  </div>
                  <div className="text-white font-medium text-sm truncate">{user.companyName}</div>
                </div>
              )}
              
              {user.employeeType && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">👤</span>
                    <span className="text-gray-400 text-sm">Type d'employé</span>
                  </div>
                  <div className="text-white font-bold text-sm uppercase">{user.employeeType}</div>
                </div>
              )}
              
              {user.department && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">📚</span>
                    <span className="text-gray-400 text-sm">Département</span>
                  </div>
                  <div className="text-white font-medium text-sm truncate">{user.department}</div>
                </div>
              )}
              
              {user.createdDateTime && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">📅</span>
                    <span className="text-gray-400 text-sm">Date de création</span>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {new Date(user.createdDateTime).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              
              {user.signInActivity?.lastSignInDateTime && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">🔐</span>
                    <span className="text-gray-400 text-sm">Dernière connexion</span>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {new Date(user.signInActivity.lastSignInDateTime).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              
              {user.signInActivity?.lastNonInteractiveSignInDateTime && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">🤖</span>
                    <span className="text-gray-400 text-sm">Dernière connexion automatique</span>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {new Date(user.signInActivity.lastNonInteractiveSignInDateTime).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              
              {user.signInActivity?.lastSignInRequestId && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">🆔</span>
                    <span className="text-gray-400 text-sm">ID de dernière requête</span>
                  </div>
                  <div className="text-white font-mono text-xs truncate">{user.signInActivity.lastSignInRequestId}</div>
                </div>
              )}
              
              {!user.department && user.employeeType && user.employeeType.toLowerCase() === 'student' && (
                <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-green-400 text-sm">🎓</span>
                    <span className="text-green-400 text-sm">Statut</span>
                  </div>
                  <div className="text-green-300 font-bold text-sm">Étudiant connecté</div>
                </div>
              )}
              
              {/* Bouton de réinitialisation de mot de passe */}
              {onPasswordReset && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">🔐</span>
                      <span className="text-gray-400 text-sm">Mot de passe</span>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </MagicContainer>
      
      {/* Modal de réinitialisation de mot de passe */}
      <PasswordResetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userName={user.displayName || user.mail || 'Utilisateur'}
        onConfirm={handlePasswordReset}
        isLoading={isResetting}
      />
    </div>
  );
}
