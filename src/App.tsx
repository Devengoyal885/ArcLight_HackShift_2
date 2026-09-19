import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';

// Auth
import LoginPage from './pages/auth/LoginPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import { AuthProvider } from './context/AuthContext';

// Candidate
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CapabilityPage from './pages/candidate/CapabilityPage';
import CareerPage from './pages/candidate/CareerPage';
import LearningPage from './pages/candidate/LearningPage';
import OpportunitiesPage from './pages/candidate/OpportunitiesPage';
import PortfolioPage from './pages/candidate/PortfolioPage';
import MailIQPage from './pages/candidate/MailIQPage';

// Candidate - Resume AI (simple inline page)
import ResumeAIPage from './pages/candidate/ResumeAIPage';

// Candidate - Codolio Profile
import CodolioProfilePage from './pages/candidate/CodolioProfilePage';

// Employer
import EmployerDashboard from './pages/employer/EmployerDashboard';
import TalentPage from './pages/employer/TalentPage';
import RolesPage from './pages/employer/RolesPage';
import WorkforcePage from './pages/employer/WorkforcePage';
import InsightsPage from './pages/employer/InsightsPage';
import CandidateProfilePage from './pages/employer/CandidateProfilePage';

// Shared / Marketing
import LandingPage from './pages/marketing/LandingPage';
import PrivacyPage from './pages/shared/PrivacyPage';
import TransparencyPage from './pages/shared/TransparencyPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root Node -> Marketing Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Candidate */}
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/candidate/capability" element={<CapabilityPage />} />
          <Route path="/candidate/career" element={<CareerPage />} />
          <Route path="/candidate/learning" element={<LearningPage />} />
          <Route path="/candidate/opportunities" element={<OpportunitiesPage />} />
          <Route path="/candidate/applications" element={<ResumeAIPage />} />
          <Route path="/candidate/portfolio" element={<PortfolioPage />} />
          <Route path="/candidate/mailiq" element={<MailIQPage />} />
          <Route path="/candidate/coding-profile" element={<CodolioProfilePage />} />

          {/* Employer */}
          <Route path="/employer" element={<EmployerDashboard />} />
          <Route path="/employer/talent" element={<TalentPage />} />
          <Route path="/employer/roles" element={<RolesPage />} />
          <Route path="/employer/workforce" element={<WorkforcePage />} />
          <Route path="/employer/insights" element={<InsightsPage />} />
          <Route path="/employer/candidate/:id" element={<CandidateProfilePage />} />

          {/* Shared */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/transparency" element={<TransparencyPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
