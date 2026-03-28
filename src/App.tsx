import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from '@/contexts/AppContext';
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
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const location = useLocation();
  const { user, isAdmin } = useApp();

  useEffect(() => {
    const trimmedPath = location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname;
    const normalizedPath = trimmedPath.replace(/\/{2,}/g, '/');

    if (normalizedPath !== location.pathname) {
      navigate(`${normalizedPath}${location.search}${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  // Protected routes: require login (user or admin)
  const PROTECTED_PATHS = ['/explore', '/create', '/myboxes'];
  useEffect(() => {
    const requiresLogin = PROTECTED_PATHS.includes(location.pathname) || location.pathname.startsWith('/box/');

    if (requiresLogin && !user && !isAdmin) {
      setPendingPath(location.pathname);
      setLoginOpen(true);
      navigate('/', { replace: true });
    }
  }, [location.pathname, user, isAdmin, navigate]);

  // Admin route: require admin session only
  useEffect(() => {
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      setAdminLoginOpen(true);
      navigate('/', { replace: true });
    }
  }, [location.pathname, isAdmin, navigate]);

  const handleLoginSuccess = useCallback(() => {
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  }, [pendingPath, navigate]);

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
        onSuccess={handleLoginSuccess}
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
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
