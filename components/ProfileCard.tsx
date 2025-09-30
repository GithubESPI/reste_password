'use client';

import React from 'react';
import MagicContainer from './MagicContainer';

interface ProfileCardProps {
  user: {
    id: string;
    displayName?: string;
    mail?: string;
    otherMails?: string[];
    jobTitle?: string;
    department?: string;
  };
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getRandomCoverColor = (id: string) => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-purple-600',
      'bg-gradient-to-r from-green-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-pink-600',
      'bg-gradient-to-r from-orange-500 to-red-600',
      'bg-gradient-to-r from-teal-500 to-green-600',
      'bg-gradient-to-r from-indigo-500 to-purple-600',
    ];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="flex items-center justify-center p-2">
      <MagicContainer className="w-full max-w-sm">
        <div className="w-full rounded-2xl bg-gray-900 shadow-xl overflow-hidden">
          {/* Cover Image */}
          <div className={`relative h-24 ${getRandomCoverColor(user.id)}`}>
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* Profile Content */}
          <div className="relative p-6 pt-8">
            {/* Profile Image */}
            <div className="absolute left-6 -top-8">
              <div className="w-16 h-16 rounded-full border-4 border-gray-900 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {getInitials(user.displayName, user.mail)}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="text-left">
              <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-wide">
                {user.displayName || 'Nom non disponible'}
              </h2>
              <p className="text-sm text-gray-300 mb-1">
                {user.mail || 'Email non disponible'}
              </p>
              {user.otherMails && user.otherMails.length > 0 && (
                <p className="text-xs text-gray-400 mb-2">
                  📧 Email de secours: {user.otherMails[0]}
                </p>
              )}
              {user.jobTitle && (
                <div className="mb-3">
                  <span className="inline-block bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {user.jobTitle}
                  </span>
                </div>
              )}
              <p className="text-gray-400 text-sm">
                {user.department ? `Département: ${user.department}` : 'Étudiant connecté'}
              </p>
            </div>
          </div>
        </div>
      </MagicContainer>
    </div>
  );
}
