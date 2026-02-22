'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface RpNameDialogProps {
  open: boolean;
}

export function RpNameDialog({ open }: RpNameDialogProps) {
  const [rpName, setRpName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rpName.trim().length < 3) {
      setError('Minimum 3 caractères');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/set-rp-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpName: rpName.trim() }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const errText = await res.text();
        setError(errText);
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[400px] bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/20 [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif italic tracking-wide">
            Identité RP
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Entrez votre nom et prénom en jeu (RP). Ce nom sera utilisé sur tous les documents officiels.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rpName" className="text-xs uppercase tracking-wider opacity-70">
              Prénom et Nom RP
            </Label>
            <Input
              id="rpName"
              value={rpName}
              onChange={(e) => setRpName(e.target.value)}
              className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]"
              placeholder="Ex: John Doe"
              autoFocus
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-[#E4E3E0] text-[#141414] hover:bg-white w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
