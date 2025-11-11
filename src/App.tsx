import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { HomePage } from '@/pages/HomePage';
import { AdminPage } from '@/pages/AdminPage';
import { MyTicketsPage } from '@/pages/MyTicketsPage';
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'my-tickets'>('home');
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin' && isAdmin) {
    return <AdminPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'my-tickets') {
    return <MyTicketsPage onBack={() => setCurrentPage('home')} />;
  }

  return (
    <HomePage 
      onAdminClick={() => setCurrentPage('admin')} 
      onMyTicketsClick={() => setCurrentPage('my-tickets')}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
