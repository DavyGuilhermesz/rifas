import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Raffle } from '@/types';
import { toast } from 'sonner';

export function useRaffles() {
  const queryClient = useQueryClient();

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: ['raffles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Raffle[];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  const createRaffle = useMutation({
    mutationFn: async (raffle: Omit<Raffle, 'id' | 'created_at' | 'status' | 'winner_ticket_number'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('raffles')
        .insert([{ ...raffle, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['raffles'] });
      toast.success('Rifa criada com sucesso!');

      // Send Discord notification
      try {
        await supabase.functions.invoke('notify-discord', {
          body: {
            eventType: 'raffle_created',
            data: {
              title: data.title,
              description: data.description,
              price: data.ticket_price,
              totalTickets: data.total_tickets,
              imageUrl: data.image_url,
            },
          },
        });
      } catch (error) {
        console.error('Failed to send Discord notification:', error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteRaffle = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, title };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['raffles'] });
      toast.success('Rifa deletada com sucesso!');

      // Send Discord notification
      try {
        await supabase.functions.invoke('notify-discord', {
          body: {
            eventType: 'raffle_deleted',
            data: {
              title: data.title,
            },
          },
        });
      } catch (error) {
        console.error('Failed to send Discord notification:', error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    raffles,
    isLoading,
    createRaffle,
    deleteRaffle,
  };
}
