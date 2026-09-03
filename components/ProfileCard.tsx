'use client';

import React, { useState } from 'react';
import MagicContainer from './MagicContainer';
import PasswordResetModal, { LastResetInfo } from './PasswordResetModal';

export interface ProfileCardUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
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
}

interface ProfileCardProps {
  user: ProfileCardUser;
  onPasswordReset?: (userId: string, userName: string, temporaryPassword: string) => void;
  lastResetInfo?: LastResetInfo | null;
}

export default function ProfileCard({ user, onPasswordReset, lastResetInfo }: ProfileCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .filter(Boolean)
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
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

  const formatShortDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return `le ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  const formatAccountCreationDate = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatSignInDate = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const espiEmail = user.mail || user.userPrincipalName || 'Email non disponible';
  const recoveryEmail = user.otherMails && user.otherMails.length > 0 ? user.otherMails[0] : null;

  return (
    <div className="flex items-center justify-center p-1 w-full h-full">
      <MagicContainer className="w-full h-full">
        <div className="w-full h-full rounded-[23px] bg-gray-900 shadow-xl overflow-hidden border border-gray-800 flex flex-col justify-between">
          {/* Profile Section */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Avatar et nom */}
              <div className="flex items-center space-x-3.5 mb-3.5">
                <div className="relative flex-shrink-0">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {getInitials(user.displayName, user.mail)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900" title="Compte actif"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate" title={user.displayName}>
                    {user.displayName || 'Nom non disponible'}
                  </h2>
                  <p className="text-xs text-blue-300 truncate" title={espiEmail}>
                    {espiEmail}
                  </p>
                  {recoveryEmail && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5" title={`Email de secours : ${recoveryEmail}`}>
                      📧 {recoveryEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Badge de réinitialisation partagée si une session l'a déjà fait */}
              {lastResetInfo && (
                <div className="mb-3 bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 flex items-center space-x-2 shadow-sm animate-fade-in">
                  <span className="text-amber-400 text-base flex-shrink-0">🔑</span>
                  <div className="text-[11px] text-amber-200 leading-tight min-w-0 flex-1">
                    <span className="font-semibold text-amber-300 block truncate">
                      Réinitialisé {formatShortDate(lastResetInfo.timestamp)}
                    </span>
                    <p className="text-gray-300 truncate text-[10px] mt-0.5">
                      par <span className="text-amber-100 font-medium">{lastResetInfo.performedByName}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Informations en grille */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* Formation / Intitulé */}
                {user.jobTitle && (
                  <div className="bg-gray-800/80 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-[11px] mb-0.5">
                      <span>💼</span>
                      <span>Formation / Poste</span>
                    </div>
                    <div className="text-white font-medium truncate" title={user.jobTitle}>{user.jobTitle}</div>
                  </div>
                )}

                {/* Campus / Entreprise */}
                {user.companyName && (
                  <div className="bg-gray-800/80 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-[11px] mb-0.5">
                      <span>🏢</span>
                      <span>Campus / Entreprise</span>
                    </div>
                    <div className="text-white font-medium truncate" title={user.companyName}>{user.companyName}</div>
                  </div>
                )}

                {/* Département */}
                {user.department && (
                  <div className="bg-gray-800/80 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-[11px] mb-0.5">
                      <span>📚</span>
                      <span>Département</span>
                    </div>
                    <div className="text-white font-medium truncate" title={user.department}>{user.department}</div>
                  </div>
                )}

                {/* Statut de l'étudiant */}
                {user.employeeType && (
                  <div className="bg-gray-800/80 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-[11px] mb-0.5">
                      <span>🎓</span>
                      <span>Statut</span>
                    </div>
                    <div className="text-emerald-400 font-semibold truncate capitalize">
                      {user.employeeType.toLowerCase() === 'student' ? 'Étudiant ESPI' : user.employeeType}
                    </div>
                  </div>
                )}

                {/* Date de création de compte */}
                {user.createdDateTime && (
                  <div className="bg-gray-800/80 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-[11px] mb-0.5">
                      <span>📅</span>
                      <span>Date d&apos;inscription</span>
                    </div>
                    <div className="text-gray-200 font-medium text-[11px]">
                      {formatAccountCreationDate(user.createdDateTime)}
                    </div>
                  </div>
                )}

                {/* Dernière connexion interactive */}
                {user.signInActivity?.lastSignInDateTime && (
                  <div className="bg-gray-800/80 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-green-400 text-[11px] mb-0.5">
                      <span>🟢</span>
                      <span className="font-medium">Dernière connexion</span>
                    </div>
                    <div className="text-white font-medium text-[11px]">
                      {formatSignInDate(user.signInActivity.lastSignInDateTime)}
                    </div>
                  </div>
                )}

                {/* Statut par défaut si peu d'informations additionnelles */}
                {!user.jobTitle && !user.department && !user.companyName && !user.employeeType && (
                  <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 text-blue-300 text-[11px] mb-0.5">
                      <span>🎓</span>
                      <span className="font-medium">Statut</span>
                    </div>
                    <div className="text-blue-200 font-medium text-xs">
                      Étudiant actif
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de réinitialisation */}
            {onPasswordReset && (
              <div className="bg-gray-800/90 rounded-xl p-2.5 mt-3 border border-gray-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-gray-300">
                    <span className="text-sm">🔐</span>
                    <span className="font-medium text-xs">Accès</span>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shadow-sm active:scale-95 cursor-pointer hover:shadow-red-600/30 hover:shadow-md"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </MagicContainer>
      
      {/* Modal de réinitialisation monté à la demande */}
      {isModalOpen && (
        <PasswordResetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userName={user.displayName || user.mail || 'Utilisateur'}
          onConfirm={handlePasswordReset}
          isLoading={isResetting}
          lastResetInfo={lastResetInfo}
        />
      )}
    </div>
  );
}
