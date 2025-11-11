import { Sparkles, Shield, LogOut, LogIn, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onAuthClick?: () => void;
  onAdminClick?: () => void;
  onMyTicketsClick?: () => void;
}

export function Header({ onAuthClick, onAdminClick, onMyTicketsClick }: HeaderProps) {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="border-b border-border/40 backdrop-blur-xl glass-effect sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative p-2.5 rounded-xl bg-gradient-to-r from-primary to-accent">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Rifas</h1>
            <p className="text-xs text-muted-foreground">Sistema Profissional de Rifas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && onMyTicketsClick && (
            <Button
              onClick={onMyTicketsClick}
              variant="outline"
              className="gap-2 border-primary/50 hover:bg-primary/10"
            >
              <Ticket className="h-4 w-4" />
              Minhas Rifas
            </Button>
          )}

          {user && isAdmin && onAdminClick && (
            <Button
              onClick={onAdminClick}
              className="gradient-primary text-white gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Shield className="h-4 w-4" />
              Painel Admin
            </Button>
          )}
          
          {user ? (
            <Button
              onClick={signOut}
              variant="ghost"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          ) : (
            onAuthClick && (
              <Button
                onClick={onAuthClick}
                variant="outline"
                className="gap-2 border-primary/50 hover:bg-primary/10"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
