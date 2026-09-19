# CapAble - Next-Generation Talent Platform (SIH 2026)

Welcome to the **CapAble** repository! This project represents a modern, AI-augmented assessment and recruitment platform designed for the Smart India Hackathon (SIH) 2026. The platform seamlessly bridges the gap between candidates' raw capabilities and employers' hiring needs using 3D visualization, immersive UI/UX, and robust analytics.

## 🚀 What We've Built So Far

Over the course of development, we have completely overhauled the platform to achieve a premium, glassmorphism-inspired aesthetic and highly interactive frontend flow. 

### 1. Landing & Marketing Pages
- Designed a professional, cohesive **Landing Page** utilizing clean navigation and a white-and-blue color palette.
- Replaced text-based logos with customized graphical brand assets (`sihlogo.png`) seamlessly integrated across the entire application ecosystem.

### 2. Authentication & Multi-Step Onboarding
- **Firebase Auth Integration**: Successfully wired Firebase for authentication streams (e.g., Google Sign-in).
- **Dynamic Onboarding Wizards**: Built a highly interactive, 2-step onboarding wizard for both candidates and employers.
- Removed basic static photo inputs and replaced them with **device-native file uploads** for a premium avatar selection experience.
- Automated data fetching from Google to proactively pre-fill names and metadata on dashboard login.

### 3. Dynamic Dashboards (Candidate & Employer)
- Transitioned static hardcoded HTML over to fully **dynamic dashboards**. The system now greets users by their authenticated `displayName` and provides time-sensitive smart greetings ("Good Morning", "Good Evening").
- **3D Interactive Features**: Developed the **Capability Twin**, an interactive `IdentityCard3D` component that utilizes Framer Motion to tilt and reflect glare dynamically based on cursor movement.

### 4. Codolio-Inspired Candidate Coding Profile 
- Implemented a complete, data-driven **Coding Profile Page** inspired by Codolio.
- **4-Step Setup Flow**: Allows users to seamlessly input platform links (LeetCode, HackerRank, GeeksForGeeks) and self-report Data Structures & Algorithm metrics.
- **Data Visualization**: Integrated **Recharts** to automatically generate Rating Trajectory area charts, difficulty distribution donut charts, and horizontally animated capability bars. 

### 5. Architectural Bug Fixes & Optimization
- **Vite/React Crash Resolutions**: Successfully scrubbed silent rendering crashes caused by deprecated packages (such as legacy `lucide-react` brand exports), substituting them with natively optimized, highly scalable inline SVG components.
- **Global CSS Layout Hardening**: Diagnosed and neutralized massive bleeding layout glitches caused by inherently unconstrained generated assets rendering out-of-bounds in Flexbox layouts.

---

## 🎯 Future Goals & Architecture Roadmap

While the frontend is remarkably resilient and visually stunning, the next phases will heavily focus on backend connectivity, AI pipelines, and platform automation.

### 1. Persistent Backend Infrastructure
- **Firestore/Supabase Migration**: Transition application states currently persisted in `localStorage` into a secure, robust cloud database (Firebase Firestore or Supabase PostgreSQL), allowing profile data to survive across sessions and devices.

### 2. Automated Capability Syncing
- **Platform Scraping / APIs**: Evolve the Codolio-Inspired capability tracker from manual data-entry wizards to **automated API integrations**. The system should eventually fetch live LeetCode contest rankings and CodeChef stars dynamically using just a candidate's username.

### 3. Generative AI Implementations
- **AI Resume Builder**: Plug Gemini or Groq into the candidate pipelines to dynamically compile professional capability statements, bullet points, or cover letters based on the user's recorded scores and projects.
- **AI Matchmaking Engine**: Fully implement the **Opportunity Radar** logic to structurally map the gap between Employer requirement criteria and verified Candidate Capabilities. 

### 4. Advanced Testing & Responsiveness
- Ensure absolute mobile responsiveness across complex flex-grid dashboards.
- Finalize Playwright scripts to guarantee end-to-end functionality for the onboarding pipeline before production deployment.
