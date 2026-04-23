import fs from 'fs';
import path from 'path';

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

const LOG_FILE = path.join(process.cwd(), 'action_logs.json');

export const getLogs = (): LogEntry[] => {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des logs:', error);
  }
  return [];
};

export const addLog = (
  logData: Omit<LogEntry, 'id' | 'timestamp'>
): LogEntry => {
  const logs = getLogs();
  
  const newLog: LogEntry = {
    ...logData,
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
  };

  // Ajouter au début et garder seulement les 500 derniers
  const updatedLogs = [newLog, ...logs].slice(0, 500);

  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(updatedLogs, null, 2), 'utf8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture du log:', error);
  }

  return newLog;
};
