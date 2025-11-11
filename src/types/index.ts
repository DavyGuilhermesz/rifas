export interface Raffle {
  id: string;
  title: string;
  description: string | null;
  ticket_price: number;
  total_tickets: number;
  image_url: string | null;
  status: 'active' | 'completed' | 'cancelled';
  winner_ticket_number: number | null;
  draw_date: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Ticket {
  id: string;
  raffle_id: string;
  user_id: string | null;
  full_name: string;
  rg: string;
  payment_proof_url: string;
  ticket_number: number | null;
  status: 'reserved' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  reserved_until?: string | null;
  deleted_at?: string | null;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  is_admin?: boolean;
}
