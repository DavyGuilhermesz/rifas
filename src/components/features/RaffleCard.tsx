import { memo } from 'react';
import { Calendar, DollarSign, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Raffle } from '@/types';

interface RaffleCardProps {
  raffle: Raffle;
  onParticipate: (raffle: Raffle) => void;
  onViewDetails?: (raffle: Raffle) => void;
  disabled?: boolean;
}

export const RaffleCard = memo(function RaffleCard({ raffle, onParticipate, onViewDetails, disabled }: RaffleCardProps) {
  const isActive = raffle.status === 'active';

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in gradient-card border-primary/20">
      <div className="relative h-48 overflow-hidden">
        {raffle.image_url ? (
          <img
            src={raffle.image_url}
            alt={raffle.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full gradient-primary opacity-20" />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={isActive ? 'default' : 'secondary'} className="animate-bounce-in">
            {isActive ? 'Ativa' : raffle.status === 'completed' ? 'Finalizada' : 'Cancelada'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-3">
        <h3 className="text-xl font-bold line-clamp-1">{raffle.title}</h3>
        {raffle.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {raffle.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="font-semibold">
              R$ {raffle.ticket_price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span>{raffle.total_tickets} números</span>
          </div>
        </div>

        {raffle.draw_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Sorteio: {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-2">
        {onViewDetails && (
          <Button
            onClick={() => onViewDetails(raffle)}
            variant="outline"
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Detalhes
          </Button>
        )}
        <Button
          onClick={() => onParticipate(raffle)}
          disabled={!isActive || disabled}
          className="flex-1 gradient-primary text-primary-foreground"
        >
          Participar
        </Button>
      </CardFooter>
    </Card>
  );
});
