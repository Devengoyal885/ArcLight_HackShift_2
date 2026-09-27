<div align="center">
  <img src="public/capable-hero.jpg" alt="CapAble Hero/Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

  # 🎓 CapAble — Campus Placement Intelligence

  **The Next-Generation AI-Powered Career Readiness & Recruitment Ecosystem**

  [![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth/Firestore-F6820D.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![Gemini AI](https://img.shields.io/badge/Gemini_AI-Enabled-4285F4.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)

  <p align="center">
    <a href="#-about-the-project">About</a> •
    <a href="#-platform-preview">Preview</a> •
    <a href="#-key-features">Features</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-getting-started">Deployment</a>
  </p>
</div>

---

## 🚀 About the Project

**CapAble** is a state-of-the-art talent platform designed to bridge the gap between candidates' raw capabilities and employers' exact hiring needs. Built natively for the **Smart India Hackathon (SIH)**, CapAble drops outdated static recruitment flows and introduces a deeply immersive, AI-augmented, and 3D-visualized ecosystem.

Through data-driven profiles, an interactive onboarding wizard, and a dynamic AI matching engine, CapAble empowers institutions, engages candidates, and seamlessly connects top talent with visionary companies.

---

## 🎨 Platform Preview

<div align="center">
  <img src="public/capable-dashboard.jpg" alt="CapAble Dashboard Mockup" width="100%" style="border-radius: 12px; box-shadow: 0px 10px 30px rgba(0,0,0,0.5);" />
  <p><i>Our premium, glassmorphism-inspired dark mode dashboard.</i></p>
</div>

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h3>👨‍🎓 For Candidates (The Talent)</h3>
      <ul>
        <li>🌌 <b>Dynamic Dashboards:</b> Time-sensitive, fully immersive glassmorphism dashboard that reacts to you.</li>
        <li>🪪 <b>Capability Twin (3D):</b> Interactive 3D identity cards built with Framer Motion that tilt and reflect dynamically as your mouse moves.</li>
        <li>📊 <b>Codolio-Inspired Metrics:</b> Visualize your coding journey with automatically generated rating trajectory charts and difficulty distributions.</li>
        <li>💻 <b>Integrated AI Coding IDE:</b> Practice, assess, and debug skills in a native, in-browser compiler environment.</li>
        <li>⚡ <b>Device-Native Onboarding:</b> A frictionless, multi-step interactive setup wizard built for speed and premium UX.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🏢 For Employers (The Recruiters)</h3>
      <ul>
        <li>🎯 <b>Opportunity Radar:</b> AI-powered matchmaking engine that structurally maps the exact gap between job requirements and verified candidate capabilities.</li>
        <li>📈 <b>Automated Sync:</b> Watch candidates' metrics evolve over time via live APIs instead of static resume updates.</li>
        <li>🤖 <b>Smart Shortlisting:</b> Let Gemini AI parse unstructured data to find the hidden gems in the talent pool.</li>
        <li>🎨 <b>Premium Brand Experience:</b> Engage with talent on a platform that feels like a high-end tech product, not a dusty portal.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ Tech Stack

We utilize a modern, scalable, and highly optimized tech stack to deliver a seamless 60fps experience.

| Domain | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & UI** | Tailwind CSS, CSS Modules (Glassmorphism), Radix UI |
| **Animations** | Framer Motion (3D Tilting, Layout Transitions) |
| **Data Visualization**| Recharts (Dynamic capability graphs) |
| **Backend API** | Node.js, Express.js |
| **Database & Auth** | Firebase Authentication, Cloud Firestore |
| **AI Integration** | Google Gemini API, Groq |

---

## 📐 Architecture Diagram

```mermaid
graph TD
    Client[Client Browser (Vite/React)] -->|Auth & DB Read/Write| Firebase[(Firebase Firestore / Auth)]
    Client -->|API Requests| Backend[Node.js / Express Backend]
    
    Backend -->|LLM Queries| Gemini[Google Gemini AI]
    Backend -->|Code Execution| Judge0[Judge0 API (IDE)]
    Backend -->|Web Scrape| Codolio[LeetCode/HackerRank APIs]

    subgraph Frontend Features
    UI[Glassmorphism UI]
    Charts[Recharts Visualization]
    3D[Framer Motion 3D Cards]
    end

    Client --- UI
    Client --- Charts
    Client --- 3D
```

---

## 🚀 Getting Started & Local Development

Follow these instructions to set up the project locally on your machine.

```bash
# 1. Clone the Repository
git clone https://github.com/rishabhv16/CapAble.git
cd CapAble

# 2. Install Dependencies
npm install

# 3. Setup Environment Variables
cp .env.example .env
# Important: Set VITE_SERVER_URL to your local backend (http://localhost:5000) or Railway URL.

# 4. Start the Development Server
npm run dev
```

---

## ☁️ Vercel Deployment Guide

CapAble is highly optimized for deployment on **Vercel** (Frontend) and **Railway/Render** (Backend).

1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect your GitHub repository. Vercel will auto-detect the framework as **Vite**.
3. Go to the **Environment Variables** tab.
4. Add all required variables from your `.env` file. 
5. **CRITICAL:** Set `VITE_SERVER_URL` to your production backend URL (e.g., your live Railway domain) so the frontend can securely communicate with the backend without disturbing it.
6. Hit **Deploy**.

*Your backend remains untouched and secure on Railway, while Vercel serves the hyper-fast React frontend!*

---

<div align="center">
  <b>Built with ❤️ for the Smart India Hackathon</b><br>
  <i>Empowering the next generation of technical talent.</i>
</div>
