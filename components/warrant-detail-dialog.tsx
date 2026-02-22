'use client';

import { useState } from 'react';
import { Warrant } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Download, Check, X, Link, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface WarrantDetailDialogProps {
  warrant: Warrant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  user: any;
}

export function WarrantDetailDialog({ warrant, open, onOpenChange, onUpdate, user }: WarrantDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copied, setCopied] = useState(false);

  const isDOJ = user.roles.includes('doj');

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason) {
      setIsRejecting(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/warrants/${warrant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (res.ok) {
        onUpdate();
        onOpenChange(false);
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Error updating warrant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#E4E3E0] text-[#141414] border-[#141414]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif italic tracking-wide uppercase">
            {warrant.type === 'perquisition' ? 'Mandat de Perquisition' : warrant.type === 'arrestation' ? "Mandat d'Arrêt" : 'Réquisition Judiciaire'}
          </DialogTitle>
          <DialogDescription className="text-zinc-600 font-mono text-xs">
            ID: {warrant.id} | Créé le {new Date(warrant.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider opacity-60">Officier</Label>
              <div className="font-bold">{warrant.officerName.split('#')[0]}</div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider opacity-60">Cible</Label>
              <div className="font-bold">{warrant.targetName}</div>
            </div>
          </div>

          {warrant.location && (
            <div>
              <Label className="text-xs uppercase tracking-wider opacity-60">Lieu</Label>
              <div className="font-medium">{warrant.location}</div>
            </div>
          )}

          <div>
            <Label className="text-xs uppercase tracking-wider opacity-60">Motif</Label>
            <div className="font-medium">{warrant.reason}</div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider opacity-60">Détails</Label>
            <div className="bg-white p-3 rounded-md border border-[#141414]/10 text-sm whitespace-pre-wrap">
              {warrant.details}
            </div>
          </div>

          {warrant.status === 'rejected' && (
            <div className="bg-red-100 p-3 rounded-md border border-red-200 text-red-900">
              <Label className="text-xs uppercase tracking-wider opacity-60 text-red-800">Motif du rejet</Label>
              <div className="text-sm">{warrant.rejectionReason}</div>
              <div className="text-xs mt-1 opacity-70">Par: {warrant.judgeName?.split('#')[0]}</div>
            </div>
          )}

          {warrant.status === 'approved' && (
            <div className="bg-green-100 p-3 rounded-md border border-green-200 text-green-900">
              <div className="text-sm font-bold">Validé par: {warrant.judgeName?.split('#')[0]}</div>
              <div className="text-xs opacity-70">Le {new Date(warrant.updatedAt).toLocaleDateString()}</div>
            </div>
          )}

          {isRejecting && (
            <div className="space-y-2">
              <Label>Motif du rejet</Label>
              <Textarea 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indiquez la raison du refus..."
                className="bg-white"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsRejecting(false)}>Annuler</Button>
                <Button variant="destructive" size="sm" onClick={() => handleStatusUpdate('rejected')}>Confirmer le rejet</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {warrant.status === 'approved' && warrant.pdfToken && (
              <>
                <Button
                  variant="outline"
                  className="border-[#141414]/20"
                  onClick={() => {
                    window.open(`/api/warrants/${warrant.id}/pdf?token=${warrant.pdfToken}`, '_blank');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="border-[#141414]/20"
                  onClick={() => {
                    const url = `${window.location.origin}/api/warrants/${warrant.id}/pdf?token=${warrant.pdfToken}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {isDOJ && warrant.status === 'pending' && !isRejecting && (
              <>
                <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} disabled={isLoading}>
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button onClick={() => handleStatusUpdate('approved')} disabled={isLoading} className="bg-green-700 hover:bg-green-800 text-white">
                  <Check className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
