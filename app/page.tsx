import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation */}
      <nav className="relative px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AuthApp</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Se connecter
            </Link>
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
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Application d'authentification sécurisée
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Bienvenue sur
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}AuthApp
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Une solution d'authentification moderne et sécurisée avec Azure AD. 
                Connectez-vous facilement avec votre compte Microsoft et accédez à vos données en toute sécurité.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link 
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
                >
                  Se connecter avec Microsoft
                </Link>
                <Link 
                  href="#features"
                  className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg border border-gray-200"
                >
                  En savoir plus
                </Link>
              </div>

              {/* Features */}
              <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="text-3xl font-bold text-blue-600 mb-2">🔐</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Sécurité Azure AD</div>
                  <div className="text-sm text-gray-600">Authentification sécurisée avec Microsoft Azure Active Directory</div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="text-3xl font-bold text-green-600 mb-2">⚡</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Performance</div>
                  <div className="text-sm text-gray-600">Interface moderne et rapide avec Next.js et React</div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="text-3xl font-bold text-purple-600 mb-2">🎨</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Design Moderne</div>
                  <div className="text-sm text-gray-600">Interface utilisateur élégante et responsive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
