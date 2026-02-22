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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface NewWarrantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewWarrantDialog({ open, onOpenChange, onSuccess }: NewWarrantDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'perquisition',
    targetName: '',
    reason: '',
    details: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/warrants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onOpenChange(false);
        setFormData({
          type: 'perquisition',
          targetName: '',
          reason: '',
          details: '',
          location: '',
        });
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Error creating warrant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif italic tracking-wide">Nouvelle Demande</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Remplissez les informations ci-dessous pour créer une nouvelle demande de mandat ou réquisition.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type" className="text-xs uppercase tracking-wider opacity-70">Type de demande</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]">
                <SelectItem value="perquisition">Mandat de Perquisition</SelectItem>
                <SelectItem value="arrestation">Mandat d&apos;Arrêt</SelectItem>
                <SelectItem value="requisition">Réquisition Judiciaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target" className="text-xs uppercase tracking-wider opacity-70">Cible (Nom / Prénom)</Label>
            <Input
              id="target"
              value={formData.targetName}
              onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
              className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]"
              placeholder="Ex: John Doe"
              required
            />
          </div>

          {formData.type === 'perquisition' && (
            <div className="grid gap-2">
              <Label htmlFor="location" className="text-xs uppercase tracking-wider opacity-70">Lieu / Propriété</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]"
                placeholder="Ex: 123 Grove Street"
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-xs uppercase tracking-wider opacity-70">Motif Principal</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]"
              placeholder="Ex: Suspicion de trafic de stupéfiants"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details" className="text-xs uppercase tracking-wider opacity-70">Détails / Preuves</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0] min-h-[100px]"
              placeholder="Décrivez les circonstances et les preuves..."
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#E4E3E0] hover:bg-white/10">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#E4E3E0] text-[#141414] hover:bg-white">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Soumettre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
