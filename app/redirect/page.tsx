"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function RedirectPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fonction pour jouer un son "chic" (un arpège doux) via l'API Web Audio
  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playNote = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Forme d'onde "sine" pour un son doux et pur
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        // Enveloppe ADSR (Attack, Decay, Sustain, Release)
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.05); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 1.5); // Release
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 1.5);
      };

      // Un accord chic et apaisant (C6, E6, G6 - Do majeur)
      playNote(1046.50, 0);       // Do
      playNote(1318.51, 0.1);     // Mi
      playNote(1567.98, 0.2);     // Sol
    } catch (e) {
      console.log("Audio non supporté ou bloqué par le navigateur", e);
    }
  };

  useEffect(() => {
    // Éviter les redirections multiples
    if (hasRedirected.current) return;

    if (status === "authenticated") {
      hasRedirected.current = true;
      setShowSuccess(true);
      playSuccessSound();
      
      // Attendre un peu pour que l'utilisateur voie l'animation et entende le son
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1800);
    } else if (status === "unauthenticated") {
      hasRedirected.current = true;
      setTimeout(() => {
        router.replace("/login");
      }, 100);
    }
  }, [status, router]);

  if (showSuccess) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        {/* Background Image (Même que la page de login pour une transition fluide) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/espi-campus-marseille.jpg"
            alt="Campus ESPI Marseille"
            fill
            priority
            className="object-cover object-center"
            quality={100}
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        </div>

        {/* Modal de succès */}
        <div className="relative z-10 text-center animate-slide-up">
          <div className="w-28 h-28 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(52,211,148,0.6)] mb-8 animate-pulse-glow border-4 border-white/20">
            <svg className="w-14 h-14 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 tracking-wide">
            Connexion réussie
          </h2>
          <p className="text-xl text-green-300 font-medium">
            Bienvenue, {session?.user?.name?.split(' ')[0] || 'sur le portail'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gray-900"></div>
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
        <p className="text-gray-300 font-medium text-lg animate-pulse">Authentification en cours...</p>
      </div>
    </div>
  );
}
