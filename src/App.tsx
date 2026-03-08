import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import AdminLoginModal from '@/components/AdminLoginModal';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import BoxDetail from '@/pages/BoxDetail';
import CreateBox from '@/pages/CreateBox';
import MyBoxes from '@/pages/MyBoxes';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppContent() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onLoginClick={() => setLoginOpen(true)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onLoginClick={() => setLoginOpen(true)} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/box/:id" element={<BoxDetail />} />
          <Route path="/create" element={<CreateBox />} />
          <Route path="/myboxes" element={<MyBoxes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />

      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onAdminClick={() => setAdminLoginOpen(true)}
      />
      <AdminLoginModal
        open={adminLoginOpen}
        onOpenChange={setAdminLoginOpen}
        onSuccess={() => navigate('/admin')}
      />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
