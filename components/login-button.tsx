'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'discord_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        alert('Please allow popups to login');
        setIsLoading(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          window.location.reload();
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup listener when component unmounts or popup closes
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Login failed:', error);
      alert('Erreur de connexion. Vérifiez la configuration Discord (Client ID/Secret).');
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={isLoading} className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Se connecter avec Discord
    </Button>
  );
}
