import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import OutfitPage from './pages/OutfitPage';
import PlanningPage from './pages/PlanningPage';
import WardrobePage from './pages/WardrobePage';
import HistoryPage from './pages/HistoryPage';
import AnalysisPage from './pages/AnalysisPage';
import LandingPage from './pages/LandingPage';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Supabase session check:', data, error);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* App Routes - Protected (conceptually) */}
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<OutfitPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="wardrobe" element={<WardrobePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
        </Route>

        {/* Fallback/Register routes */}
        <Route path="/register" element={<Navigate to="/" replace />} /> {/* Placeholder */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
