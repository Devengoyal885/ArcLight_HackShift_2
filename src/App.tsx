import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import LoadingScreen from './components/ui/LoadingScreen';
import { ToastNotifications } from './components/ui/ToastNotifications';
import CommandPalette from './components/ui/CommandPalette';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal';
import CookieBanner from './components/ui/CookieBanner';

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Candidate
const CandidateDashboard = lazy(() => import('./pages/candidate/CandidateDashboard'));
const CapabilityPage = lazy(() => import('./pages/candidate/CapabilityPage'));
const CareerPage = lazy(() => import('./pages/candidate/CareerPage'));
const LearningPage = lazy(() => import('./pages/candidate/LearningPage'));
const OpportunitiesPage = lazy(() => import('./pages/candidate/OpportunitiesPage'));
const PortfolioPage = lazy(() => import('./pages/candidate/PortfolioPage'));
const MailIQPage = lazy(() => import('./pages/candidate/MailIQPage'));
const ResumeAIPage = lazy(() => import('./pages/candidate/ResumeAIPage'));

const ApplicationsPage = lazy(() => import('./pages/candidate/ApplicationsPage'));
const OAPlatformPage = lazy(() => import('./pages/candidate/OAPlatformPage'));

// Candidate - Hub Pages
const PreparationHubPage = lazy(() => import('./pages/candidate/PreparationHubPage'));
const JobsHubPage = lazy(() => import('./pages/candidate/JobsHubPage'));
const CommunityHubPage = lazy(() => import('./pages/candidate/CommunityHubPage'));
const CareerHubPage = lazy(() => import('./pages/candidate/CareerHubPage'));
const PracticeSolvePage = lazy(() => import('./pages/candidate/PracticeSolvePage'));

// Candidate - Communication & Soft Skills
const AIInterviewSimulator = lazy(() => import('./pages/candidate/AIInterviewSimulator'));

// Candidate - Digital Profile
const CodolioProfilePage = lazy(() => import('./pages/candidate/CodolioProfilePage'));

// Employer
const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard'));
const TalentPage = lazy(() => import('./pages/employer/TalentPage'));
const RolesPage = lazy(() => import('./pages/employer/RolesPage'));
const WorkforcePage = lazy(() => import('./pages/employer/WorkforcePage'));
const InsightsPage = lazy(() => import('./pages/employer/InsightsPage'));
const PartnersPage = lazy(() => import('./pages/employer/PartnersPage'));
const CandidateProfilePage = lazy(() => import('./pages/employer/CandidateProfilePage'));
const PipelinePage = lazy(() => import('./pages/employer/PipelinePage'));
const InterviewSchedulerPage = lazy(() => import('./pages/employer/InterviewSchedulerPage'));
const EmployerBrandingPage = lazy(() => import('./pages/employer/EmployerBrandingPage'));
const FounderCollabPage = lazy(() => import('./pages/employer/FounderCollabPage'));

// Shared / Marketing
const LandingPage = lazy(() => import('./pages/marketing/LandingPage'));
const PrivacyPage = lazy(() => import('./pages/shared/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/shared/TermsPage'));
const TransparencyPage = lazy(() => import('./pages/shared/TransparencyPage'));
const CertificatePage = lazy(() => import('./pages/shared/CertificatePage'));
const PublicProfilePage = lazy(() => import('./pages/shared/PublicProfilePage'));
const NotFoundPage = lazy(() => import('./pages/shared/NotFoundPage'));
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'));

// Candidate-specific
const AptitudeTestPage = lazy(() => import('./pages/candidate/AptitudeTestPage'));
const AptitudeHistoryPage = lazy(() => import('./pages/candidate/AptitudeHistoryPage'));
const ResumeBuilderPage = lazy(() => import('./pages/candidate/ResumeBuilderPage'));
const PlacementDrivesPage = lazy(() => import('./pages/candidate/PlacementDrivesPage'));
const AlumniNetworkPage = lazy(() => import('./pages/candidate/AlumniNetworkPage'));
const DriveCalendarPage = lazy(() => import('./pages/candidate/DriveCalendarPage'));
const PracticePage = lazy(() => import('./pages/candidate/PracticePage'));
const NotificationSettingsPage = lazy(() => import('./pages/candidate/NotificationSettingsPage'));
const GoalsPage = lazy(() => import('./pages/candidate/GoalsPage'));
const ForumPage = lazy(() => import('./pages/candidate/ForumPage'));
const EventsPage = lazy(() => import('./pages/candidate/EventsPage'));
const OffCampusPage = lazy(() => import('./pages/candidate/OffCampusPage'));
const CaseStudyPage = lazy(() => import('./pages/candidate/CaseStudyPage'));
const GDTopicsPage = lazy(() => import('./pages/candidate/GDTopicsPage'));
const ArcLightPage = lazy(() => import('./pages/candidate/ArcLightPage'));

