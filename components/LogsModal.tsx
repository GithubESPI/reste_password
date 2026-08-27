'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export interface LogEntry {
  id: string;
  action: 'RESET_PASSWORD' | 'SEND_EMAIL';
  targetUserId: string;
  targetUserName: string;
  targetUserEmail?: string;
  performedByEmail: string;
  performedByName: string;
  timestamp: string;
}

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data.logs);

export default function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'others' | 'today'>('all');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fermeture par la touche Échap
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

  const { data: logs = [], error, isLoading, mutate } = useSWR<LogEntry[]>(
    isOpen ? '/api/logs' : null,
    fetcher,
    { refreshInterval: 4000 } // Actualisation automatique toutes les 4s pour être synchronisé en direct avec les collègues
  );

  const currentUserEmail = session?.user?.email?.toLowerCase();

  // Formatage de la date en français avec temps relatif
  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Filtrage intelligent des logs
  const filteredLogs = useMemo(() => {
    let list = logs;

    // Filtre par onglet
    if (activeTab === 'mine' && currentUserEmail) {
      list = list.filter((l) => l.performedByEmail.toLowerCase() === currentUserEmail);
    } else if (activeTab === 'others' && currentUserEmail) {
      list = list.filter((l) => l.performedByEmail.toLowerCase() !== currentUserEmail);
    } else if (activeTab === 'today') {
      const todayStr = new Date().toDateString();
      list = list.filter((l) => new Date(l.timestamp).toDateString() === todayStr);
    }

    // Filtre par texte recherché
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.targetUserName.toLowerCase().includes(q) ||
          (l.targetUserEmail && l.targetUserEmail.toLowerCase().includes(q)) ||
          l.performedByName.toLowerCase().includes(q) ||
          l.performedByEmail.toLowerCase().includes(q)
      );
    }

    return list;
  }, [logs, activeTab, filterQuery, currentUserEmail]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden animate-slide-up border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 shrink-0 flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-2xl">📜</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Historique Partagé des Actions</h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                Toutes les sessions et réinitialisations effectuées par l&apos;équipe en temps réel
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => mutate()}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              title="Rafraîchir les logs en direct"
            >
              🔄
            </button>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Fermer (Échap)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barre de Recherche et Onglets de Filtrage */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrer par étudiant ou collaborateur..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              Tous ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'mine'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              Mes actions
            </button>
            <button
              onClick={() => setActiveTab('others')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'others'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              Autres collègues
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-900/50">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <p className="text-sm">Erreur lors de la récupération des logs partagés.</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-3.5">
              {filteredLogs.map((log) => {
                const isMyAction = currentUserEmail && log.performedByEmail.toLowerCase() === currentUserEmail;

                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          {log.action === 'RESET_PASSWORD' ? '🔑 Réinitialisation' : '📧 Envoi Email'}
                        </span>
                        {isMyAction ? (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                            Par vous
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            Par un collègue
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-medium">
                        ⏱️ {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {/* Bloc Étudiant cible */}
                      <div className="bg-gray-50 dark:bg-gray-750/50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-400 font-semibold mb-1">
                          Étudiant concerné
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate" title={log.targetUserName}>
                          {log.targetUserName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={log.targetUserEmail}>
                          {log.targetUserEmail || 'Email non renseigné'}
                        </p>
                      </div>

                      {/* Bloc Opérateur */}
                      <div className={`p-3 rounded-lg border ${
                        isMyAction 
                          ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30' 
                          : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
                      }`}>
                        <p className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${
                          isMyAction ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          Effectué par
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate" title={log.performedByName}>
                          {log.performedByName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={log.performedByEmail}>
                          {log.performedByEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="font-medium text-sm">Aucune action trouvée pour ce filtre.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500">
          <span>Actualisation en continu active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
