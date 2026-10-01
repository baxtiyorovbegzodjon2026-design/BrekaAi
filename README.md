# 🧬 Reka AI — Autonomous Scientific Discovery Engine

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-green?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-purple?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/RDKit-Chemistry-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

**Reka AI** is an autonomous scientific discovery platform that uses AI to design novel drug molecules and materials. It combines generative AI (Google Gemini), computational chemistry (RDKit), and real-time scientific databases (PubChem, ChEMBL) to accelerate drug discovery from years to minutes.

## ✨ Features

- 🔬 **Autonomous Research Agent** — Analyzes your query, searches scientific literature, and forms hypotheses
- 🧪 **Generative Molecular Design** — Creates novel candidate molecules using AI
- ⚗️ **In-Silico Verification** — Calculates drug-likeness (QED), Lipinski Rules, LogP, TPSA, and more via RDKit
- 🧬 **3D Molecular Visualization** — Interactive 3D viewer powered by 3Dmol.js
- 📄 **Automated Patent Drafting** — Generates patent-style reports for discovered compounds
- 🌐 **Beautiful Web Interface** — Dark-themed, glass-morphism UI with animations

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/reka-ai.git
cd reka-ai
```

### 2. Set Up Python Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r backend/requirements.txt
```

### 3. Configure API Key
```bash
cp .env.example .env
# Edit .env and add your Google AI Studio API key:
# GEMINI_API_KEY=your_api_key_here
```

Get your free API key at: https://aistudio.google.com/apikey

### 4. Run the Server
```bash
python -m backend.main
```

Open your browser at **http://localhost:8000** 🎉

## 📁 Project Structure

```
reka-ai/
├── backend/
│   ├── main.py                # FastAPI application & routes
│   ├── config.py              # Environment configuration
│   ├── agents/
│   │   ├── research_agent.py  # Literature search & hypothesis
│   │   └── discovery_agent.py # Main orchestrator agent
│   ├── services/
│   │   ├── gemini_service.py  # Google Gemini AI integration
│   │   ├── pubchem_service.py # PubChem database API
│   │   ├── chembl_service.py  # ChEMBL database API
│   │   └── molecule_service.py# RDKit molecular computations
│   └── requirements.txt
├── frontend/
│   ├── index.html             # Main web interface
│   ├── css/style.css          # Stunning dark theme styles
│   └── js/
│       ├── api.js             # API client with demo fallback
│       ├── app.js             # Main app controller
│       └── molecule3d.js      # 3D molecular viewer
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/discover` | Main discovery — accepts `{ "query": "..." }` |
| `GET` | `/api/molecule/{smiles}` | Get 3D structure & properties for a SMILES |
| `POST` | `/api/report` | Generate patent-style report |
| `GET` | `/api/health` | Health check |

## 🧠 How It Works

```
User Query → Research Agent → Gemini AI Analysis
                                    ↓
                           Molecule Generator
                                    ↓
                        RDKit In-Silico Verifier
                           (QED, LogP, Lipinski)
                                    ↓
                         Top 3 Candidates + 3D View
                                    ↓
                          Patent Draft Generator
```

## 🌐 Deploy to Production

### Render (Free)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Build command: `pip install -r backend/requirements.txt`
5. Start command: `python -m backend.main`
6. Add environment variable: `GEMINI_API_KEY`

## 📄 License

MIT License — free for personal and commercial use.

---

<p align="center">
  <strong>Built with 🧬 by Reka AI Team</strong><br>
  <em>Autonomous Scientific Discovery for a Better World</em>
</p>
