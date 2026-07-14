# RepoIQ 🧠

> **An interactive codebase visualization engine and AI-powered repository intelligence dashboard.**

RepoIQ transforms complex software repositories into interactive dependency graphs, actionable code quality metrics, and structured AI-driven documentation. Built with a clean, minimalist interface, RepoIQ bridges the gap between raw source code and architectural clarity for developers, tech leads, and onboarding engineers.

---

## 🌟 Key Features

### 🔍 Interactive Codebase Visualization
* **Dependency Graph**: Explore file-to-file relationships, imports, and module interdependencies through an interactive node-and-edge graph.
* **Architecture / Folder View**: Zoom out from individual files to inspect high-level architectural relationships grouped by directory structure.
* **Path Explorer & Cycle Detection**: Trace the exact dependency path between any two modules and automatically detect problematic circular import loops (`A → B → C → A`).
* **Critical Connectors**: Identify central hub modules and architectural bottlenecks that tie large portions of your codebase together.

### 📊 Deep Code Quality & Metrics
* **Hotspot Analysis**: Multi-factor scoring combining code complexity, coupling density, and structural metrics to pinpoint areas of high technical debt.
* **Maintainability Index & Halstead Metrics**: Quantitative evaluations of file readability, vocabulary size, and maintenance effort across modules.
* **Coupling Density & Cyclomatic Complexity**: Measure the degree of module interdependence and control flow complexity to guide refactoring priorities.
* **Customizable Hotspot Settings**: Adjust thresholds (`hotspotConfig`) directly from the UI to tailor risk detection to your team's engineering standards.

### 🤖 AI-Powered Intelligence Suite
Integrated with frontier LLMs, RepoIQ turns structural AST data into human-readable insights:
* **Repository Summary**: Executive-level overview of the repository's purpose, key packages, and core responsibilities.
* **Intelligent Onboarding Assistant**: Generate personalized, step-by-step onboarding walkthroughs customized by **Experience Level** (`Junior`, `Mid`, `Senior`), **Onboarding Goal**, and **Primary Tech Focus**.
* **Codebase Q&A Chat**: A natural language chat assistant equipped with contextual graph data, metrics, and preset suggestion chips to answer structural questions instantly.
* **Documentation Generator**: Automatically draft and export production-ready `.md` documentation across 5 core sections:
  1. *Architecture & Modules*
  2. *Dependency & Flow Analysis*
  3. *Quick-Start & Setup Guide*
  4. *API & Integration Map*
  5. *Project Brief & README*
* **Architecture Insights**: Automated layer classification (`UI/Presentation`, `Business Logic/Services`, `Data Access/Models`, etc.) and dominant design pattern recognition (`MVC`, `Layered Architecture`, `Clean Architecture`) complete with confidence badges (`High`, `Medium`, `Low`).

### ⚡ Performance & UX
* **Local File-Based Caching**: AI responses are persisted automatically, ensuring identical queries load instantly without re-invoking the API.
* **Previous Scans History**: Browser storage automatically records your **3 most recent analyzed repositories** right in the top hamburger menu (`☰`), allowing instant switching across projects without re-running AST analysis.
* **One-Click JSON Export**: Download the complete raw dependency graph directly from the hamburger dropdown.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), Vanilla CSS, custom SVG & graph rendering engines.
* **Backend**: Node.js, Express, AST analysis pipelines (`routes.js`), file-system caching utilities (`cacheService.js`).
* **AI Engine**: Google Gemini API with structured JSON schemas for predictable, highly accurate analysis outputs.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.x or higher
* **npm**: v9.x or higher
* **Google Gemini API Key**: Required for the AI Intelligence Suite features.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/RepoIQ.git
cd RepoIQ
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```bash
cd backend
touch .env
```
Add the following lines to `backend/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=your_preferred_model
```

### 3. Install Dependencies
Install dependencies for both the backend server and the React frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 💻 Running the Application

Start the backend analysis API and the frontend development server:

### Start Backend API Server (Port 5000)
```bash
cd backend
npm start
# Server listening on http://localhost:5000
```

### Start Frontend Dev Server (Port 5173)
In a new terminal window:
```bash
cd frontend
npm run dev
# Vite dev server running on http://localhost:5173
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 📖 Usage Guide

1. **Analyze a Repository**: On the landing page, choose between **Local Path** or **Git URL**, then enter the path and click **Analyze Codebase**.
2. **Navigate Visualizations**: Use the left sidebar to toggle between **Dependency Graph** and **Architecture (Folders)** views. Click on any node to view detailed file-level metrics and dependencies.
3. **Inspect Quality & Hotspots**: Switch to the **Repository Overview** tab to view quantitative metrics (**Maintainability**, **Code Quality**, **Technical Debt**, **Benchmarking**).
4. **Leverage AI Tools**: Click into any AI tab (**AI Summary**, **AI Onboarding**, **AI Codebase Q&A**, **AI Docs**, **AI Architecture**) to generate structured, contextual insights powered by Google Gemini.
5. **Switch Scans / Export**: Click the hamburger menu icon (`☰`) in the top right ribbon to load any of your **Previous Scans** instantly or click **Export Graph JSON** to download the graph structure.

