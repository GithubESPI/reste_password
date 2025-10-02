"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import ProfileCard from "../../components/ProfileCard";
import SuccessModal from "../../components/SuccessModal";
import EmailSentModal from "../../components/EmailSentModal";
import EmailSendingAnimation from "../../components/EmailSendingAnimation";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Fonction pour normaliser les textes (supprimer accents et casse, garder espaces)
  const normalizeText = (text: string): string => {
    if (!text) return '';
    
    return text
      .toLowerCase() // Convertir en minuscules
      .normalize('NFD') // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime tous les accents
      .replace(/[^a-z0-9\s]/g, '') // Garde lettres, chiffres et espaces
      .replace(/\s+/g, ' ') // Normalise les espaces multiples
      .trim();
  };

  // Fonction pour vérifier si un texte contient la recherche (insensible aux accents et casse)
  const containsSearch = (text: string, searchQuery: string): boolean => {
    if (!text || !searchQuery) return false;
    
    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchQuery);
    
    console.log(`🔍 Recherche dans "${text}" avec "${searchQuery}"`);
    console.log(`📝 Normalisé: "${normalizedText}" contient "${normalizedSearch}"`);
    
    // Recherche exacte
    if (normalizedText.includes(normalizedSearch)) {
      console.log('✅ Match exact trouvé');
      return true;
    }
    
    // Recherche par mots séparés (ex: "chiara simon" trouve "Chiara Simon")
    const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0);
    if (searchWords.length > 1) {
      const allWordsFound = searchWords.every(word => normalizedText.includes(word));
      console.log(`🔤 Recherche par mots: ${searchWords.join(', ')} - Tous trouvés: ${allWordsFound}`);
      return allWordsFound;
    }
    
    console.log('❌ Aucun match');
    return false;
  };

  const searchStudents = async (query: string) => {
    if (!query.trim() || !(session as SessionWithToken)?.accessToken) return;
    
    console.log('🔍 Recherche démarrée pour:', query);
    setIsSearching(true);
    setSearchError("");
    setFoundUserType("");
    
    try {
      // Recherche optimisée : utiliser l'API de recherche Microsoft Graph
      const response = await axios.get(`${process.env.NEXT_PUBLIC_GRAPH_API}/users`, {
        headers: {
          Authorization: `Bearer ${(session as SessionWithToken).accessToken}`,
        },
        params: {
          $filter: `startswith(displayName,'${query}') or startswith(mail,'${query}') or contains(displayName,'${query}') or contains(mail,'${query}')`,
          $select: "id,displayName,mail,otherMails,jobTitle,department,companyName,employeeType,createdDateTime",
          $top: 50 // Limite raisonnable pour la performance
        }
      });
      
      console.log('📊 Utilisateurs trouvés par l\'API:', response.data.value?.length || 0);
      
      // Filtrer côté client pour ne garder que les étudiants
      const allUsers = response.data.value || [];
      console.log('👥 Utilisateurs récupérés:', allUsers.map((u: User) => ({ name: u.displayName, type: u.employeeType })));
      
      const students = allUsers.filter((user: User) => {
        // Vérifier que c'est un étudiant
        const isStudent = user.employeeType && user.employeeType.toLowerCase() === 'student';
        console.log(`🔍 ${user.displayName} - Type: ${user.employeeType} - Est étudiant: ${isStudent}`);
        
        if (!isStudent) return false;
        // Recherche flexible dans tous les champs disponibles
        const searchFields = [
          user.displayName || '',
          user.mail || '',
          user.jobTitle || '',
          user.department || '',
          user.companyName || '',
          ...(user.otherMails || [])
        ];
        
        // Recherche dans tous les champs avec normalisation
        const matches = searchFields.some(field => {
          if (!field) return false;
          const result = containsSearch(field, query);
          if (result) console.log(`✅ Match trouvé dans "${field}" pour "${query}"`);
          return result;
        });
        
        console.log(`🎯 ${user.displayName} - Correspond: ${matches}`);
        return matches;
      });
      
      console.log('🎓 Étudiants trouvés:', students.length);
      
      // Utiliser directement les étudiants trouvés (sans récupérer les données de connexion pour éviter les erreurs 429)
      const studentsWithSignInActivity = students;
      
      // Si aucun étudiant trouvé, chercher des utilisateurs correspondants pour information
      if (studentsWithSignInActivity.length === 0) {
        const matchingUsers = allUsers.filter((user: User) => {
          const searchFields = [
            user.displayName || '',
            user.mail || '',
            user.jobTitle || '',
            user.department || '',
            user.companyName || '',
            ...(user.otherMails || [])
          ];
          return searchFields.some(field => {
            if (!field) return false;
            return containsSearch(field, query);
          });
        });
        
        if (matchingUsers.length > 0) {
          setFoundUserType(matchingUsers[0].employeeType || 'Inconnu');
        }
      }
      
      console.log('📋 Résultats finaux:', studentsWithSignInActivity.length);
      setSearchResults(studentsWithSignInActivity);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setSearchError("Erreur lors de la recherche d'étudiants");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents(searchQuery);
  };


  const handlePasswordReset = async (userId: string, userName: string, temporaryPassword: string, userEmail?: string) => {
    if (!(session as SessionWithToken)?.accessToken) {
      alert("Erreur: Token d'accès non disponible");
      return;
    }

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_GRAPH_API}/users/${userId}`,
        {
          passwordProfile: {
            password: temporaryPassword,
            forceChangePasswordNextSignIn: true
          }
        },
        {
          headers: {
            Authorization: `Bearer ${(session as SessionWithToken).accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

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
        alert(`❌ Permissions insuffisantes pour réinitialiser le mot de passe.\n\n🔧 Actions requises :\n1. Contactez votre administrateur Azure AD\n2. Demandez l'approbation des permissions suivantes :\n   • User.ReadWrite.All\n   • Directory.AccessAsUser.All\n   • User-PasswordProfile.ReadWrite.All\n\n3. L'administrateur doit approuver ces permissions dans Azure Portal\n4. Reconnectez-vous après l'approbation`);
      } else {
        alert(`Erreur lors de la réinitialisation du mot de passe: ${(error as { response?: { data?: { error?: { message?: string } } }; message?: string }).response?.data?.error?.message || (error as { message?: string }).message}`);
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
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      setEmailSendingAnimation({ isOpen: false, userEmail: "" });
      alert('❌ Erreur lors de l\'envoi de l\'email');
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </nav>

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
                            disabled={isSearching || !searchQuery.trim()}
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
                    <div className="mt-8 max-w-4xl mx-auto">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Étudiants trouvés ({searchResults.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((student: User) => (
                          <ProfileCard 
                            key={student.id} 
                            user={student} 
                            onPasswordReset={(userId, userName, temporaryPassword) => 
                              handlePasswordReset(userId, userName, temporaryPassword, student.otherMails?.[0] || student.mail)
                            }
                          />
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
                            Une personne correspondante a été trouvée mais n&apos;est pas de type étudiant: <span className="font-semibold">{foundUserType}</span>
                          </p>
                        )}
                        <div className="text-sm text-yellow-600 mt-2 space-y-1">
                          <p>💡 <strong>Conseils de recherche :</strong></p>
                          <ul className="text-left list-disc list-inside ml-4 space-y-1">
                            <li>Essayez avec ou sans accents (ex: &quot;José&quot; ou &quot;Jose&quot;)</li>
                            <li>Recherchez par prénom, nom ou email</li>
                            <li>La recherche ignore les majuscules</li>
                            <li>Seuls les utilisateurs de type &quot;Student&quot; sont affichés</li>
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
    </div>
  );
}
