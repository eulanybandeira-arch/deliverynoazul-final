import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useNavigate } from 'react-router-dom';

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-xl text-foreground">deliverynoazul</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Entrar
          </Button>
          <Button onClick={() => navigate('/login')}>
            Começar Grátis
          </Button>
        </div>
      </div>
    </header>
  );
}
