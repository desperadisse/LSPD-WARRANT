'use client';

import { useState, useEffect } from 'react';
import { Warrant } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Search, RefreshCw, LogOut } from 'lucide-react';
import { NewWarrantDialog } from '@/components/new-warrant-dialog';
import { WarrantDetailDialog } from '@/components/warrant-detail-dialog';
import { cn } from '@/lib/utils';

interface DashboardProps {
  user: any;
}

export function Dashboard({ user }: DashboardProps) {
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedWarrant, setSelectedWarrant] = useState<Warrant | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchWarrants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/warrants');
      if (res.ok) {
        const data = await res.json();
        // Sort by date desc
        data.sort((a: Warrant, b: Warrant) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWarrants(data);
      }
    } catch (error) {
      console.error('Failed to fetch warrants', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarrants();
  }, []);

  const filteredWarrants = warrants.filter((w) => {
    if (filter === 'all') return true;
    return w.status === filter;
  });

  const isPolice = user.roles.includes('police');
  const isDOJ = user.roles.includes('doj');

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans">
      {/* Header */}
      <header className="bg-[#141414] text-[#E4E3E0] p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center font-bold text-xl border border-white/20">
            LSPD
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">WARRANT SYSTEM</h1>
            <div className="text-xs opacity-60 font-mono uppercase tracking-wider">
              {user.username} | {[isPolice && 'POLICE', isDOJ && 'DOJ'].filter(Boolean).join(' | ')} ACCESS
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#E4E3E0] hover:bg-white/10"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.reload();
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-light tracking-tight">Dossiers en cours</h2>
            <div className="flex gap-2 text-sm">
              <button 
                onClick={() => setFilter('all')}
                className={cn("px-3 py-1 rounded-full border transition-colors", filter === 'all' ? "bg-[#141414] text-white border-[#141414]" : "border-[#141414]/20 hover:bg-[#141414]/5")}
              >
                Tous
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={cn("px-3 py-1 rounded-full border transition-colors", filter === 'pending' ? "bg-yellow-600 text-white border-yellow-600" : "border-[#141414]/20 hover:bg-[#141414]/5")}
              >
                En attente
              </button>
              <button 
                onClick={() => setFilter('approved')}
                className={cn("px-3 py-1 rounded-full border transition-colors", filter === 'approved' ? "bg-green-700 text-white border-green-700" : "border-[#141414]/20 hover:bg-[#141414]/5")}
              >
                Validés
              </button>
              <button 
                onClick={() => setFilter('rejected')}
                className={cn("px-3 py-1 rounded-full border transition-colors", filter === 'rejected' ? "bg-red-700 text-white border-red-700" : "border-[#141414]/20 hover:bg-[#141414]/5")}
              >
                Rejetés
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchWarrants} className="border-[#141414]/20 hover:bg-[#141414]/5">
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Actualiser
            </Button>
            {isPolice && (
              <Button onClick={() => setIsNewOpen(true)} className="bg-[#141414] hover:bg-[#141414]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Demande
              </Button>
            )}
          </div>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-[100px_1fr_1fr_1fr_150px_100px] gap-4 px-4 py-2 border-b-2 border-[#141414] font-serif italic text-sm opacity-60 uppercase tracking-wider">
          <div>Type</div>
          <div>Cible</div>
          <div>Officier</div>
          <div>Date</div>
          <div>Statut</div>
          <div>Action</div>
        </div>

        {/* Grid Body */}
        <div className="bg-white shadow-sm border border-[#141414]/10">
          {isLoading && warrants.length === 0 ? (
            <div className="p-8 text-center opacity-50">Chargement...</div>
          ) : filteredWarrants.length === 0 ? (
            <div className="p-8 text-center opacity-50">Aucun dossier trouvé.</div>
          ) : (
            filteredWarrants.map((warrant) => (
              <div 
                key={warrant.id}
                className="grid grid-cols-[100px_1fr_1fr_1fr_150px_100px] gap-4 px-4 py-3 border-b border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer group items-center"
                onClick={() => setSelectedWarrant(warrant)}
              >
                <div className="font-mono text-xs uppercase tracking-wider">
                  {warrant.type === 'perquisition' ? 'PERQ' : warrant.type === 'arrestation' ? 'ARRÊT' : 'REQ'}
                </div>
                <div className="font-bold">{warrant.targetName}</div>
                <div className="text-sm opacity-80">{warrant.officerName.split('#')[0]}</div>
                <div className="font-mono text-xs opacity-70">
                  {new Date(warrant.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                    warrant.status === 'pending' && "bg-yellow-100 text-yellow-800 border-yellow-200 group-hover:bg-yellow-900 group-hover:text-yellow-100 group-hover:border-yellow-700",
                    warrant.status === 'approved' && "bg-green-100 text-green-800 border-green-200 group-hover:bg-green-900 group-hover:text-green-100 group-hover:border-green-700",
                    warrant.status === 'rejected' && "bg-red-100 text-red-800 border-red-200 group-hover:bg-red-900 group-hover:text-red-100 group-hover:border-red-700"
                  )}>
                    {warrant.status === 'pending' ? 'EN ATTENTE' : warrant.status === 'approved' ? 'VALIDÉ' : 'REJETÉ'}
                  </span>
                </div>
                <div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <NewWarrantDialog 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen} 
        onSuccess={fetchWarrants} 
      />
      
      {selectedWarrant && (
        <WarrantDetailDialog 
          warrant={selectedWarrant} 
          open={!!selectedWarrant} 
          onOpenChange={(open) => !open && setSelectedWarrant(null)}
          onUpdate={fetchWarrants}
          user={user}
        />
      )}
    </div>
  );
}