// Academician
const AcademicianDashboard = lazy(() => import('./pages/academician/AcademicianDashboard'));
const AcademicianProfilePage = lazy(() => import('./pages/academician/AcademicianProfilePage'));
const FDPPage = lazy(() => import('./pages/academician/FDPPage'));
const ResearchPage = lazy(() => import('./pages/academician/ResearchPage'));
const ConsultancyPage = lazy(() => import('./pages/academician/ConsultancyPage'));
const AcademicianInternshipsPage = lazy(() => import('./pages/academician/AcademicianInternshipsPage'));
const MentorshipPage = lazy(() => import('./pages/academician/MentorshipPage'));
const WorkshopsPage = lazy(() => import('./pages/academician/WorkshopsPage'));

// Faculty (Student Intelligence Dashboard)
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));

// Institution
const InstitutionDashboard = lazy(() => import('./pages/institution/InstitutionDashboard'));
const StudentsPage = lazy(() => import('./pages/institution/StudentsPage'));
const PlacementsPage = lazy(() => import('./pages/institution/PlacementsPage'));
const IndustryPage = lazy(() => import('./pages/institution/IndustryPage'));
const AnalyticsPage = lazy(() => import('./pages/institution/AnalyticsPage'));
const ProgramsPage = lazy(() => import('./pages/institution/ProgramsPage'));
const DrivesAdminPage = lazy(() => import('./pages/institution/DrivesAdminPage'));
const NAACReportPage = lazy(() => import('./pages/institution/NAACReportPage'));
const CommunicationsPage = lazy(() => import('./pages/institution/CommunicationsPage'));
const InstitutionIncubationPage = lazy(() => import('./pages/institution/InstitutionIncubationPage'));

import { ThemeProvider } from './context/ThemeContext';

