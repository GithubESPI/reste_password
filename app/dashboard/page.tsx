"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import useSWR from "swr";
import ProfileCard from "../../components/ProfileCard";
import SuccessModal from "../../components/SuccessModal";
import EmailSentModal from "../../components/EmailSentModal";
import EmailSendingAnimation from "../../components/EmailSendingAnimation";
import LogsModal from "../../components/LogsModal";

// Interfaces TypeScript
interface User {
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
}

interface SessionWithToken {
  accessToken?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundUserType, setFoundUserType] = useState("");
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    userName: "",
    temporaryPassword: "",
    userEmail: ""
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
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Fonction de recherche simple
  const searchInText = (text: string, query: string): boolean => {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
  };

  // Fonction fetcher pour SWR appelant notre nouvelle API backend
  const fetcher = async (url: string) => {
    if (status !== "authenticated") {
      throw new Error('Non authentifié');
    }
    
    console.log('🔄 Récupération des utilisateurs via API backend...');
    const response = await axios.get(url);
    return response.data.users || [];
  };

  // Utiliser SWR pour récupérer les utilisateurs
  const { data: allUsers = [], error: usersError, isLoading: usersLoading } = useSWR(
    status === "authenticated" ? '/api/users' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache pendant 1 minute
    }
  );

  const searchStudents = (query: string) => {
    console.log('🔍 Recherche démarrée pour:', query);
    setIsSearching(true);
    setSearchError("");
    setFoundUserType("");
    
    try {
      // Filtrer les étudiants depuis les données SWR
      const students = allUsers.filter((user: User) => {
        const isStudent = user.employeeType && user.employeeType.toLowerCase() === 'student';
        return isStudent;
      });
      
      console.log('🎓 Étudiants trouvés:', students.length);
      
      // Si une recherche est effectuée, filtrer les étudiants
      let filteredStudents = students;
      if (query && query.trim()) {
        filteredStudents = students.filter((user: User) => {
          const searchFields = [
            user.displayName || '',
            user.mail || '',
            user.jobTitle || '',
            user.department || '',
            user.companyName || '',
            ...(user.otherMails || [])
          ];
          return searchFields.some(field => searchInText(field, query));
        });
      }
      
      console.log('📋 Résultats finaux:', filteredStudents.length);
      setSearchResults(filteredStudents);
    } catch (error: any) {
      console.error("Erreur lors de la recherche:", error);
      setSearchError(`Erreur lors de la recherche d'étudiants: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents(searchQuery);
  };

  // Gérer les erreurs SWR
  useEffect(() => {
    if (usersError) {
      console.error("Erreur SWR:", usersError);
      if (usersError.response?.status === 401) {
        setSearchError("❌ Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else if (usersError.response?.status === 403) {
        setSearchError("❌ Permissions insuffisantes. Contactez votre administrateur.");
      } else {
        setSearchError(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
      }
    }
  }, [usersError, router]);


  const handlePasswordReset = async (userId: string, userName: string, temporaryPassword: string, userEmail?: string) => {
    try {
      await axios.post('/api/reset-password', {
        userId,
        userName,
        userEmail,
        temporaryPassword
      });

      // Afficher la modal de succès
      setSuccessModal({
        isOpen: true,
        userName,
        temporaryPassword,
        userEmail: userEmail || ""
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      if ((error as { response?: { status?: number } }).response?.status === 403) {
        alert(`❌ Permissions insuffisantes côté application pour réinitialiser le mot de passe.\n\n🔧 Actions requises :\nAssurez-vous que l'application Azure AD possède la permission de type 'Application' (et non Déléguée) pour User-PasswordProfile.ReadWrite.All et qu'elle est approuvée par l'administrateur.`);
      } else {
        alert(`Erreur lors de la réinitialisation du mot de passe: ${(error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as { message?: string }).message}`);
      }
      throw error; // Re-throw pour que la modal puisse gérer l'erreur
    }
  };

  const handleSendEmail = async (userName: string, temporaryPassword: string, userEmail: string) => {
    // Fermer la modal de succès et afficher l'animation
    setSuccessModal({ isOpen: false, userName: "", temporaryPassword: "", userEmail: "" });
    setEmailSendingAnimation({ isOpen: true, userEmail });

    try {
      // Simuler un délai d'envoi pour voir l'animation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await axios.post('/api/send-email', {
        userName,
        temporaryPassword,
        userEmail
      });

      // Fermer l'animation et afficher la modal de succès
      setEmailSendingAnimation({ isOpen: false, userEmail: "" });

      if (response.data.success) {
        setEmailSentModal({ isOpen: true, userEmail });
      } else {
        alert('❌ Erreur lors de l\'envoi de l\'email de secours');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      setEmailSendingAnimation({ isOpen: false, userEmail: "" });
      const errorMessage = error.response?.data?.error || error.message || "Erreur inconnue";
      alert(`❌ Erreur lors de l'envoi de l'email : ${errorMessage}`);
    }
  };

  if (status === "loading" || usersLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center animate-pulse-glow">
            <span className="text-white text-3xl">🔐</span>
          </div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium mt-8 animate-pulse">Synchronisation avec l'annuaire...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation */}
      <nav className="relative px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🔐</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PasswordManager</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {session?.user?.image && (
                <Image 
                  src={session.user.image} 
                  alt="Avatar" 
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </nav>

      {/* Bouton d'historique flottant ou intégré */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsLogsModalOpen(true)}
          className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 p-4 rounded-full shadow-xl hover:shadow-2xl border border-blue-100 dark:border-gray-700 transition-all transform hover:scale-105 flex items-center justify-center group"
          title="Historique des actions"
        >
          <span className="text-xl">📜</span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-medium ml-0 group-hover:ml-2 opacity-0 group-hover:opacity-100">
            Historique
          </span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-20">
              <div className="w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              {/* Welcome message */}
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-8">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Bienvenue, {session?.user?.name || session?.user?.email} !
              </div>

                  {/* Main heading */}
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Recherchez un 
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {" "}étudiant
                    </span>
                  </h1>

              {/* Subheading */}
              

              {/* Search Section */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  
                </h2>
                
                  {/* Search Bar */}
                  <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-2">
                        <div className="flex items-center space-x-3 px-4 py-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un étudiant par nom ou email..."
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            disabled={isSearching}
                          />
                          <button
                            type="submit"
                            disabled={isSearching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            {isSearching ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Rechercher"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Search Results */}
                  {searchError && (
                    <div className="mt-6 max-w-2xl mx-auto">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-red-800">{searchError}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="mt-12 w-full animate-fade-in">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-left border-b pb-2">
                        Étudiants trouvés ({searchResults.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 place-items-stretch">
                        {searchResults.map((student: User, index: number) => (
                          <div 
                            key={student.id} 
                            className="transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl opacity-0 animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                          >
                            <ProfileCard 
                              user={student} 
                              onPasswordReset={(userId, userName, temporaryPassword) => 
                                handlePasswordReset(userId, userName, temporaryPassword, student.otherMails?.[0] || student.mail)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && !isSearching && !searchError && (
                    <div className="mt-8 max-w-2xl mx-auto text-center">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <svg className="w-8 h-8 text-yellow-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-yellow-800">Aucun étudiant trouvé pour &quot;{searchQuery}&quot;</p>
                        {foundUserType && (
                          <p className="text-sm text-yellow-600 mt-1">
                            Une personne correspondante a été trouvée mais n&apos;est pas de type étudiant(e): <span className="font-semibold">{foundUserType}</span>
                          </p>
                        )}
                        <div className="text-sm text-yellow-600 mt-2 space-y-1">
                          <p>💡 <strong>Conseils de recherche :</strong></p>
                          <ul className="text-left list-disc list-inside ml-4 space-y-1">
                            <li>Essayez avec ou sans accents (ex: &quot;José&quot; ou &quot;Jose&quot;)</li>
                            <li>Recherchez par prénom, nom ou email </li>
                            <li>La recherche ignore les majuscules</li>
                            <li>Seuls les utilisateurs de type &quot;Student&quot; sont affichés </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, userName: "", temporaryPassword: "", userEmail: "" })}
        userName={successModal.userName}
        temporaryPassword={successModal.temporaryPassword}
        userEmail={successModal.userEmail}
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
