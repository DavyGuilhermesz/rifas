import { X, Ticket, Users, DollarSign, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Raffle } from '@/types';
import { useTickets } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface RaffleDetailsModalProps {
  raffle: Raffle;
  onClose: () => void;
  onParticipate?: () => void;
  isAdminMode?: boolean;
  onRandomDraw?: (raffle: Raffle) => void;
}

export function RaffleDetailsModal({ raffle, onClose, onParticipate, isAdminMode, onRandomDraw }: RaffleDetailsModalProps) {
  const { tickets } = useTickets(raffle.id);
  
  const approvedTickets = tickets.filter(t => t.status === 'approved');
  const soldNumbers = new Set(approvedTickets.map(t => t.ticket_number).filter(Boolean));
  const totalSold = soldNumbers.size;
  const totalAvailable = raffle.total_tickets - totalSold;
  const totalRevenue = approvedTickets.length * raffle.ticket_price;

  const getNumberStatus = (num: number): 'sold' | 'available' | 'winner' => {
    if (raffle.winner_ticket_number === num) return 'winner';
    if (soldNumbers.has(num)) return 'sold';
    return 'available';
  };

  const getNumberOwner = (num: number) => {
    const ticket = approvedTickets.find(t => t.ticket_number === num);
    return ticket?.full_name;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto gradient-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-background/95 backdrop-blur-lg border-b z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{raffle.title}</CardTitle>
              <p className="text-sm text-muted-foreground">ID: {raffle.id.slice(0, 8)}...</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Image and Description */}
            <div className="space-y-4">
              {raffle.image_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={raffle.image_url}
                    alt={raffle.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              
              {raffle.description && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{raffle.description}</p>
                </div>
              )}

              {raffle.draw_date && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span>Sorteio: {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Vendidos</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{totalSold}</p>
                  </CardContent>
                </Card>

                <Card className="border-success/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-success" />
                      <span className="text-xs text-muted-foreground">Disponíveis</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{totalAvailable}</p>
                  </CardContent>
                </Card>

                <Card className="border-accent/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span className="text-xs text-muted-foreground">Preço</span>
                    </div>
                    <p className="text-xl font-bold mt-1">R$ {raffle.ticket_price.toFixed(2)}</p>
                  </CardContent>
                </Card>

                <Card className="border-warning/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-warning" />
                      <span className="text-xs text-muted-foreground">Arrecadado</span>
                    </div>
                    <p className="text-xl font-bold mt-1">R$ {totalRevenue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <Badge
                variant={raffle.status === 'active' ? 'default' : 'secondary'}
                className="w-full justify-center py-2"
              >
                {raffle.status === 'active' ? '✓ Rifa Ativa' : raffle.status === 'completed' ? '🏆 Finalizada' : 'Cancelada'}
              </Badge>

              {raffle.winner_ticket_number && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-warning/20 to-accent/20 border border-warning/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    <h4 className="font-semibold">Número Vencedor</h4>
                  </div>
                  <p className="text-3xl font-bold text-warning">{raffle.winner_ticket_number}</p>
                  {getNumberOwner(raffle.winner_ticket_number) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Vencedor: {getNumberOwner(raffle.winner_ticket_number)}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              {isAdminMode && raffle.status === 'active' && onRandomDraw && (
                <Button
                  onClick={() => onRandomDraw(raffle)}
                  className="w-full gradient-primary text-primary-foreground"
                  size="lg"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Sortear Vencedor
                </Button>
              )}

              {/* User Actions */}
              {onParticipate && raffle.status === 'active' && !isAdminMode && (
                <Button
                  onClick={onParticipate}
                  className="w-full gradient-primary text-primary-foreground"
                  size="lg"
                >
                  Participar Agora
                </Button>
              )}
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Números da Rifa</h4>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-success"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-muted"></div>
                  <span>Vendido</span>
                </div>
                {raffle.winner_ticket_number && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-warning"></div>
                    <span>Vencedor</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1 p-4 rounded-lg bg-muted/30">
              {Array.from({ length: raffle.total_tickets }, (_, i) => i + 1).map((num) => {
                const status = getNumberStatus(num);
                const owner = getNumberOwner(num);
                
                return (
                  <div
                    key={num}
                    title={status === 'sold' ? `Vendido para ${owner}` : status === 'winner' ? `🏆 Vencedor: ${owner}` : 'Disponível'}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded text-xs font-semibold cursor-default transition-all',
                      status === 'available' && 'bg-success/20 text-success hover:bg-success/30',
                      status === 'sold' && 'bg-muted text-muted-foreground',
                      status === 'winner' && 'bg-warning text-warning-foreground animate-pulse'
                    )}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
