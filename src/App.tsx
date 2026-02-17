import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import OutfitPage from './pages/OutfitPage';
import PlanningPage from './pages/PlanningPage';
import WardrobePage from './pages/WardrobePage';
import HistoryPage from './pages/HistoryPage';
import AnalysisPage from './pages/AnalysisPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import PaywallPage from './pages/PaywallPage';
import TravelPage from './pages/TravelPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Supabase session check:', data, error);
    });
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/paywall" element={<PaywallPage />} />

          {/* App Routes - Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<OutfitPage />} />
              <Route path="planning" element={<PlanningPage />} />
              <Route path="wardrobe" element={<WardrobePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="travel" element={<TravelPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
