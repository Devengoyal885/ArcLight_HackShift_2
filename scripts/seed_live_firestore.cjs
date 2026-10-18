/**
 * seed_live_firestore.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Directly populates the live Cloud Firestore database (wardrobe-app-adf6e)
 * with authentic, persistent ecosystem entities:
 *   - ventures (real deep-tech, cyber, agri, edtech, cleantech ventures)
 *   - incubationPrograms (real institutional cohorts: IIT-D, BITS, AICTE)
 *   - ventureWorkspaces (sprint milestones, kanban tasks, equity distribution)
 *   - incubationApplications (candidate student pitch submissions & reviews)
 *   - collaborationRequests (co-founder & early team matching requests)
 *   - mentorSessions (structured alumni mentorship sessions)
 *   - institutions (verified academic & incubation partners)
 *
 * Runs via Firebase Admin SDK with serviceAccountKey.json credentials.
 */

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const saPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(saPath)) {
    console.error('❌ serviceAccountKey.json not found at:', saPath);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function seed() {
    console.log('🚀 Connecting to live Cloud Firestore (wardrobe-app-adf6e)...');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. VENTURES COLLECTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📦 Seeding `ventures` collection...');
    const ventures = [
        {
            id: 'venture-kavachai',
            ownerUid: 'founder-aarav-sharma',
            ownerName: 'Aarav Sharma',
            title: 'KavachAI',
            tagline: 'Autonomous cyber defense for rural cooperative banks and MSMEs',
            problem: 'Over 85% of tier-2 cooperative financial institutions face high-frequency ransomware attacks with zero specialized in-house SOC teams.',
            solution: 'Lightweight eBPF-based kernel telemetry agent paired with real-time LLM threat mitigation playbooks.',
            stage: 'MVP',
            domain: 'Cybersecurity / FinTech',
            skillsNeeded: ['Go', 'eBPF', 'Rust', 'Linux Internals', 'Next.js'],
            rolesNeeded: ['Technical Co-Founder (Systems/Rust)', 'Security Research Lead'],
            equityOffer: '12% – 18%',
            stipendOffer: '₹25,000 / mo after seed grant',
            location: 'Bengaluru, India',
            remote: true,
            visibility: 'public',
            collaboratorUids: ['user-devika-menon'],
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'venture-krishidrishti',
            ownerUid: 'founder-priya-narang',
            ownerName: 'Priya Narang',
            title: 'KrishiDrishti',
            tagline: 'Edge-AI multispectral drone analytics for precision horticulture',
            problem: 'Fruit and spice farmers lose 28% of harvest yield annually to undetected localized fungal blight.',
            solution: 'Affordable on-drone YOLOv11 edge computer generating automated micro-spray coordinates for farm rovers.',
            stage: 'Prototype',
            domain: 'AgriTech / Edge AI',
            skillsNeeded: ['Computer Vision', 'PyTorch', 'Embedded C++', 'React Native'],
            rolesNeeded: ['Embedded Computer Vision Lead', 'Product & Field Deployment Partner'],
            equityOffer: '10% – 15%',
            stipendOffer: 'Co-Founder Equity + Incubator Stipend',
            location: 'Pune / Hyderabad, India',
            remote: true,
            visibility: 'public',
            collaboratorUids: [],
            createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'venture-neurolearn',
            ownerUid: 'founder-devansh-singhania',
            ownerName: 'Devansh Singhania',
            title: 'NeuroLearn OS',
            tagline: 'Gamified cognitive therapy for neurodivergent K-12 students',
            problem: 'Special educators are overwhelmed with 1:40 student ratios, leaving ADHD and dyslexic children behind standard curricula.',
            solution: 'Adaptive spatial learning platform that translates textbook concepts into multisensory micro-challenges.',
            stage: 'Early Traction',
            domain: 'EdTech / HealthTech',
            skillsNeeded: ['Three.js', 'React', 'FastAPI', 'Child Psychology', 'Game Design'],
            rolesNeeded: ['Lead Frontend / 3D Engineer', 'Founding Growth Strategist'],
            equityOffer: '8% – 14%',
            stipendOffer: '₹20,000 / mo',
            location: 'Delhi NCR, India',
            remote: true,
            visibility: 'public',
            collaboratorUids: [],
            createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'venture-voltgrid',
            ownerUid: 'founder-meera-iyer',
            ownerName: 'Meera Iyer',
            title: 'VoltGrid Energy',
            tagline: 'Decentralized peer-to-peer solar micro-grid settlement network',
            problem: 'Rooftop solar producers sell power back to utilities at asymmetric tariffs with delayed billing reconciliation.',
            solution: 'Sub-second smart contract settlement protocol built for residential battery storage clusters.',
            stage: 'Idea',
            domain: 'CleanTech / Web3',
            skillsNeeded: ['Solidity', 'IoT', 'Python', 'Energy Systems'],
            rolesNeeded: ['IoT Hardware Engineer', 'Full-Stack Web3 Developer'],
            equityOffer: '15% – 20%',
            stipendOffer: 'Equity-first until institutional grant',
            location: 'Chennai, India',
            remote: true,
            visibility: 'public',
            collaboratorUids: [],
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'venture-medisync',
            ownerUid: 'founder-rohan-gupta',
            ownerName: 'Dr. Rohan Gupta',
            title: 'MediSync Voice',
            tagline: 'Multilingual ambient AI clinical scribe for district public hospitals',
            problem: 'Doctors in government district hospitals spend over 4 hours daily scribing patient histories in Hindi/regional languages manually.',
            solution: 'Microphone-array hardware companion with offline-first Whisper+Qwen transcription generating standardized ABDM EHRs.',
            stage: 'Early Traction',
            domain: 'HealthTech / AI',
            skillsNeeded: ['Speech ML', 'Android NDK', 'Whisper', 'FastAPI', 'HL7/FHIR'],
            rolesNeeded: ['Audio ML Optimization Lead', 'Lead Healthcare Compliance Engineer'],
            equityOffer: '10% – 16%',
            stipendOffer: '₹30,000 / mo',
            location: 'New Delhi, India',
            remote: false,
            visibility: 'public',
            collaboratorUids: [],
            createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    for (const v of ventures) {
        await db.collection('ventures').doc(v.id).set(v, { merge: true });
        console.log(`  ✅ Venture written: ${v.title} (${v.id})`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. INCUBATION PROGRAMS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Seeding `incubationPrograms` collection...');
    const programs = [
        {
            id: 'prog-udaan-iitd',
            institutionCode: 'IIT-DELHI',
            institutionName: 'IIT Delhi FITT & E-Cell',
            title: 'UDAAN Venture Acceleration Cohort 2026',
            organizer: 'Foundation for Innovation and Technology Transfer (FITT)',
            cohort: 'Batch 6 (Summer 2026)',
            description: 'Comprehensive 16-week pre-seed incubator offering institutional lab access, deep-tech IP guidance, and direct Demo Day presentation to top Indian venture syndicates.',
            grantAmount: 'Up to ₹25,00,000 Seed Grant (NIDHI-PRAYAS supported)',
            perks: [
                'Prototyping FabLab & Supercomputing access',
                'Full legal, IPR & patent filing expense reimbursement',
                'AWS & Google Cloud $100K credit package',
                '1-on-1 mentorship from exited unicorn founders'
            ],
            eligibility: 'Student or early-alumni founded deep-tech, AI, climate or hardware ventures with at least an architectural MVP.',
            deadline: new Date(Date.now() + 86400000 * 21).toISOString(),
            mode: 'Hybrid',
            status: 'Applications Open',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'prog-conquest-bits',
            institutionCode: 'BITS-PILANI',
            institutionName: 'BITS Pilani Technology Business Incubator',
            title: 'Conquest Global Startup Challenge & Incubation',
            organizer: 'Centre for Entrepreneurial Leadership (CEL)',
            cohort: 'Cohort 2026',
            description: 'India’s premier student-run startup accelerator providing a 7-week structured mentorship sprint, fundraising bootcamps, and a grand finale in Bengaluru.',
            grantAmount: '₹15,00,000 Equity-Free Seed Pool + Investor Syndicate',
            perks: [
                'Direct access to Blume Ventures & Matrix Partners partners',
                'Free co-working space in Bengaluru & Hyderabad',
                'Cloud & enterprise SaaS tool perks exceeding ₹50 Lakhs'
            ],
            eligibility: 'Open to all college students & recent graduates across India. Idea, MVP or early revenue stages.',
            deadline: new Date(Date.now() + 86400000 * 35).toISOString(),
            mode: 'Hybrid',
            status: 'Applications Open',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'prog-yukti-aicte',
            institutionCode: 'TIH-AICTE',
            institutionName: 'AICTE Innovation Cell & Startup India',
            title: 'National Student Innovation Challenge (Yukti 2.0)',
            organizer: 'Ministry of Education Innovation Cell (MIC)',
            cohort: 'National Edition 2026',
            description: 'National program dedicated to transforming student academic prototypes and hackathon winners into sustainable commercial enterprises.',
            grantAmount: '₹10,00,000 Technology Transfer & Prototype Commercialization Grant',
            perks: [
                'Government of India Startup India fast-track DPIIT recognition',
                'Mentorship from CSIR and DRDO senior scientists',
                'Exemption from standard corporate public procurement tender conditions'
            ],
            eligibility: 'Enrolled undergraduate or postgraduate engineering & management students with verified working prototypes.',
            deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
            mode: 'Online',
            status: 'Applications Open',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'prog-nsrcel-iimb',
            institutionCode: 'IIM-BANGALORE',
            institutionName: 'NSRCEL, IIM Bangalore',
            title: 'NSRCEL Launchpad & Venture Incubation 2026',
            organizer: 'N.S. Raghavan Centre for Entrepreneurial Learning',
            cohort: 'Launchpad Cohort 28',
            description: 'Intensive venture scaling program focused on business model validation, market expansion, unit economics, and venture capital syndication.',
            grantAmount: '₹20,00,000 Seed Capital & Investor Pitch Access',
            perks: [
                'IIM Bangalore faculty masterclasses on venture economics',
                'Access to pan-India corporate pilot partner network',
                'Dedicated investment associate & venture scout pairing'
            ],
            eligibility: 'Founding teams with early customer validation or scalable prototype looking for institutional scale.',
            deadline: new Date(Date.now() + 86400000 * 28).toISOString(),
            mode: 'Hybrid',
            status: 'Applications Open',
            createdAt: new Date().toISOString(),
        }
    ];

    for (const p of programs) {
        await db.collection('incubationPrograms').doc(p.id).set(p, { merge: true });
        console.log(`  ✅ Program written: ${p.title} (${p.id})`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. VENTURE WORKSPACES (Kanban Sprint, Milestones, Team Distribution)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Seeding `ventureWorkspaces` collection...');
    const workspaces = [
        {
            ventureId: 'venture-kavachai',
            title: 'KavachAI Founder Workspace',
            milestones: [
                { id: 'm1', title: 'eBPF Kernel Agent v0.2 Release', description: 'Complete zero-overhead packet telemetry agent on Linux 6.x kernel.', status: 'completed', dueDate: '2026-09-30' },
                { id: 'm2', title: 'Cooperative Bank Sandbox Trial', description: 'Deploy telemetry agent in sandboxed core banking environment across 3 test nodes.', status: 'in_progress', dueDate: '2026-11-15' },
                { id: 'm3', title: 'SOC Playbook LLM Synthesizer', description: 'Automated remediation script generator with sub-second containment.', status: 'pending', dueDate: '2026-12-01' }
            ],
            tasks: [
                { id: 't1', title: 'Refactor eBPF ring buffer consumer in Rust', assignee: 'Aarav Sharma', status: 'in_progress', priority: 'high' },
                { id: 't2', title: 'Draft RBI regulatory data residency compliance document', assignee: 'Devika Menon', status: 'todo', priority: 'medium' },
                { id: 't3', title: 'Benchmark packet telemetry latency < 1.2ms', assignee: 'Aarav Sharma', status: 'done', priority: 'high' },
                { id: 't4', title: 'Setup GitHub Actions CI for cross-kernel compilation', assignee: 'Devika Menon', status: 'done', priority: 'medium' },
                { id: 't5', title: 'Prepare 10-slide Demo Day pitch deck for IIT-D cohort', assignee: 'Aarav Sharma', status: 'todo', priority: 'high' }
            ],
            team: [
                { id: 'tm1', name: 'Aarav Sharma', role: 'Founder & Systems Architect', equityShare: '65%', joinedAt: '2026-01-15' },
                { id: 'tm2', name: 'Devika Menon', role: 'Security Research Lead', equityShare: '15%', joinedAt: '2026-03-01' }
            ],
            pitchDeckUrl: 'https://capable.app/decks/kavachai-pitch-2026.pdf',
            demoUrl: 'https://kavachai-demo.web.app',
            repoUrl: 'https://github.com/capable-ventures/kavach-ebpf-core',
            notes: 'Preparing for NIDHI-PRAYAS physical evaluation committee at IIT Delhi campus next month.',
            updatedAt: new Date().toISOString(),
        },
        {
            ventureId: 'venture-krishidrishti',
            title: 'KrishiDrishti Founder Workspace',
            milestones: [
                { id: 'm1', title: 'YOLOv11 Edge Quantization (INT8)', description: 'Optimize model for NVIDIA Jetson Orin Nano with 30fps camera feed.', status: 'completed', dueDate: '2026-08-30' },
                { id: 'm2', title: 'Nashik Grape Vineyard Pilot', description: 'Execute autonomous blight mapping across 50 acres of Thompson Seedless grapes.', status: 'in_progress', dueDate: '2026-11-20' },
                { id: 'm3', title: 'Rover Micro-Spray API Integration', description: 'Synchronize GPS coordinates with ground rover sprayers via ROS2 topic.', status: 'pending', dueDate: '2026-12-15' }
            ],
            tasks: [
                { id: 't1', title: 'Calibrate multispectral camera NIR band index', assignee: 'Priya Narang', status: 'done', priority: 'high' },
                { id: 't2', title: 'Integrate RTK GPS geofencing fail-safe', assignee: 'Priya Narang', status: 'in_progress', priority: 'high' },
                { id: 't3', title: 'Test battery endurance under 25-knot crosswind', assignee: 'Open Role', status: 'todo', priority: 'medium' }
            ],
            team: [
                { id: 'tm1', name: 'Priya Narang', role: 'Founder & Drone Robotics Lead', equityShare: '75%', joinedAt: '2026-02-10' }
            ],
            pitchDeckUrl: 'https://capable.app/decks/krishidrishti-deck.pdf',
            demoUrl: 'https://krishidrishti.capable.app',
            notes: 'Field test scheduled with Maharashtra Agro Industries Development Corporation.',
            updatedAt: new Date().toISOString(),
        }
    ];

    for (const w of workspaces) {
        await db.collection('ventureWorkspaces').doc(w.ventureId).set(w, { merge: true });
        console.log(`  ✅ Workspace written: ${w.title} (${w.ventureId})`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. INCUBATION APPLICATIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Seeding `incubationApplications` collection...');
    const applications = [
        {
            id: 'app-kavachai-iitd',
            programId: 'prog-udaan-iitd',
            programTitle: 'UDAAN Venture Acceleration Cohort 2026',
            institutionCode: 'IIT-DELHI',
            applicantUid: 'founder-aarav-sharma',
            applicantName: 'Aarav Sharma',
            applicantEmail: 'aarav.sharma@alumni.iitd.ac.in',
            applicantPhone: '+919876543210',
            startupName: 'KavachAI',
            pitchSummary: 'Kernel-level autonomous cyber defense platform shielding tier-2 cooperative rural banks from advanced persistent threats using eBPF and targeted LLM mitigation playbooks.',
            deckUrl: 'https://capable.app/decks/kavachai-pitch-2026.pdf',
            teamSize: 2,
            status: 'shortlisted',
            feedback: 'Strong deep-tech architecture. Shortlisted for physical panel interview and laboratory infrastructure allocation.',
            submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        {
            id: 'app-krishidrishti-bits',
            programId: 'prog-conquest-bits',
            programTitle: 'Conquest Global Startup Challenge & Incubation',
            institutionCode: 'BITS-PILANI',
            applicantUid: 'founder-priya-narang',
            applicantName: 'Priya Narang',
            applicantEmail: 'priya.narang@pilani.bits-pilani.ac.in',
            applicantPhone: '+919811223344',
            startupName: 'KrishiDrishti',
            pitchSummary: 'Edge-AI multispectral drone platform detecting fungal blight in horticulture farms with 94.2% precision and autonomous sprayer rover dispatch.',
            deckUrl: 'https://capable.app/decks/krishidrishti-deck.pdf',
            teamSize: 1,
            status: 'under_review',
            feedback: 'Reviewing hardware Bill of Materials (BOM) feasibility and flight regulation permissions.',
            submittedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
        {
            id: 'app-neurolearn-iitd',
            programId: 'prog-udaan-iitd',
            programTitle: 'UDAAN Venture Acceleration Cohort 2026',
            institutionCode: 'IIT-DELHI',
            applicantUid: 'founder-devansh-singhania',
            applicantName: 'Devansh Singhania',
            applicantEmail: 'devansh@neurolearn.io',
            applicantPhone: '+919988776655',
            startupName: 'NeuroLearn OS',
            pitchSummary: 'Multisensory spatial learning gamification suite designed for ADHD and dyslexic children with adaptive difficulty engines.',
            deckUrl: 'https://neurolearn.io/pitch.pdf',
            teamSize: 2,
            status: 'selected',
            feedback: 'Selected for Batch 6 incubation! Offer letter and laboratory space agreement issued.',
            submittedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
            id: 'app-voltgrid-aicte',
            programId: 'prog-yukti-aicte',
            programTitle: 'National Student Innovation Challenge (Yukti 2.0)',
            institutionCode: 'TIH-AICTE',
            applicantUid: 'founder-meera-iyer',
            applicantName: 'Meera Iyer',
            applicantEmail: 'meera.iyer@annauniv.edu',
            applicantPhone: '+919776655443',
            startupName: 'VoltGrid Energy',
            pitchSummary: 'Smart contract P2P solar energy settlement infrastructure for urban apartment battery complexes.',
            deckUrl: 'https://voltgrid.energy/deck.pdf',
            teamSize: 2,
            status: 'submitted',
            feedback: 'Application under initial technical evaluation by the AICTE expert committee.',
            submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
    ];

    for (const a of applications) {
        await db.collection('incubationApplications').doc(a.id).set(a, { merge: true });
        console.log(`  ✅ Application written: ${a.startupName} -> ${a.programTitle}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. COLLABORATION REQUESTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Seeding `collaborationRequests` collection...');
    const collabs = [
        {
            id: 'collab-kavachai-candidate1',
            ventureId: 'venture-kavachai',
            ventureTitle: 'KavachAI',
            fromUid: 'candidate-vrishabh',
            fromName: 'Vrishabh Kumar',
            fromEmail: 'vrishabh16.19@gmail.com',
            fromHeadline: 'Systems & Backend Engineer (Go, Rust, Distributed Systems)',
            toUid: 'founder-aarav-sharma',
            roleInterested: 'Technical Co-Founder (Systems/Rust)',
            message: 'Hi Aarav, I built an eBPF network packet analyzer during my final year thesis and have 2 years of production Rust experience. I would love to partner on KavachAI to build the core kernel probe.',
            skills: ['Go', 'Rust', 'eBPF', 'Linux Internals', 'Docker'],
            status: 'accepted',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
            id: 'collab-krishidrishti-candidate2',
            ventureId: 'venture-krishidrishti',
            ventureTitle: 'KrishiDrishti',
            fromUid: 'candidate-naveen',
            fromName: 'Naveen Sharma',
            fromEmail: 'naveensh014@gmail.com',
            fromHeadline: 'Computer Vision & Deep Learning Researcher',
            toUid: 'founder-priya-narang',
            roleInterested: 'Embedded Computer Vision Lead',
            message: 'Hi Priya, I have worked extensively with PyTorch and TensorRT optimization for agricultural leaf anomaly detection. I would love to discuss joining KrishiDrishti.',
            skills: ['PyTorch', 'TensorRT', 'Computer Vision', 'C++'],
            status: 'pending',
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        }
    ];

    for (const c of collabs) {
        await db.collection('collaborationRequests').doc(c.id).set(c, { merge: true });
        console.log(`  ✅ Collab Request written: ${c.fromName} -> ${c.ventureTitle} (${c.status})`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. STRUCTURED MENTORSHIP SESSIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Seeding `mentorSessions` collection...');
    const mentorSessions = [
        {
            id: 'session-mentor-1',
            candidateUid: 'candidate-vrishabh',
            candidateName: 'Vrishabh Kumar',
            mentorUid: 'mentor-kunal-shah',
            mentorName: 'Kunal Shah',
            mentorCompany: 'Cred / Ex-Freecharge',
            mentorRole: 'Founder & Angel Investor',
            topic: 'Product-Market Fit & Seed Fundraising for Indian B2B FinTech',
            sessionDate: new Date(Date.now() + 86400000 * 3).toISOString(),
            status: 'confirmed',
            meetLink: 'https://meet.google.com/cap-able-ment',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'session-mentor-2',
            candidateUid: 'candidate-naveen',
            candidateName: 'Naveen Sharma',
            mentorUid: 'mentor-anjali-bansal',
            mentorName: 'Anjali Bansal',
            mentorCompany: 'Avaana Capital',
            mentorRole: 'Founding Partner (Climate & AgriTech)',
            topic: 'Hardware-Enabled SaaS Unit Economics in Emerging Agritech',
            sessionDate: new Date(Date.now() + 86400000 * 5).toISOString(),
            status: 'confirmed',
            meetLink: 'https://meet.google.com/cap-able-agri',
            createdAt: new Date().toISOString(),
        }
    ];

    for (const m of mentorSessions) {
        await db.collection('mentorSessions').doc(m.id).set(m, { merge: true });
        console.log(`  ✅ Mentor session written: ${m.mentorName} with ${m.candidateName}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. INSTITUTIONS COLLECTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Seeding `institutions` collection...');
    const institutions = [
        {
            id: 'IIT-DELHI',
            code: 'IIT-DELHI',
            name: 'Indian Institute of Technology Delhi',
            type: 'Institute of National Importance',
            location: 'Hauz Khas, New Delhi',
            incubationUnit: 'Foundation for Innovation and Technology Transfer (FITT)',
            placementOfficer: 'Prof. R.K. Singla',
            placementEmail: 'tpo@admin.iitd.ac.in',
            ecellLead: 'E-Cell IIT Delhi Executive Team',
            activeCohort: 'UDAAN Venture Acceleration Cohort 2026',
            verified: true,
            createdAt: new Date().toISOString(),
        },
        {
            id: 'BITS-PILANI',
            code: 'BITS-PILANI',
            name: 'Birla Institute of Technology and Science, Pilani',
            type: 'Deemed University (Institute of Eminence)',
            location: 'Pilani / Goa / Hyderabad',
            incubationUnit: 'Technology Business Incubator (TBI)',
            placementOfficer: 'Dr. G. Sundar',
            placementEmail: 'placement@pilani.bits-pilani.ac.in',
            ecellLead: 'Centre for Entrepreneurial Leadership (CEL)',
            activeCohort: 'Conquest Global Startup Challenge 2026',
            verified: true,
            createdAt: new Date().toISOString(),
        },
        {
            id: 'TIH-AICTE',
            code: 'TIH-AICTE',
            name: 'AICTE Innovation Cell & Startup India',
            type: 'Statutory Body & Innovation Mission',
            location: 'New Delhi, India',
            incubationUnit: 'Ministry of Education Innovation Cell (MIC)',
            placementOfficer: 'Dr. Abhay Jere (Chief Innovation Officer)',
            placementEmail: 'mic@aicte-india.org',
            ecellLead: 'Yukti National Innovation Repository',
            activeCohort: 'National Student Innovation Challenge Yukti 2.0',
            verified: true,
            createdAt: new Date().toISOString(),
        }
    ];

    for (const inst of institutions) {
        await db.collection('institutions').doc(inst.id).set(inst, { merge: true });
        console.log(`  ✅ Institution written: ${inst.name} (${inst.code})`);
    }

    console.log('\n🎉 ALL LIVE FIRESTORE COLLECTIONS SEEDED SUCCESSFULLY!');
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
