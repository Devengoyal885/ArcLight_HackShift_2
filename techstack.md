# CapAble - Technology Stack

This document details the core technologies, libraries, and frameworks used to build the CapAble platform, along with the rationale for their selection and their specific use cases within the project.

---

## 1. Core Frontend Framework

### **React (v19) + TypeScript (v6)**
* **Where it's used:** The entire frontend architecture.
* **Why this:** React provides a robust, component-based architecture necessary for a complex, state-heavy application like CapAble (which includes multiple dashboards, IDEs, and dynamic forms). TypeScript is used to enforce strict typing across the application, significantly reducing runtime errors and improving developer experience, especially when dealing with complex AI responses and Firebase data models.

### **Vite (v8)**
* **Where it's used:** Build tool and development server.
* **Why this:** Replaces older bundlers like Webpack (CRA). Vite offers lightning-fast Hot Module Replacement (HMR) and optimized build times, crucial for rapid UI development and iteration.

### **React Router DOM (v7)**
* **Where it's used:** Application routing and navigation.
* **Why this:** Manages the complex routing requirements of the app, including protected routes, role-based dashboards (Candidate vs. Employer vs. Institution), and seamless client-side transitions.

---

## 2. Artificial Intelligence Engine

### **Google Gemini API (Gemini 2.5/3.6 Flash)**
* **Where it's used:** Throughout the core services:
  * `resumeParserService.ts`: Parses raw resume text/PDFs into structured data and verifies capabilities.
  * `careerService.ts`: Generates personalized career trajectories based on user skill gaps.
  * `learningService.ts`: Recommends highly tailored learning resources.
  * `CodingIDE.tsx`: Acts as a real-time AI debug mentor during coding assessments.
* **Why this:** Gemini provides fast, high-quality, multimodal LLM capabilities. We use it to parse unstructured data (resumes) into JSON and provide personalized, context-aware feedback. We built a robust fallback and retry mechanism to ensure high availability.

---

## 3. Backend & Infrastructure

### **Firebase (v12)**
* **Where it's used:** `AuthContext.tsx`, `profileService.ts`, etc.
* **How it's used:** 
  * **Firebase Auth:** Handles user authentication and onboarding.
  * **Cloud Firestore:** NoSQL database storing user profiles, verified capabilities, employer active roles, and job application states.
* **Why this:** Firebase provides a serverless architecture that scales automatically. Real-time sync capabilities make it ideal for updating UI instantly when a candidate's capability score changes or a new application is submitted.

### **Node.js (tsx) + CRON Jobs**
* **Where it's used:** `scripts/fetchJobsCron.ts`
* **Why this:** Used to run background scripts (like fetching real jobs from external APIs such as Remotive). `tsx` allows us to execute TypeScript files directly in Node without pre-compilation.

---

## 4. UI/UX & Styling

### **Vanilla CSS + Inline Styles**
* **Where it's used:** Component-specific `.css` files and dynamic inline styles.
* **Why this:** While utility classes (like Tailwind) are popular, CapAble relies on highly customized, premium UI components (glassmorphism, advanced gradients, complex layouts). Vanilla CSS and dynamic inline styles allow for precise control over these rich aesthetic details.

### **Framer Motion**
* **Where it's used:** Page transitions, role-card carousels, timeline animations, and dynamic modal popups.
* **Why this:** Essential for creating a "premium" feel. Framer Motion handles complex orchestration (like the staggered loading of the Capability Assessment timeline) with a simple declarative API.

### **Lucide React**
* **Where it's used:** Everywhere an icon is needed (navigation, status indicators, buttons).
* **Why this:** A clean, modern, and highly customizable SVG icon library that fits the professional aesthetic of the platform.

### **@paper-design/shaders-react**
* **Where it's used:** Background effects and 3D visual elements (e.g., Identity Card).
* **Why this:** Adds high-fidelity WebGL shader effects to give the platform a futuristic, AI-driven aesthetic that stands out from standard dashboards.

---

## 5. Specialized Features

### **@monaco-editor/react**
* **Where it's used:** `CodingIDE.tsx`
* **Why this:** This is the same editor that powers VS Code. It provides candidates with a professional-grade coding environment (syntax highlighting, autocomplete, formatting) right in the browser for their technical assessments.

### **Recharts**
* **Where it's used:** `CapabilityFingerprint.tsx`
* **Why this:** A composable charting library built on React components. Used to render the complex Radar Chart (Capability Fingerprint), allowing candidates to visualize their skill strengths and gaps intuitively.

### **pdfjs-dist & html2pdf.js**
* **Where it's used:** `ResumeAIPage.tsx`, `OnboardingPage.tsx`
* **Why this:** 
  * `pdfjs-dist` is used to extract text locally from uploaded candidate PDFs before sending it to Gemini, ensuring we don't need a heavy backend parser.
  * `html2pdf.js` allows candidates to export their newly AI-tailored resumes directly from the browser DOM into a clean, formatted PDF.
