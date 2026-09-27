# CapAble — Campus Placement Intelligence 🚀

![CapAble Hero/Banner](public/hero-glass-art.jpg)

**CapAble** is a next-generation AI-powered campus placement and career readiness platform designed to bridge the gap between candidates' raw capabilities and employers' hiring needs. Built with a modern tech stack and focusing on premium UI/UX, 3D visualizations, and robust analytics.

## 🌟 Key Features

### 👨‍🎓 For Candidates
- **Dynamic Dashboards**: Personalized and time-sensitive dashboard greeting users dynamically.
- **Capability Twin (3D)**: Interactive 3D identity cards utilizing Framer Motion.
- **Codolio-Inspired Profile**: Visualize your coding journey with data-driven charts (Recharts) aggregating stats from LeetCode, HackerRank, etc.
- **AI-Powered IDE**: Built-in coding environment to practice and assess skills.

### 🏢 For Employers
- **Opportunity Radar**: AI matchmaking engine structurally mapping the gap between employer requirements and verified candidate capabilities.
- **Automated Capability Sync**: Track candidate metrics efficiently.

### 🎨 Premium UI/UX
- **Glassmorphism Aesthetic**: Deeply customized graphical brand assets seamlessly integrated across the ecosystem.
- **Device-Native Onboarding**: Multi-step, interactive onboarding wizard for a frictionless experience.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS / Vanilla CSS with Custom Tokens, Framer Motion (Animations)
- **Backend/API**: Node.js, Express (Deployed separately)
- **Database/Auth**: Firebase Auth, Firestore
- **AI Integrations**: Google Gemini, Groq

---

## 🚀 Getting Started (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/rishabhv16/CapAble.git
cd CapAble
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the necessary environment variables. 
> You can refer to `.env.example` for the required keys. Make sure to set `VITE_SERVER_URL` to your local or hosted backend (e.g., Railway).

### 4. Run the Development Server
```bash
npm run dev
```

The app will start at `http://localhost:5173`.

---

## ☁️ Deployment (Vercel)

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Connect your GitHub repository to Vercel.
2. Ensure the Framework Preset is set to **Vite**.
3. In the Vercel **Environment Variables** settings, add all the variables from your `.env` file.
   > **Important**: Set `VITE_SERVER_URL` to your live backend URL (e.g., your Railway deployment URL) so the frontend can securely communicate with your existing backend without disturbing it.
4. Click **Deploy**.

---

## ✏️ Customization

### Changing the Website Name
To change the display name of the website on browser tabs and search engines:
1. Open `index.html` in the root folder.
2. Edit the text inside the `<title>` tag:
   ```html
   <title>Your New Name</title>
   ```
3. Open `package.json` and change the `"name"` property at the top.

---

> Built for Smart India Hackathon (SIH).
