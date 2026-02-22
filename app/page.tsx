import { getSession } from '@/lib/auth';
import { LoginButton } from '@/components/login-button';
import { Dashboard } from '@/components/dashboard';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] text-[#E4E3E0]">
        <div className="text-center space-y-6 p-8 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm shadow-2xl max-w-md w-full">
          <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center font-bold text-3xl border border-white/20 mx-auto mb-6 shadow-[0_0_30px_rgba(30,58,138,0.5)]">
            LSPD
          </div>
          <h1 className="text-3xl font-bold tracking-tighter font-serif italic">
            LSPD Warrant System
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Système sécurisé de gestion des mandats et réquisitions judiciaires.
            Accès strictement réservé aux agents de la LSPD et au personnel du DOJ.
          </p>
          <div className="pt-4">
            <LoginButton />
          </div>
          <p className="text-xs text-zinc-600 uppercase tracking-widest pt-8">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard user={session} />;
}
