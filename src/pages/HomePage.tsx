import { useState } from 'react';
import { Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RaffleCard } from '@/components/features/RaffleCard';
import { ParticipateForm } from '@/components/features/ParticipateForm';
import { AuthDialog } from '@/components/features/AuthDialog';
import { RaffleDetailsModal } from '@/components/features/RaffleDetailsModal';
import { useRaffles } from '@/hooks/useRaffles';
import { useAuth } from '@/hooks/useAuth';
import { Raffle } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface HomePageProps {
  onAdminClick: () => void;
  onMyTicketsClick: () => void;
}

export function HomePage({ onAdminClick, onMyTicketsClick }: HomePageProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [viewDetailsRaffle, setViewDetailsRaffle] = useState<Raffle | null>(null);
  const { raffles, isLoading } = useRaffles();
  const { user } = useAuth();

  const activeRaffles = raffles.filter(r => r.status === 'active');

  const handleParticipate = (raffle: Raffle) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setSelectedRaffle(raffle);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => setShowAuth(true)} 
        onAdminClick={onAdminClick}
        onMyTicketsClick={onMyTicketsClick}
      />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6 animate-fade-up">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient leading-tight">
            Participe das Melhores Rifas
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha sua rifa favorita, selecione seus números da sorte e concorra a prêmios incríveis!
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-up">
          <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Seguro e Confiável</h3>
                  <p className="text-sm text-muted-foreground">
                    Sistema 100% seguro com aprovação manual de pagamentos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-accent/20 hover:border-accent/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Processo Rápido</h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha seus números e participe em segundos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-success/20 hover:border-success/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-success/20">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Transparência Total</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe números disponíveis em tempo real
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raffles Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Rifas Ativas
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({activeRaffles.length} disponíveis)
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-lg gradient-card animate-pulse" />
            ))}
          </div>
        ) : activeRaffles.length === 0 ? (
          <Card className="glass-effect border-border/40">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">
                Nenhuma rifa disponível no momento
              </p>
              <p className="text-sm text-muted-foreground">
                Novas rifas serão adicionadas em breve!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
            {activeRaffles.map((raffle, index) => (
              <div
                key={raffle.id}
                style={{ animationDelay: `${index * 0.1}s` }}
                className="animate-fade-up"
              >
                <RaffleCard
                  raffle={raffle}
                  onParticipate={handleParticipate}
                  onViewDetails={setViewDetailsRaffle}
                  disabled={!user}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-0">
          <AuthDialog onClose={() => setShowAuth(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRaffle} onOpenChange={() => setSelectedRaffle(null)}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0">
          {selectedRaffle && (
            <ParticipateForm
              raffle={selectedRaffle}
              onClose={() => setSelectedRaffle(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {viewDetailsRaffle && (
        <RaffleDetailsModal
          raffle={viewDetailsRaffle}
          onClose={() => setViewDetailsRaffle(null)}
          onParticipate={() => {
            setViewDetailsRaffle(null);
            handleParticipate(viewDetailsRaffle);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
