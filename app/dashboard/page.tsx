"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import useSWR from "swr";
import ProfileCard, { ProfileCardUser } from "../../components/ProfileCard";
import SuccessModal from "../../components/SuccessModal";
import EmailSentModal from "../../components/EmailSentModal";
import EmailSendingAnimation from "../../components/EmailSendingAnimation";
import LogsModal, { LogEntry } from "../../components/LogsModal";
import { LastResetInfo } from "../../components/PasswordResetModal";

interface IndexedStudent extends ProfileCardUser {
  _searchKey: string;
}

const PAGE_SIZE = 24;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IndexedStudent[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    userName: string;
    temporaryPassword: string;
    userEmail: string;
    studentEspiEmail?: string;
  }>({
    isOpen: false,
    userName: "",
    temporaryPassword: "",
    userEmail: "",
    studentEspiEmail: ""
  });
  const [emailSentModal, setEmailSentModal] = useState({
    isOpen: false,
    userEmail: ""
  });
  const [emailSendingAnimation, setEmailSendingAnimation] = useState({
    isOpen: false,
    userEmail: ""
  });
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Fetchers SWR
  const fetcherUsers = async (url: string) => {
    if (status !== "authenticated") {
      throw new Error('Non authentifié');
    }
    const response = await axios.get(url);
    return response.data.users || [];
  };

  const fetcherLogs = async (url: string) => {
    const response = await axios.get(url);
    return response.data.logs || [];
  };

  // Récupération des utilisateurs avec SWR (cache en mémoire)
  const { data: allUsers = [], error: usersError, isLoading: usersLoading, mutate } = useSWR<ProfileCardUser[]>(
    status === "authenticated" ? '/api/users' : null,
    fetcherUsers,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  // Synchronisation en direct de l'historique partagé (toutes les 4 secondes)
  const { data: sharedLogs = [], mutate: mutateLogs } = useSWR<LogEntry[]>(
    status === "authenticated" ? '/api/logs' : null,
    fetcherLogs,
    {
      refreshInterval: 4000,
      revalidateOnFocus: true,
    }
  );

  // Récupération de la dernière réinitialisation la plus récente pour un étudiant (par ID, emails institutionnels, emails personnels ou nom)
  const getStudentLastReset = useCallback((student: ProfileCardUser): LastResetInfo | null => {
    if (!sharedLogs || sharedLogs.length === 0) return null;

    const studentId = student.id?.toLowerCase().trim();
    const studentMail = student.mail?.toLowerCase().trim();
    const studentUpn = student.userPrincipalName?.toLowerCase().trim();
    const studentName = student.displayName?.toLowerCase().trim();
    const otherMails = (student.otherMails || [])
      .map((m) => m?.toLowerCase().trim())
      .filter(Boolean);

    let latestReset: LastResetInfo | null = null;
    let latestTime = 0;

    for (const log of sharedLogs) {
      if (log.action !== 'RESET_PASSWORD') continue;

      const targetId = log.targetUserId?.toLowerCase().trim();
      const targetEmail = log.targetUserEmail?.toLowerCase().trim();
      const targetName = log.targetUserName?.toLowerCase().trim();

      // Correspondance multi-critères exhaustive
      const isMatch =
        (studentId && (targetId === studentId || targetEmail === studentId)) ||
        (studentMail && (targetId === studentMail || targetEmail === studentMail)) ||
        (studentUpn && (targetId === studentUpn || targetEmail === studentUpn)) ||
        (targetEmail && otherMails.includes(targetEmail)) ||
        (targetId && otherMails.includes(targetId)) ||
        (studentName && targetName && studentName === targetName);

      if (isMatch) {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime > latestTime) {
          latestTime = logTime;
          latestReset = {
            timestamp: log.timestamp,
            performedByName: log.performedByName,
            performedByEmail: log.performedByEmail,
          };
        }
      }
    }

    return latestReset;
  }, [sharedLogs]);

  // Pré-indexation ultra-rapide des étudiants
  const indexedStudents = useMemo<IndexedStudent[]>(() => {
    const list = allUsers.filter((user: ProfileCardUser) => {
      return user.employeeType && user.employeeType.toLowerCase() === 'student';
    });

    return list.map((user: ProfileCardUser) => {
      const raw = `${user.displayName || ''} ${user.mail || ''} ${user.jobTitle || ''} ${user.department || ''} ${(user.otherMails || []).join(' ')}`;
      return {
        ...user,
        _searchKey: raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
      };
    });
  }, [allUsers]);

  // Recherche exécutée en < 1ms
  const executeSearch = useCallback((query: string) => {
    setSearchError("");
    const trimmed = query.trim();

    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setVisibleLimit(PAGE_SIZE);
      return;
    }

    setHasSearched(true);
    setIsSearching(true);

    try {
      const cleanQuery = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const results = indexedStudents.filter((student) => student._searchKey.includes(cleanQuery));

      setSearchResults(results);
      setVisibleLimit(PAGE_SIZE);
    } catch (error: any) {
      console.error("Erreur lors de la recherche:", error);
      setSearchError(`Erreur de recherche: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  }, [indexedStudents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    executeSearch(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setVisibleLimit(PAGE_SIZE);
  };

  const handleLoadMore = () => {
    setVisibleLimit((prev) => prev + PAGE_SIZE);
  };

  const handleForceRefresh = async () => {
    try {
      setIsManuallyRefreshing(true);
      await mutate(fetcherUsers('/api/users?refresh=true'), { revalidate: true });
    } catch (err) {
      console.error("Erreur lors du rafraîchissement:", err);
    } finally {
      setIsManuallyRefreshing(false);
    }
  };

  useEffect(() => {
    if (usersError) {
      console.error("Erreur SWR:", usersError);
      if (usersError.response?.status === 401) {
        setSearchError("❌ Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (usersError.response?.status === 403) {
        setSearchError("❌ Permissions insuffisantes dans Azure AD.");
      } else {
        setSearchError(`Erreur de connexion à l'annuaire: ${usersError.message}`);
      }
    }
  }, [usersError, router]);

  const handlePasswordReset = async (
    userId: string, 
    userName: string, 
    temporaryPassword: string, 
    userEmail?: string,
    studentEspiEmail?: string
  ) => {
    try {
      const response = await axios.post('/api/reset-password', {
        userId,
        userName,
        userEmail,
        temporaryPassword
      });

      // Mise à jour instantanée du cache local des logs partagés (0ms de latence) avec revalidation en tâche de fond
      if (response.data?.log) {
        await mutateLogs(
          (prevLogs) => [response.data.log, ...(prevLogs || []).filter((l) => l.id !== response.data.log.id)],
          { revalidate: true }
        );
      } else {
        await mutateLogs();
      }

      setSuccessModal({
        isOpen: true,
        userName,
        temporaryPassword,
        userEmail: userEmail || "",
        studentEspiEmail: studentEspiEmail || ""
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      const err = error as { response?: { status?: number; data?: { error?: string } }; message?: string };
      if (err.response?.status === 403) {
        alert(`❌ Permissions Azure AD requises : l'application doit posséder l'autorisation 'User-PasswordProfile.ReadWrite.All' validée par l'administrateur.`);
      } else {
        alert(`Erreur de réinitialisation : ${err.response?.data?.error || err.message || 'Erreur inconnue'}`);
      }
      throw error;
    }
  };

  const handleSendEmail = async (
    userName: string, 
    temporaryPassword: string, 
    userEmail: string,
    studentEspiEmail?: string
  ) => {
    setSuccessModal({ isOpen: false, userName: "", temporaryPassword: "", userEmail: "", studentEspiEmail: "" });
    setEmailSendingAnimation({ isOpen: true, userEmail });

    try {
      const response = await axios.post('/api/send-email', {
        userName,
        temporaryPassword,
        userEmail,
        studentEspiEmail: studentEspiEmail || undefined
      });

      setEmailSendingAnimation({ isOpen: false, userEmail: "" });

      if (response.data.success) {
        // Mise à jour instantanée du journal après l'envoi de l'email
        if (response.data?.log) {
          await mutateLogs(
            (prevLogs) => [response.data.log, ...(prevLogs || []).filter((l) => l.id !== response.data.log.id)],
            { revalidate: true }
          );
        } else {
          await mutateLogs();
        }
        setEmailSentModal({ isOpen: true, userEmail });
      } else {
        alert("❌ Erreur lors de l'envoi de l'email de secours");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      setEmailSendingAnimation({ isOpen: false, userEmail: "" });
      const errorMessage = error.response?.data?.error || error.message || "Erreur inconnue";
      alert(`❌ Erreur lors de l'envoi de l'email : ${errorMessage}`);
    }
  };

  const handleLogout = async () => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const expireDate = "Thu, 01 Jan 1970 00:00:01 GMT";
      const domain = window.location.hostname;
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const rawName = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (
          rawName.includes("next-auth") ||
          rawName.includes("__Secure-next-auth") ||
          rawName.includes("__Host-next-auth")
        ) {
          document.cookie = `${rawName}=; Path=/; Expires=${expireDate};`;
          document.cookie = `${rawName}=; Path=/; Domain=${domain}; Expires=${expireDate};`;
          document.cookie = `${rawName}=; Path=/api/auth; Expires=${expireDate};`;
        }
      }
    }
    await signOut({ callbackUrl: "/login" });
  };

  const visibleResults = useMemo(() => {
    return searchResults.slice(0, visibleLimit);
  }, [searchResults, visibleLimit]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Barre de progression si l'annuaire est en cours de synchronisation en arrière-plan */}
      {(usersLoading || isManuallyRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100 dark:bg-gray-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-pulse w-full"></div>
        </div>
      )}

      {/* Navigation Responsive */}
      <nav className="relative px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Titre */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm sm:text-base">🔐</span>
            </div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
              PasswordManager
            </span>
          </div>
          
          {/* Info Utilisateur & Bouton Déconnexion */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm max-w-[140px] sm:max-w-[220px]">
              {session?.user?.image ? (
                <Image 
                  src={session.user.image} 
                  alt="Avatar" 
                  width={24}
                  height={24}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-1 ring-blue-500 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium shadow-sm shrink-0 cursor-pointer"
              title="Se déconnecter"
            >
              <span className="hidden sm:inline">Déconnexion</span>
              <span className="sm:hidden">Sortir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bouton d'historique flottant responsive */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          onClick={() => setIsLogsModalOpen(true)}
          className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 p-3.5 sm:p-4 rounded-full shadow-2xl hover:shadow-2xl border border-blue-100 dark:border-gray-700 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center group relative ring-2 ring-blue-500/10"
          title="Historique partagé des actions"
          aria-label="Historique des actions"
        >
          <span className="text-xl sm:text-2xl">📜</span>
          {sharedLogs.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm">
              {sharedLogs.length > 99 ? '99+' : sharedLogs.length}
            </span>
          )}
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-medium ml-0 group-hover:ml-2 opacity-0 group-hover:opacity-100 text-xs sm:text-sm">
            Historique ({sharedLogs.length})
          </span>
        </button>
      </div>

      {/* Hero & Search Section */}
      <div className="relative px-4 sm:px-6 py-8 sm:py-12 md:py-14 max-w-7xl mx-auto">
        <div className="text-center">
          {/* Effet d'arrière plan */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-20 pointer-events-none">
            <div className="w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            {/* Badge de session */}
            <div className="inline-flex items-center px-3.5 py-1 sm:px-4 sm:py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-green-200 dark:border-green-800 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Session active : {session?.user?.name || 'Administrateur'}
            </div>

            {/* Titre principal responsive */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 sm:mb-4 text-gray-900 dark:text-white">
              Recherchez un{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                étudiant
              </span>
            </h1>

            {/* Statut de l'annuaire */}
            <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
              {usersLoading ? (
                <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Synchronisation de l&apos;annuaire en cours...</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span><strong>{indexedStudents.length}</strong> étudiants synchronisés</span>
                  <button
                    onClick={handleForceRefresh}
                    disabled={isManuallyRefreshing}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-transform active:rotate-180"
                    title="Forcer la resynchronisation avec Azure AD"
                    aria-label="Actualiser l'annuaire"
                  >
                    {isManuallyRefreshing ? '⏳' : '🔄'}
                  </button>
                </div>
              )}
            </div>

            {/* Barre de Recherche Responsive */}
            <div className="mb-8 sm:mb-10">
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-1 sm:p-2 shadow-xl">
                    <div className="flex items-center space-x-2 sm:space-x-3 px-2.5 sm:px-3 py-1.5 sm:py-2">
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleInputChange}
                        placeholder="Rechercher par nom, prénom ou email..."
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base py-1"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 transition-colors shrink-0"
                          title="Effacer la recherche"
                          aria-label="Effacer le texte de recherche"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSearching}
                        className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all text-xs sm:text-sm font-medium shadow-md flex items-center space-x-1.5 shrink-0 active:scale-95"
                      >
                        {isSearching ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Rechercher</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Message d'erreur */}
              {searchError && (
                <div className="mt-6 max-w-2xl mx-auto animate-fade-in">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3.5 sm:p-4 text-left">
                    <div className="flex items-center text-red-800 dark:text-red-300 text-xs sm:text-sm">
                      <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{searchError}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Résultats de recherche - Grille 100% responsive */}
              {searchResults.length > 0 && (
                <div className="mt-8 sm:mt-12 w-full animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
                      <span>Étudiants trouvés</span>
                      <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold">
                        {searchResults.length}
                      </span>
                      {searchResults.length > visibleLimit && (
                        <span className="text-xs text-gray-500 font-normal">
                          ({visibleResults.length} affichés)
                        </span>
                      )}
                    </h3>
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Réinitialiser le filtre
                      </button>
                    )}
                  </div>
                  
                  {/* Grille adaptative : 1 col (mobile), 2 cols (tablette), 3-4 cols (desktop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5 place-items-stretch">
                    {visibleResults.map((student: IndexedStudent) => {
                      const lastReset = getStudentLastReset(student);

                      return (
                        <div 
                          key={student.id} 
                          className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl w-full"
                        >
                          <ProfileCard 
                            user={student} 
                            lastResetInfo={lastReset}
                            onPasswordReset={(userId, userName, temporaryPassword) => 
                              handlePasswordReset(
                                userId, 
                                userName, 
                                temporaryPassword, 
                                student.otherMails?.[0] || student.mail || student.userPrincipalName,
                                student.mail || student.userPrincipalName
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Bouton pour charger plus de résultats */}
                  {searchResults.length > visibleLimit && (
                    <div className="mt-8 sm:mt-10 text-center">
                      <button
                        onClick={handleLoadMore}
                        className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center space-x-2 text-sm"
                      >
                        <span>Afficher plus ({visibleLimit} sur {searchResults.length})</span>
                        <span>↓</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* État : Aucun résultat */}
              {hasSearched && searchResults.length === 0 && !isSearching && !searchError && !usersLoading && (
                <div className="mt-8 max-w-2xl mx-auto text-center animate-fade-in px-2">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 sm:p-8">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-800/30 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      🔍
                    </div>
                    <p className="text-yellow-800 dark:text-yellow-200 font-semibold mb-1 text-sm sm:text-base">
                      Aucun étudiant trouvé pour &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Vérifiez l&apos;orthographe du prénom, du nom ou de l&apos;adresse email.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, userName: "", temporaryPassword: "", userEmail: "", studentEspiEmail: "" })}
        userName={successModal.userName}
        temporaryPassword={successModal.temporaryPassword}
        userEmail={successModal.userEmail}
        studentEspiEmail={successModal.studentEspiEmail}
        onSendEmail={handleSendEmail}
      />

      {/* Modal d'envoi d'email */}
      <EmailSentModal
        isOpen={emailSentModal.isOpen}
        onClose={() => setEmailSentModal({ isOpen: false, userEmail: "" })}
        userEmail={emailSentModal.userEmail}
      />

      {/* Animation d'envoi d'email */}
      <EmailSendingAnimation 
        isOpen={emailSendingAnimation.isOpen} 
        userEmail={emailSendingAnimation.userEmail} 
      />

      {/* Logs Modal */}
      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
}
