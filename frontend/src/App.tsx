import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { AppointmentOverviewPage } from '@/pages/AppointmentOverviewPage';
import { StudyTypesPage } from '@/pages/StudyTypesPage';
import { StudyResultsPage } from '@/pages/StudyResultsPage';
import { SemanticSearchPage } from '@/pages/SemanticSearchPage';
import { ClinicalHistoryPage } from '@/pages/ClinicalHistoryPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/:id" element={<AppointmentOverviewPage />} />
          <Route path="/study-types" element={<StudyTypesPage />} />
          <Route path="/study-results" element={<StudyResultsPage />} />
          <Route path="/search" element={<SemanticSearchPage />} />
          <Route path="/clinical-history" element={<ClinicalHistoryPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
