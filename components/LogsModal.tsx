'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import axios from 'axios';

interface LogEntry {
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

const fetcher = (url: string) => axios.get(url).then(res => res.data.logs);

export default function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const { data: logs, error, isLoading } = useSWR<LogEntry[]>(
    isOpen ? '/api/logs' : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  if (!isOpen || !mounted) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 shrink-0 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">📜</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Historique des actions</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Consultez les dernières réinitialisations</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/50">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p>Erreur lors du chargement de l'historique.</p>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {log.action === 'RESET_PASSWORD' ? '🔑 Réinitialisation' : '📧 Envoi Email'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cible (Étudiant)</p>
                      <p className="font-medium text-gray-900 dark:text-white truncate" title={log.targetUserName}>{log.targetUserName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={log.targetUserEmail}>{log.targetUserEmail || 'Email inconnu'}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">Effectué par</p>
                      <p className="font-medium text-blue-900 dark:text-blue-100 truncate" title={log.performedByName}>{log.performedByName}</p>
                      <p className="text-xs text-blue-700/70 dark:text-blue-300/70 truncate" title={log.performedByEmail}>{log.performedByEmail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              <span className="text-4xl mb-3 block">📭</span>
              <p>Aucun historique disponible pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
