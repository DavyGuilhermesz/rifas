import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Ticket } from '@/types';
import { toast } from 'sonner';

export function useTickets(raffleId?: string) {
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', raffleId],
    queryFn: async () => {
      let query = supabase.from('tickets').select('*');
      
      if (raffleId) {
        query = query.eq('raffle_id', raffleId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Ticket[];
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const softDeleteTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Participante removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const restoreTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ deleted_at: null })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Participante restaurado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });



  const createTicket = useMutation({
    mutationFn: async (ticket: {
      raffle_id: string;
      full_name: string;
      rg: string;
      payment_proof: File;
      ticket_numbers: number[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = ticket.payment_proof.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, ticket.payment_proof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (urlError) throw urlError;

      // Create tickets for each number with pending status
      const tickets = ticket.ticket_numbers.map(num => ({
        raffle_id: ticket.raffle_id,
        user_id: user.id,
        full_name: ticket.full_name,
        rg: ticket.rg,
        payment_proof_url: urlData.signedUrl,
        ticket_number: num,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('tickets')
        .insert(tickets)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Participação enviada! Aguarde a aprovação.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { 
      ticketId: string; 
      status: 'approved' | 'rejected';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status,
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      };

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    tickets,
    isLoading,
    createTicket,
    updateTicketStatus,
    softDeleteTicket,
    restoreTicket,
  };
}
