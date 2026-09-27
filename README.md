<div align="center">
  <img src="public/hero-glass-art.jpg" alt="CapAble Hero/Banner" width="100%" />

  # 🎓 CapAble — Campus Placement Intelligence

  **Next-Generation AI-Powered Career Readiness & Recruitment Ecosystem**

  [![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth/Firestore-F6820D.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-43853D.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)

  <p align="center">
    <a href="#-about-the-project">About</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

---

## 🚀 About the Project

**CapAble** is a state-of-the-art talent platform designed to bridge the gap between candidates' raw capabilities and employers' exact hiring needs. Built natively for the **Smart India Hackathon (SIH)**, CapAble drops outdated static recruitment flows and introduces a deeply immersive, AI-augmented, and 3D-visualized ecosystem.

Through data-driven profiles, an interactive onboarding wizard, and a dynamic AI matching engine, CapAble empowers institutions, engages candidates, and seamlessly connects top talent with visionary companies.

---

## ✨ Key Features

### 👨‍🎓 For Candidates (The Talent)
- 🌌 **Dynamic Dashboards**: A time-sensitive, fully immersive glassmorphism dashboard that reacts to the user.
- 🪪 **Capability Twin (3D)**: Interactive 3D identity cards built with Framer Motion—tilts and reflects dynamically as your mouse moves.
- 📊 **Codolio-Inspired Metrics**: Visualize your coding journey automatically. Generate rating trajectory charts, difficulty distributions, and capability bars linked directly to LeetCode and HackerRank.
- 💻 **Integrated AI Coding IDE**: Practice, assess, and debug skills in a native, in-browser compiler environment.
- ⚡ **Device-Native Onboarding**: A frictionless, multi-step interactive setup wizard built for speed and premium UX.

### 🏢 For Employers (The Recruiters)
- 🎯 **Opportunity Radar**: An AI-powered matchmaking engine that structurally maps the exact gap between job requirements and verified candidate capabilities.
- 📈 **Automated Sync**: Watch candidates' metrics evolve over time via live APIs instead of static resume updates.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: React 18 (TypeScript) + Vite
- **Styling**: Tailwind CSS + Custom CSS Tokens (Glassmorphism design system)
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React / Inline optimized SVGs

### Backend (Server/APIs)
- **Runtime**: Node.js & Express
- **Database & Auth**: Firebase (Firestore DB, Authentication)
- **AI Pipelines**: Google Gemini API & Groq

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/rishabhv16/CapAble.git
cd CapAble
```

### 2. Install Dependencies
```bash
# We recommend using npm to match the lockfiles
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory. You can use the provided `.env.example` as a template.
```bash
cp .env.example .env
```
> **Critical:** Ensure `VITE_SERVER_URL` is pointing to your locally running backend server (e.g., `http://localhost:5000`) or your live Railway URL.

### 4. Fire It Up 🔥
Start the Vite development server:
```bash
npm run dev
```
The application will spin up at `http://localhost:5173`. 

---

## ☁️ Deployment

CapAble is production-ready and optimized for deployment on **Vercel** (Frontend) and **Railway/Render** (Backend).

### Deploying the Frontend to Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect this GitHub repository.
3. The framework will auto-detect as **Vite**.
4. Navigate to the **Environment Variables** tab in Vercel before deploying.
5. Add your `.env` variables. **Crucially, set `VITE_SERVER_URL` to your production backend URL (e.g., your live Railway domain).**
6. Hit **Deploy**. 

*Your backend remains untouched and secure on Railway, while Vercel serves the hyper-fast React frontend!*

---

## 📂 Project Structure

```text
CapAble/
├── public/                 # Static assets (images, manifest, favicon)
├── src/
│   ├── components/         # Reusable UI components (3D, Navigation, Buttons)
│   ├── lib/                # Config files (Firebase, Gemini init)
│   ├── pages/              # App Pages (Dashboard, IDE, Landing, Auth)
│   ├── styles/             # Global CSS, Design Tokens, Utilities
│   └── main.tsx            # React Mount Point
├── server/                 # Node.js Express Backend
├── firestore.rules         # Firebase Security Rules
└── vite.config.ts          # Vite Bundler Config
```

---

<div align="center">
  <b>Built with ❤️ for the Smart India Hackathon</b><br>
  <i>Empowering the next generation of technical talent.</i>
</div>
