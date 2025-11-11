import { useState, useMemo } from 'react';
import { Upload, X, Ticket as TicketIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Raffle } from '@/types';
import { useTickets } from '@/hooks/useTickets';

interface ParticipateFormProps {
  raffle: Raffle;
  onClose: () => void;
}

export function ParticipateForm({ raffle, onClose }: ParticipateFormProps) {
  const [fullName, setFullName] = useState('');
  const [rg, setRg] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { createTicket, tickets } = useTickets(raffle.id);

  const availableCount = useMemo(() => {
    const approved = tickets.filter(t => t.status === 'approved');
    const pending = tickets.filter(t => t.status === 'pending');
    const usedCount = approved.length + pending.length;
    return raffle.total_tickets - usedCount;
  }, [tickets, raffle.total_tickets]);

  const totalAmount = quantity * raffle.ticket_price;

  const getRandomAvailableNumbers = (count: number): number[] => {
    const approved = tickets.filter(t => t.status === 'approved');
    const pending = tickets.filter(t => t.status === 'pending');
    const usedNumbers = new Set([...approved, ...pending].map(t => t.ticket_number).filter(Boolean));
    
    const available = Array.from({ length: raffle.total_tickets }, (_, i) => i + 1)
      .filter(num => !usedNumbers.has(num));
    
    const selected: number[] = [];
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      selected.push(shuffled[i]);
    }
    
    return selected.sort((a, b) => a - b);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof) {
      return;
    }

    // Generate random numbers
    const randomNumbers = getRandomAvailableNumbers(quantity);
    
    if (randomNumbers.length === 0) {
      return;
    }

    // Create tickets with random numbers
    await createTicket.mutateAsync({
      raffle_id: raffle.id,
      full_name: fullName,
      rg,
      payment_proof: paymentProof,
      ticket_numbers: randomNumbers,
    });

    onClose();
  };

  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <CardHeader>
        <CardTitle>Participar da Rifa</CardTitle>
        <CardDescription>{raffle.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quantidade de Números (Aleatórios)
            </Label>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12"
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Números</p>
                    <p className="text-4xl font-bold text-primary">{quantity}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(availableCount, quantity + 1))}
                    className="h-12 w-12"
                    disabled={quantity >= availableCount}
                  >
                    +
                  </Button>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div>
                    <p className="text-sm text-muted-foreground">Disponíveis</p>
                    <p className="text-lg font-bold text-success">{availableCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total a pagar</p>
                    <p className="text-2xl font-bold text-accent">R$ {totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[1, 5, 10, 20].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(availableCount, num))}
                      className="flex-1"
                      disabled={num > availableCount}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-primary" />
                Seus números serão sorteados aleatoriamente após o envio
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              placeholder="Digite seu RG"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Comprovante de Pagamento</Label>
            {preview ? (
              <div className="relative rounded-lg border border-border overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPaymentProof(null);
                    setPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Clique para enviar o comprovante
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTicket.isPending || quantity === 0 || !paymentProof}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              {createTicket.isPending ? 'Enviando...' : `Comprar ${quantity} Número(s)`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
