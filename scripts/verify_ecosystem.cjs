/**
 * CapAble System & Ecosystem Automated Test Suite
 * Validates integrity across Navigation, Services, Contracts, and Endpoints
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
    if (condition) {
        console.log(`  ✅ PASS: ${description}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${description} ${details ? `(${details})` : ''}`);
        failed++;
    }
}

console.log('\n======================================================');
console.log('🧪 Running CapAble Ecosystem Automated Test Suite');
console.log('======================================================\n');

// 1. Navigation & Route Checks
console.log('📦 1. NAVIGATION & ROUTE CONTRACTS');
const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');
const navbarTsx = fs.readFileSync(path.join(ROOT, 'src/components/navigation/FloatingNavbar.tsx'), 'utf-8');

assert('Candidate 6-section navigation links defined', 
    navbarTsx.includes('/candidate/opportunities') &&
    navbarTsx.includes('/candidate/preparation') &&
    navbarTsx.includes('/candidate/career') &&
    navbarTsx.includes('/candidate/community') &&
    navbarTsx.includes('/candidate/applications')
);

assert('Backward-compatible redirects in App.tsx',
    appTsx.includes('/candidate/learning') &&
    appTsx.includes('/candidate/career?tab=learning') &&
    appTsx.includes('/candidate/resume') &&
    appTsx.includes('/candidate/career?tab=resume') &&
    appTsx.includes('/candidate/placement-drives')
);

assert('Institution Incubation / E-Cell Route registered',
    appTsx.includes('/institution/incubation')
);

// 2. Service Layer Contracts
console.log('\n📦 2. SERVICE LAYER CONTRACTS');
const ventureService = fs.readFileSync(path.join(ROOT, 'src/services/ventureService.ts'), 'utf-8');
const employerService = fs.readFileSync(path.join(ROOT, 'src/services/employerService.ts'), 'utf-8');
const twilioService = fs.readFileSync(path.join(ROOT, 'src/services/twilioService.ts'), 'utf-8');

assert('VentureService exports core CRUD functions',
    ventureService.includes('getStartupVentures') &&
    ventureService.includes('createStartupVenture') &&
    ventureService.includes('sendCollaborationRequest') &&
    ventureService.includes('applyToIncubationProgram')
);

assert('Venture Workspace methods (Section 8.3)',
    ventureService.includes('getVentureWorkspace') &&
    ventureService.includes('saveVentureWorkspace') &&
    ventureService.includes('VentureMilestone') &&
    ventureService.includes('VentureTask')
);

assert('Content Moderation / Reporting (Section 17)',
    ventureService.includes('reportVentureIdea') &&
    ventureService.includes('VentureReport')
);

assert('Employer startup stage & org-type extension (Section 7)',
    employerService.includes('orgType') &&
    employerService.includes('startupStage') &&
    employerService.includes('isStartupRole')
);

assert('Twilio WhatsApp venture notification helpers (Section 16)',
    twilioService.includes('notifyCofounderMatchWhatsApp') &&
    twilioService.includes('notifyIncubationStatusWhatsApp')
);

// 3. Components Integrity
console.log('\n📦 3. UI/UX COMPONENTS INTEGRITY');
const svView = fs.readFileSync(path.join(ROOT, 'src/components/opportunities/StartupVenturesView.tsx'), 'utf-8');
const alumniView = fs.readFileSync(path.join(ROOT, 'src/pages/candidate/AlumniNetworkPage.tsx'), 'utf-8');
const candidateDash = fs.readFileSync(path.join(ROOT, 'src/pages/candidate/CandidateDashboard.tsx'), 'utf-8');
const onboardingPage = fs.readFileSync(path.join(ROOT, 'src/pages/auth/OnboardingPage.tsx'), 'utf-8');

assert('StartupVenturesView has Workspace and Explore tabs',
    svView.includes("activeTab === 'explore'") &&
    svView.includes("activeTab === 'workspace'")
);

assert('StartupVenturesView has moderation report modal',
    svView.includes('reportingVenture') &&
    svView.includes('handleSendReport')
);

assert('AlumniNetworkPage has structured session booking modal (Section 9)',
    alumniView.includes('bookingMentor') &&
    alumniView.includes('handleBookSession') &&
    alumniView.includes('sessionTopic') &&
    alumniView.includes('meetUrl')
);

assert('CandidateDashboard has Founder Track / Entrepreneur Mode (Section 6)',
    candidateDash.includes('founderMode') &&
    candidateDash.includes('toggleFounderMode') &&
    candidateDash.includes('Founder & Venture Track')
);

assert('OnboardingPage has employer orgType selector (Section 7)',
    onboardingPage.includes('orgType') &&
    onboardingPage.includes('startupStage') &&
    onboardingPage.includes('foundingYear')
);

// 4. Server Endpoints
console.log('\n📦 4. SERVER ENDPOINTS INTEGRITY');
const serverIndex = fs.readFileSync(path.join(ROOT, 'server/index.ts'), 'utf-8');

assert('Server has cofounder-match notification endpoint',
    serverIndex.includes('/api/notify/cofounder-match')
);

assert('Server has incubation-status notification endpoint',
    serverIndex.includes('/api/notify/incubation-status')
);

assert('Server has Gemini proxy & Twilio Voice/SMS endpoints',
    serverIndex.includes('/api/gemini') &&
    serverIndex.includes('/api/notify/whatsapp') &&
    serverIndex.includes('/api/notify/sms') &&
    serverIndex.includes('/api/notify/call')
);

// 5. Database & Security Rules
console.log('\n📦 5. FIRESTORE SECURITY RULES INTEGRITY');
const firestoreRules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf-8');

assert('Firestore rules cover ventures collection',
    firestoreRules.includes('match /ventures/{ventureId}')
);

assert('Firestore rules cover collaborationRequests collection',
    firestoreRules.includes('match /collaborationRequests/{requestId}')
);

assert('Firestore rules cover incubationPrograms & incubationApplications',
    firestoreRules.includes('match /incubationPrograms/{programId}') &&
    firestoreRules.includes('match /incubationApplications/{appId}')
);

console.log('\n------------------------------------------------------');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('------------------------------------------------------\n');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 All CapAble Ecosystem Tests Passed Cleanly!\n');
    process.exit(0);
}
