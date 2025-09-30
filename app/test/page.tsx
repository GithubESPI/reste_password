"use client";

import { useSession } from "next-auth/react";

export default function TestPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Test de Session</h1>
        
        <div className="space-y-4">
          <div>
            <strong>Status:</strong> {status}
          </div>
          
          <div>
            <strong>Session:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          
          {session && (
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-semibold text-green-800">✅ Connecté !</h3>
              <p className="text-green-700">
                Bonjour {session.user?.name || session.user?.email} !
              </p>
            </div>
          )}
          
          {status === "unauthenticated" && (
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-semibold text-red-800">❌ Non connecté</h3>
              <p className="text-red-700">
                Aucune session active
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
