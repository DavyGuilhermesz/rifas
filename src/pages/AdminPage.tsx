import { useState } from 'react';
import { ArrowLeft, Check, X, Trophy, ImageIcon, Search, BarChart3, Ticket as TicketIcon, Users, DollarSign, Trash2, Download, Edit, History, RotateCcw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTickets } from '@/hooks/useTickets';
import { useRaffles } from '@/hooks/useRaffles';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { RaffleDetailsModal } from '@/components/features/RaffleDetailsModal';
import { Footer } from '@/components/layout/Footer';
import { Raffle } from '@/types';

interface AdminPageProps {
  onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
  const { tickets, updateTicketStatus, softDeleteTicket, restoreTicket } = useTickets();
  const { raffles, createRaffle, deleteRaffle } = useRaffles();
  const [selectedRaffleForDraw, setSelectedRaffleForDraw] = useState<Raffle | null>(null);
  const [viewDetailsRaffle, setViewDetailsRaffle] = useState<Raffle | null>(null);
  const [winnerNumber, setWinnerNumber] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [searchRaffleId, setSearchRaffleId] = useState('');
  const [searchParticipant, setSearchParticipant] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editTotalTickets, setEditTotalTickets] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  
  // New raffle form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const activeTickets = tickets.filter(t => !t.deleted_at);
  const deletedTickets = tickets.filter(t => t.deleted_at);
  const pendingTickets = activeTickets.filter(t => t.status === 'pending');
  const approvedTickets = activeTickets.filter(t => t.status === 'approved');
  const activeRaffles = raffles.filter(r => r.status === 'active');
  const totalRevenue = approvedTickets.reduce((sum, ticket) => {
    const raffle = raffles.find(r => r.id === ticket.raffle_id);
    return sum + (raffle?.ticket_price || 0);
  }, 0);

  const generateRandomNumber = (maxNumber: number) => {
    const usedNumbers = new Set(approvedTickets.map(t => t.ticket_number).filter(Boolean));
    let randomNum: number;
    let attempts = 0;
    
    do {
      randomNum = Math.floor(Math.random() * maxNumber) + 1;
      attempts++;
    } while (usedNumbers.has(randomNum) && attempts < 100);
    
    return randomNum;
  };

  const handleApprove = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    await updateTicketStatus.mutateAsync({
      ticketId,
      status: 'approved',
    });

    // Send Discord notification
    try {
      const raffle = raffles.find(r => r.id === ticket.raffle_id);
      if (raffle && ticket.ticket_number) {
        await supabase.functions.invoke('notify-discord', {
          body: {
            eventType: 'payment_approved',
            data: {
              ticketNumbers: [ticket.ticket_number],
              raffleName: raffle.title,
              participantName: ticket.full_name,
              totalAmount: raffle.ticket_price,
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  };

  const handleApproveGroup = async (ticketIds: string[]) => {
    if (ticketIds.length === 0) return;
    
    const firstTicket = tickets.find(t => t.id === ticketIds[0]);
    if (!firstTicket) return;

    // Approve all tickets in the group
    for (const ticketId of ticketIds) {
      await updateTicketStatus.mutateAsync({
        ticketId,
        status: 'approved',
      });
    }

    // Send Discord notification with all numbers
    try {
      const raffle = raffles.find(r => r.id === firstTicket.raffle_id);
      const groupTickets = tickets.filter(t => ticketIds.includes(t.id));
      const ticketNumbers = groupTickets.map(t => t.ticket_number).filter(Boolean) as number[];
      
      if (raffle && ticketNumbers.length > 0) {
        await supabase.functions.invoke('notify-discord', {
          body: {
            eventType: 'payment_approved',
            data: {
              ticketNumbers,
              raffleName: raffle.title,
              participantName: firstTicket.full_name,
              totalAmount: raffle.ticket_price * ticketNumbers.length,
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  };

  const handleRejectGroup = async (ticketIds: string[]) => {
    for (const ticketId of ticketIds) {
      await updateTicketStatus.mutateAsync({
        ticketId,
        status: 'rejected',
      });
    }
  };

  const handleReject = async (ticketId: string) => {
    await updateTicketStatus.mutateAsync({
      ticketId,
      status: 'rejected',
    });
  };

  const handleSelectWinner = async (raffleId: string) => {
    const winnerNum = parseInt(winnerNumber);
    if (isNaN(winnerNum)) {
      toast.error('Número inválido');
      return;
    }

    const { error } = await supabase
      .from('raffles')
      .update({ 
        winner_ticket_number: winnerNum,
        status: 'completed'
      })
      .eq('id', raffleId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Vencedor selecionado com sucesso!');
      setSelectedTicket(null);
      setWinnerNumber('');
    }
  };

  const handleRandomDraw = async (raffle?: Raffle) => {
    const raffleToUse = raffle || selectedRaffleForDraw;
    if (!raffleToUse) {
      toast.error('Selecione uma rifa primeiro');
      return;
    }

    const raffleTickets = approvedTickets.filter(t => t.raffle_id === raffleToUse.id);
    
    if (raffleTickets.length === 0) {
      toast.error('Nenhum número aprovado para esta rifa');
      return;
    }

    const randomTicket = raffleTickets[Math.floor(Math.random() * raffleTickets.length)];
    const winnerNum = randomTicket.ticket_number;

    if (!winnerNum) {
      toast.error('Erro ao obter número do bilhete');
      return;
    }

    const confirmed = window.confirm(
      `Sortear número ${winnerNum} como vencedor?\n\nParticipante: ${randomTicket.full_name}\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('raffles')
      .update({ 
        winner_ticket_number: winnerNum,
        status: 'completed'
      })
      .eq('id', raffleToUse.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`🎉 Número ${winnerNum} sorteado! Vencedor: ${randomTicket.full_name}`);
      setViewDetailsRaffle(null);
      setWinnerNumber('');

      // Send Discord notification
      try {
        const totalParticipants = new Set(raffleTickets.map(t => t.user_id)).size;
        const totalRevenue = raffleTickets.length * raffleToUse.ticket_price;

        await supabase.functions.invoke('notify-discord', {
          body: {
            eventType: 'winner_selected',
            data: {
              raffleName: raffleToUse.title,
              winnerName: randomTicket.full_name,
              winnerNumber: winnerNum,
              prize: raffleToUse.description,
              totalParticipants,
              totalRevenue,
            },
          },
        });
      } catch (error) {
        console.error('Failed to send Discord notification:', error);
      }
    }
  };

  const handleDeactivateRaffle = async (raffleId: string) => {
    const confirmed = window.confirm(
      'Deseja desativar esta rifa?\n\nOs participantes não poderão mais comprar bilhetes.'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('raffles')
      .update({ status: 'cancelled' })
      .eq('id', raffleId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Rifa desativada com sucesso!');
    }
  };

  const handleReactivateRaffle = async (raffleId: string) => {
    const { error } = await supabase
      .from('raffles')
      .update({ status: 'active' })
      .eq('id', raffleId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Rifa reativada com sucesso!');
    }
  };

  const handleDeleteRaffle = async (raffleId: string) => {
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return;

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Deseja DELETAR permanentemente a rifa "${raffle.title}"?\n\nEsta ação NÃO pode ser desfeita e todos os dados serão perdidos!`
    );

    if (!confirmed) return;

    await deleteRaffle.mutateAsync({ id: raffleId, title: raffle.title });
  };

  const handleEditRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRaffle) return;

    const { error } = await supabase
      .from('raffles')
      .update({
        title: editTitle,
        description: editDescription,
        ticket_price: parseFloat(editPrice),
        total_tickets: parseInt(editTotalTickets),
        image_url: editImageUrl || null,
      })
      .eq('id', editingRaffle.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Rifa atualizada com sucesso!');
      setEditingRaffle(null);
    }
  };

  const handleExportParticipants = (raffleId?: string) => {
    let exportTickets = activeTickets.filter(t => t.status === 'approved');
    if (raffleId) {
      exportTickets = exportTickets.filter(t => t.raffle_id === raffleId);
    }

    const csv = [
      ['Nome', 'RG', 'Número', 'Rifa', 'Data Aprovação'].join(','),
      ...exportTickets.map(t => {
        const raffle = raffles.find(r => r.id === t.raffle_id);
        return [
          t.full_name,
          t.rg,
          t.ticket_number,
          raffle?.title || 'N/A',
          new Date(t.approved_at || '').toLocaleString('pt-BR')
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `participantes_${raffleId || 'todos'}_${Date.now()}.csv`;
    link.click();
    toast.success('Exportado com sucesso!');
  };

  const filteredApprovedTickets = approvedTickets.filter(t => {
    const matchesSearch = t.full_name.toLowerCase().includes(searchParticipant.toLowerCase()) ||
                          t.rg.toLowerCase().includes(searchParticipant.toLowerCase());
    return matchesSearch;
  });

  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createRaffle.mutateAsync({
      title,
      description,
      ticket_price: parseFloat(price),
      total_tickets: parseInt(totalTickets),
      image_url: imageUrl || null,
      draw_date: null,
      created_by: null,
    });

    setTitle('');
    setDescription('');
    setPrice('');
    setTotalTickets('');
    setImageUrl('');
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
            <h1 className="text-3xl font-bold text-gradient mb-2">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie rifas e aprove participações</p>
          </div>

          {/* Advanced Filters */}
          <Card className="gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filtros e Ferramentas Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Buscar Participante</Label>
                  <Input
                    value={searchParticipant}
                    onChange={(e) => setSearchParticipant(e.target.value)}
                    placeholder="Nome ou RG..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="approved">Aprovados</option>
                    <option value="pending">Pendentes</option>
                    <option value="rejected">Recusados</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Visualizar</Label>
                  <Button
                    variant={showDeleted ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setShowDeleted(!showDeleted)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {showDeleted ? 'Ver Ativos' : 'Ver Deletados'}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportParticipants()}
                  className="flex-1 gradient-primary text-primary-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Todos (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="gradient-card border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rifas Ativas</p>
                    <p className="text-3xl font-bold">{activeRaffles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-warning/20">
                    <Users className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                    <p className="text-3xl font-bold">{pendingTickets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-success/20">
                    <TicketIcon className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                    <p className="text-3xl font-bold">{approvedTickets.length}</p>
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
                    <p className="text-sm text-muted-foreground">Arrecadado</p>
                    <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Raffle by ID */}
          <Card className="gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Buscar Rifa por ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={searchRaffleId}
                  onChange={(e) => setSearchRaffleId(e.target.value)}
                  placeholder="Digite o ID da rifa..."
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    const raffle = raffles.find(r => r.id.toLowerCase().includes(searchRaffleId.toLowerCase()));
                    if (raffle) {
                      setViewDetailsRaffle(raffle);
                      setSelectedRaffleForDraw(raffle);
                    } else {
                      toast.error('Rifa não encontrada');
                    }
                  }}
                  className="gradient-primary text-primary-foreground"
                >
                  Buscar
                </Button>
              </div>
              {raffles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Rifas disponíveis:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {raffles.slice(0, 6).map((raffle) => (
                      <div key={raffle.id} className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setViewDetailsRaffle(raffle);
                            setSelectedRaffleForDraw(raffle);
                          }}
                          className="flex-1 justify-start text-left h-auto py-2"
                        >
                          <div className="truncate">
                            <p className="font-semibold truncate">{raffle.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {raffle.id.slice(0, 8)}... • {raffle.status}
                            </p>
                          </div>
                        </Button>
                        <div className="flex gap-1">
                          {raffle.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeactivateRaffle(raffle.id)}
                              title="Desativar rifa"
                              className="border-warning text-warning hover:bg-warning/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : raffle.status === 'cancelled' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleReactivateRaffle(raffle.id)}
                              title="Reativar rifa"
                              className="border-success text-success hover:bg-success/10"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteRaffle(raffle.id)}
                            title="Deletar rifa permanentemente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Criar Nova Rifa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRaffle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome da rifa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço do Bilhete (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="10.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a rifa..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalTickets">Total de Números</Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    placeholder="100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL da Imagem</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={createRaffle.isPending}
                className="w-full gradient-primary text-primary-foreground"
              >
                {createRaffle.isPending ? 'Criando...' : 'Criar Rifa'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="gradient-card border-accent/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-accent" />
                Pagamentos Pendentes
              </CardTitle>
              <Badge className="bg-warning text-warning-foreground text-lg px-4 py-1">
                {pendingTickets.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Nenhum pagamento pendente
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(() => {
                  // Group tickets by payment_proof_url (same purchase)
                  const groupedTickets = pendingTickets.reduce((acc, ticket) => {
                    const key = ticket.payment_proof_url;
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(ticket);
                    return acc;
                  }, {} as Record<string, typeof pendingTickets>);

                  return Object.values(groupedTickets).map((ticketGroup) => {
                    const firstTicket = ticketGroup[0];
                    const raffle = raffles.find(r => r.id === firstTicket.raffle_id);
                    const ticketNumbers = ticketGroup.map(t => t.ticket_number).filter(Boolean).sort((a, b) => a! - b!);
                    const totalAmount = raffle ? raffle.ticket_price * ticketGroup.length : 0;
                    
                    return (
                      <div
                        key={firstTicket.id}
                        className="group relative rounded-xl border-2 border-warning/40 bg-gradient-to-br from-card/80 to-card/50 p-4 space-y-3 hover:border-warning transition-all hover:shadow-lg hover:shadow-warning/20"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-lg">{firstTicket.full_name}</p>
                            <p className="text-sm text-muted-foreground">RG: {firstTicket.rg}</p>
                            {raffle && (
                              <p className="text-xs text-primary font-semibold mt-1">
                                Rifa: {raffle.title}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-warning/20 text-warning border-warning/40">
                              {ticketGroup.length} {ticketGroup.length === 1 ? 'Número' : 'Números'}
                            </Badge>
                            {ticketGroup.length > 1 && (
                              <Badge className="bg-accent/20 text-accent border-accent/40 text-xs">
                                Compra Múltipla
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Ticket Numbers */}
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                          <p className="text-xs text-muted-foreground mb-2">
                            {ticketGroup.length === 1 ? 'Número Sorteado' : 'Números Sorteados'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {ticketNumbers.map((num, idx) => (
                              <div key={idx} className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40">
                                <span className="text-xl font-bold text-primary">{num}</span>
                              </div>
                            ))}
                          </div>
                          {raffle && (
                            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/40">
                              Total: <span className="font-bold text-accent">R$ {totalAmount.toFixed(2)}</span>
                            </p>
                          )}
                        </div>

                        {/* Payment Proof */}
                        <div className="relative rounded-lg overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors">
                          <img
                            src={firstTicket.payment_proof_url}
                            alt="Comprovante"
                            className="w-full h-40 object-cover cursor-pointer"
                            onClick={() => window.open(firstTicket.payment_proof_url, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold">
                              Clique para ampliar
                            </p>
                          </div>
                        </div>

                        {/* Date */}
                        <p className="text-xs text-muted-foreground">
                          📅 {new Date(firstTicket.created_at).toLocaleString('pt-BR')}
                        </p>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button
                            onClick={() => handleApproveGroup(ticketGroup.map(t => t.id))}
                            disabled={updateTicketStatus.isPending}
                            className="bg-success hover:bg-success/80 text-white h-12 text-base font-semibold shadow-lg hover:shadow-success/50 transition-all"
                          >
                            <Check className="h-5 w-5 mr-2" />
                            {ticketGroup.length === 1 ? 'Aprovar' : `Aprovar Todos (${ticketGroup.length})`}
                          </Button>
                          <Button
                            onClick={() => handleRejectGroup(ticketGroup.map(t => t.id))}
                            disabled={updateTicketStatus.isPending}
                            variant="destructive"
                            className="h-12 text-base font-semibold shadow-lg hover:shadow-destructive/50 transition-all"
                          >
                            <X className="h-5 w-5 mr-2" />
                            {ticketGroup.length === 1 ? 'Recusar' : `Recusar Todos`}
                          </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deleted Tickets History */}
        {showDeleted && (
          <Card className="gradient-card border-destructive/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-destructive" />
                  Histórico de Deletados
                </CardTitle>
                <Badge className="bg-destructive text-white text-lg px-4 py-1">
                  {deletedTickets.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {deletedTickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum participante deletado
                </p>
              ) : (
                <div className="space-y-3">
                  {deletedTickets.map((ticket) => {
                    const raffle = raffles.find(r => r.id === ticket.raffle_id);
                    return (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-lg border border-border bg-card/50 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold">{ticket.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Número: <span className="font-bold">{ticket.ticket_number}</span> • {raffle?.title}
                          </p>
                          <p className="text-xs text-destructive">
                            Deletado em: {new Date(ticket.deleted_at!).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          onClick={() => restoreTicket.mutateAsync(ticket.id)}
                          variant="outline"
                          size="sm"
                          className="border-success text-success hover:bg-success/10"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restaurar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="gradient-card border-success/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Participantes Aprovados ({approvedTickets.length})</CardTitle>
              <Button
                onClick={() => handleExportParticipants()}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredApprovedTickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum participante aprovado ainda
              </p>
            ) : (
              <div className="space-y-3">
                {filteredApprovedTickets.map((ticket) => {
                  const raffle = raffles.find(r => r.id === ticket.raffle_id);
                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border border-border bg-card/50 flex items-center justify-between group hover:border-primary/40 transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{ticket.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Número: <span className="text-success font-bold">{ticket.ticket_number}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          RG: {ticket.rg} • {raffle?.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success">Aprovado</Badge>
                        <Button
                          onClick={() => {
                            if (window.confirm(`Deletar participante ${ticket.full_name}?\n\nO registro será mantido no histórico.`)) {
                              softDeleteTicket.mutateAsync(ticket.id);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity border-destructive text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {raffles.length > 0 && (
                <div className="pt-4 space-y-4 border-t border-border mt-6">
                  <Label className="text-lg font-semibold">🎲 Sortear Vencedor</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Selecione a Rifa</Label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2 rounded-lg border border-border bg-background text-foreground"
                          value={selectedRaffleForDraw?.id || ''}
                          onChange={(e) => {
                            const raffle = raffles.find(r => r.id === e.target.value);
                            if (raffle) {
                              setSelectedRaffleForDraw(raffle);
                              setEditingRaffle(raffle);
                              setEditTitle(raffle.title);
                              setEditDescription(raffle.description || '');
                              setEditPrice(raffle.ticket_price.toString());
                              setEditTotalTickets(raffle.total_tickets.toString());
                              setEditImageUrl(raffle.image_url || '');
                            }
                          }}
                        >
                          <option value="">Selecione uma rifa...</option>
                          {activeRaffles.map((raffle) => (
                            <option key={raffle.id} value={raffle.id}>
                              {raffle.title} ({approvedTickets.filter(t => t.raffle_id === raffle.id).length} participantes)
                            </option>
                          ))}
                        </select>
                        {selectedRaffleForDraw && (
                          <Button
                            onClick={() => handleExportParticipants(selectedRaffleForDraw.id)}
                            variant="outline"
                            size="icon"
                            title="Exportar participantes desta rifa"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedRaffleForDraw && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">
                          Rifa selecionada: <span className="font-bold text-primary">
                            {selectedRaffleForDraw.title}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Participantes aprovados: <span className="font-bold text-success">
                            {approvedTickets.filter(t => t.raffle_id === selectedRaffleForDraw.id).length}
                          </span>
                        </p>
                        <Button
                          onClick={() => handleRandomDraw()}
                          className="w-full gradient-primary text-primary-foreground mb-3"
                          size="lg"
                        >
                          <Trophy className="h-5 w-5 mr-2" />
                          Sortear Aleatoriamente
                        </Button>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">ou</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Selecionar Número Manualmente</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={winnerNumber}
                          onChange={(e) => setWinnerNumber(e.target.value)}
                          placeholder="Digite o número vencedor"
                          disabled={!selectedRaffleForDraw}
                        />
                        <Button
                          onClick={() => {
                            if (selectedRaffleForDraw) {
                              handleSelectWinner(selectedRaffleForDraw.id);
                            } else {
                              toast.error('Selecione uma rifa primeiro');
                            }
                          }}
                          disabled={!selectedRaffleForDraw || !winnerNumber}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {viewDetailsRaffle && (
        <RaffleDetailsModal
          raffle={viewDetailsRaffle}
          onClose={() => setViewDetailsRaffle(null)}
          isAdminMode
          onRandomDraw={handleRandomDraw}
        />
      )}

      <Footer />
    </div>
  );
}