function CommandPaletteWrapper() {
  const [isOpen, setIsOpen] = React.useState(false);
  return <CommandPalette isOpen={isOpen} setIsOpen={setIsOpen} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastNotifications />
        <CommandPaletteWrapper />
        <KeyboardShortcutsModal />
        <CookieBanner />
        <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
          {/* Root Node -> Marketing Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* ─── Candidate (Student) ───────────────────────────────────────── */}
          <Route path="/candidate" element={<ProtectedRoute allowedRoles={['candidate']}><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/candidate/capability" element={<ProtectedRoute allowedRoles={['candidate']}><CapabilityPage /></ProtectedRoute>} />
          
          {/* Career Hub & Redirects */}
          <Route path="/candidate/career" element={<ProtectedRoute allowedRoles={['candidate']}><CareerHubPage /></ProtectedRoute>} />
          <Route path="/candidate/learning" element={<Navigate to="/candidate/career?tab=learning" replace />} />
          <Route path="/candidate/resume" element={<Navigate to="/candidate/career?tab=resume" replace />} />
          <Route path="/candidate/portfolio" element={<Navigate to="/candidate/career?tab=portfolio" replace />} />
          <Route path="/candidate/goals" element={<Navigate to="/candidate/career?tab=goals" replace />} />

          {/* Opportunities & Jobs Hub & Redirects */}
          <Route path="/candidate/opportunities" element={<ProtectedRoute allowedRoles={['candidate']}><JobsHubPage /></ProtectedRoute>} />
          <Route path="/candidate/jobs" element={<ProtectedRoute allowedRoles={['candidate']}><JobsHubPage /></ProtectedRoute>} />
          <Route path="/candidate/applications" element={<ProtectedRoute allowedRoles={['candidate']}><ApplicationsPage /></ProtectedRoute>} />
          <Route path="/candidate/placement-drives" element={<Navigate to="/candidate/opportunities?tab=drives" replace />} />
          <Route path="/candidate/off-campus" element={<Navigate to="/candidate/opportunities?tab=off-campus" replace />} />
          
          {/* Preparation Hub & Redirects */}
          <Route path="/candidate/preparation" element={<ProtectedRoute allowedRoles={['candidate']}><PreparationHubPage /></ProtectedRoute>} />
          <Route path="/candidate/communication" element={<Navigate to="/candidate/preparation?tab=communication" replace />} />
          <Route path="/candidate/case-study" element={<Navigate to="/candidate/preparation?tab=case-study" replace />} />
          <Route path="/candidate/gd-topics" element={<Navigate to="/candidate/preparation?tab=gd-topics" replace />} />
          
          {/* Community Hub & Redirects */}
          <Route path="/candidate/community" element={<ProtectedRoute allowedRoles={['candidate']}><CommunityHubPage /></ProtectedRoute>} />
          <Route path="/candidate/forum" element={<Navigate to="/candidate/community" replace />} />
          <Route path="/candidate/events" element={<Navigate to="/candidate/community?tab=events" replace />} />

          <Route path="/candidate/practice/solve/:titleSlug" element={<ProtectedRoute allowedRoles={['candidate']}><PracticeSolvePage /></ProtectedRoute>} />
          <Route path="/candidate/mailiq" element={<ProtectedRoute allowedRoles={['candidate']}><MailIQPage /></ProtectedRoute>} />
          <Route path="/candidate/oa/:appId" element={<ProtectedRoute allowedRoles={['candidate']}><OAPlatformPage /></ProtectedRoute>} />
          <Route path="/candidate/coding-profile" element={<ProtectedRoute allowedRoles={['candidate', 'academician', 'employer', 'institution']}><CodolioProfilePage /></ProtectedRoute>} />
          <Route path="/candidate/coding-profile/:uid" element={<ProtectedRoute allowedRoles={['candidate', 'academician', 'employer', 'institution']}><CodolioProfilePage /></ProtectedRoute>} />
          <Route path="/candidate/communication/interview" element={<ProtectedRoute allowedRoles={['candidate']}><AIInterviewSimulator /></ProtectedRoute>} />
          <Route path="/candidate/aptitude" element={<ProtectedRoute allowedRoles={['candidate']}><AptitudeTestPage /></ProtectedRoute>} />
          <Route path="/candidate/aptitude/history" element={<ProtectedRoute allowedRoles={['candidate']}><AptitudeHistoryPage /></ProtectedRoute>} />
          <Route path="/candidate/resume-builder" element={<ProtectedRoute allowedRoles={['candidate']}><ResumeBuilderPage /></ProtectedRoute>} />
          <Route path="/candidate/alumni" element={<ProtectedRoute allowedRoles={['candidate']}><AlumniNetworkPage /></ProtectedRoute>} />
          <Route path="/candidate/drive-calendar" element={<ProtectedRoute allowedRoles={['candidate']}><DriveCalendarPage /></ProtectedRoute>} />
          <Route path="/candidate/practice" element={<ProtectedRoute allowedRoles={['candidate']}><PracticePage /></ProtectedRoute>} />
          <Route path="/candidate/notification-settings" element={<ProtectedRoute allowedRoles={['candidate']}><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/candidate/insights" element={<ProtectedRoute allowedRoles={['candidate']}><ArcLightPage /></ProtectedRoute>} />

          {/* ─── Employer (Industry) ───────────────────────────────────────── */}
          <Route path="/employer" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
          <Route path="/employer/founders" element={<ProtectedRoute allowedRoles={['employer']}><FounderCollabPage /></ProtectedRoute>} />
          <Route path="/employer/talent" element={<ProtectedRoute allowedRoles={['employer']}><TalentPage /></ProtectedRoute>} />
          <Route path="/employer/roles" element={<ProtectedRoute allowedRoles={['employer']}><RolesPage /></ProtectedRoute>} />
          <Route path="/employer/pipeline" element={<ProtectedRoute allowedRoles={['employer']}><PipelinePage /></ProtectedRoute>} />
          <Route path="/employer/schedule" element={<ProtectedRoute allowedRoles={['employer']}><InterviewSchedulerPage /></ProtectedRoute>} />
          <Route path="/employer/workforce" element={<ProtectedRoute allowedRoles={['employer']}><WorkforcePage /></ProtectedRoute>} />
          <Route path="/employer/insights" element={<ProtectedRoute allowedRoles={['employer']}><InsightsPage /></ProtectedRoute>} />
          <Route path="/employer/branding" element={<ProtectedRoute allowedRoles={['employer']}><EmployerBrandingPage /></ProtectedRoute>} />
          <Route path="/employer/partners" element={<ProtectedRoute allowedRoles={['employer']}><PartnersPage /></ProtectedRoute>} />
          <Route path="/employer/candidate/:id" element={<ProtectedRoute allowedRoles={['employer', 'academician']}><CandidateProfilePage /></ProtectedRoute>} />

          {/* ─── Shared Profile View (Read-Only) ─────────────────────────────── */}
          <Route path="/profile/:uid" element={<ProtectedRoute allowedRoles={['candidate', 'employer', 'academician', 'institution']}><CodolioProfilePage /></ProtectedRoute>} />

          {/* ─── Academician (Faculty) ─────────────────────────────────────── */}
          <Route path="/faculty" element={<ProtectedRoute allowedRoles={['academician']}><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/academician" element={<ProtectedRoute allowedRoles={['academician']}><AcademicianDashboard /></ProtectedRoute>} />
          <Route path="/academician/profile" element={<ProtectedRoute allowedRoles={['academician']}><AcademicianProfilePage /></ProtectedRoute>} />
          <Route path="/academician/fdp" element={<ProtectedRoute allowedRoles={['academician']}><FDPPage /></ProtectedRoute>} />
          <Route path="/academician/research" element={<ProtectedRoute allowedRoles={['academician']}><ResearchPage /></ProtectedRoute>} />
          <Route path="/academician/consultancy" element={<ProtectedRoute allowedRoles={['academician']}><ConsultancyPage /></ProtectedRoute>} />
          <Route path="/academician/internships" element={<ProtectedRoute allowedRoles={['academician']}><AcademicianInternshipsPage /></ProtectedRoute>} />
          <Route path="/academician/mentorship" element={<ProtectedRoute allowedRoles={['academician', 'candidate', 'institution']}><MentorshipPage /></ProtectedRoute>} />
          <Route path="/academician/workshops" element={<ProtectedRoute allowedRoles={['academician']}><WorkshopsPage /></ProtectedRoute>} />

          {/* ─── Institution (Admin) ───────────────────────────────────────── */}
          <Route path="/institution" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionDashboard /></ProtectedRoute>} />
          <Route path="/institution/students" element={<ProtectedRoute allowedRoles={['institution']}><StudentsPage /></ProtectedRoute>} />
          <Route path="/institution/placements" element={<ProtectedRoute allowedRoles={['institution']}><PlacementsPage /></ProtectedRoute>} />
          <Route path="/institution/analytics" element={<ProtectedRoute allowedRoles={['institution']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/institution/industry" element={<ProtectedRoute allowedRoles={['institution']}><IndustryPage /></ProtectedRoute>} />
          <Route path="/institution/programs" element={<ProtectedRoute allowedRoles={['institution']}><ProgramsPage /></ProtectedRoute>} />
          <Route path="/institution/drives" element={<ProtectedRoute allowedRoles={['institution']}><DrivesAdminPage /></ProtectedRoute>} />
          <Route path="/institution/naac" element={<ProtectedRoute allowedRoles={['institution']}><NAACReportPage /></ProtectedRoute>} />
          <Route path="/institution/communications" element={<ProtectedRoute allowedRoles={['institution']}><CommunicationsPage /></ProtectedRoute>} />
          <Route path="/institution/incubation" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionIncubationPage /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/transparency" element={<TransparencyPage />} />
          {/* Public certificate verification — no login required */}
          <Route path="/certificate/:certId" element={<CertificatePage />} />
          {/* Public candidate profile — no login required */}
          <Route path="/u/:username" element={<PublicProfilePage />} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['candidate', 'employer', 'academician', 'institution']}><SettingsPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
