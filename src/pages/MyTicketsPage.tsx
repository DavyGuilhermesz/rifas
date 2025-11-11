import { ArrowLeft, Ticket as TicketIcon, Trophy, Calendar, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTickets } from '@/hooks/useTickets';
import { useRaffles } from '@/hooks/useRaffles';
import { useAuth } from '@/hooks/useAuth';
import { Footer } from '@/components/layout/Footer';

interface MyTicketsPageProps {
  onBack: () => void;
}

export function MyTicketsPage({ onBack }: MyTicketsPageProps) {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const { raffles } = useRaffles();

  // Filter user's tickets (not deleted)
  const myTickets = tickets.filter(t => t.user_id === user?.id && !t.deleted_at);
  const myApprovedTickets = myTickets.filter(t => t.status === 'approved');
  const myPendingTickets = myTickets.filter(t => t.status === 'pending');
  const myRejectedTickets = myTickets.filter(t => t.status === 'rejected');

  // Group tickets by raffle
  const ticketsByRaffle = myTickets.reduce((acc, ticket) => {
    const raffleId = ticket.raffle_id;
    if (!acc[raffleId]) {
      acc[raffleId] = [];
    }
    acc[raffleId].push(ticket);
    return acc;
  }, {} as Record<string, typeof myTickets>);

  const totalSpent = myApprovedTickets.reduce((sum, ticket) => {
    const raffle = raffles.find(r => r.id === ticket.raffle_id);
    return sum + (raffle?.ticket_price || 0);
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-white"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={onBack} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="animate-fade-in space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Minhas Participações</h1>
            <p className="text-muted-foreground">Acompanhe todos os seus números e status</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="gradient-card border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <TicketIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Números</p>
                    <p className="text-3xl font-bold">{myTickets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-success/20">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                    <p className="text-3xl font-bold">{myApprovedTickets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-warning/20">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-3xl font-bold">{myPendingTickets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-accent/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-accent/20">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gasto</p>
                    <p className="text-2xl font-bold">R$ {totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets by Raffle */}
          {Object.keys(ticketsByRaffle).length === 0 ? (
            <Card className="glass-effect border-border/40">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <TicketIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">
                  Você ainda não participou de nenhuma rifa
                </p>
                <p className="text-sm text-muted-foreground">
                  Volte para a página inicial e escolha uma rifa!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(ticketsByRaffle).map(([raffleId, tickets]) => {
                const raffle = raffles.find(r => r.id === raffleId);
                if (!raffle) return null;

                const approvedNumbers = tickets
                  .filter(t => t.status === 'approved' && t.ticket_number)
                  .map(t => t.ticket_number!)
                  .sort((a, b) => a - b);

                const pendingNumbers = tickets
                  .filter(t => t.status === 'pending' && t.ticket_number)
                  .map(t => t.ticket_number!)
                  .sort((a, b) => a - b);

                const rejectedNumbers = tickets
                  .filter(t => t.status === 'rejected' && t.ticket_number)
                  .map(t => t.ticket_number!)
                  .sort((a, b) => a - b);

                const isWinner = raffle.winner_ticket_number && 
                  approvedNumbers.includes(raffle.winner_ticket_number);

                return (
                  <Card key={raffleId} className={`gradient-card ${isWinner ? 'border-success/40 shadow-lg shadow-success/20' : 'border-primary/20'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-2">
                            {isWinner && <Trophy className="h-5 w-5 text-success" />}
                            {raffle.title}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R$ {raffle.ticket_price.toFixed(2)} por número
                            </div>
                            {raffle.draw_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                        {isWinner && (
                          <Badge className="bg-success text-white text-lg px-4 py-2">
                            🎉 VENCEDOR!
                          </Badge>
                        )}
                        {raffle.status === 'completed' && !isWinner && (
                          <Badge variant="outline">Finalizada</Badge>
                        )}
                        {raffle.status === 'active' && (
                          <Badge className="bg-primary text-white">Ativa</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Approved Numbers */}
                      {approvedNumbers.length > 0 && (
                        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <p className="font-semibold text-success">
                              Números Aprovados ({approvedNumbers.length})
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {approvedNumbers.map((num) => (
                              <div
                                key={num}
                                className={`px-4 py-2 rounded-lg font-bold ${
                                  raffle.winner_ticket_number === num
                                    ? 'bg-success text-white border-2 border-success shadow-lg shadow-success/50 scale-110'
                                    : 'bg-success/20 text-success border border-success/40'
                                }`}
                              >
                                {raffle.winner_ticket_number === num && '🏆 '}
                                {num}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending Numbers */}
                      {pendingNumbers.length > 0 && (
                        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-warning" />
                            <p className="font-semibold text-warning">
                              Aguardando Aprovação ({pendingNumbers.length})
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pendingNumbers.map((num) => (
                              <div
                                key={num}
                                className="px-4 py-2 rounded-lg bg-warning/20 text-warning border border-warning/40 font-bold"
                              >
                                {num}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejected Numbers */}
                      {rejectedNumbers.length > 0 && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <p className="font-semibold text-destructive">
                              Números Recusados ({rejectedNumbers.length})
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rejectedNumbers.map((num) => (
                              <div
                                key={num}
                                className="px-4 py-2 rounded-lg bg-destructive/20 text-destructive border border-destructive/40 font-bold"
                              >
                                {num}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">
                          Total investido nesta rifa
                        </p>
                        <p className="text-xl font-bold text-accent">
                          R$ {(approvedNumbers.length * raffle.ticket_price).toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
