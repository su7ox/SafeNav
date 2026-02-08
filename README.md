# SafeNav – Web & Link Safety Analysis Platform

SafeNav is an AI-assisted web and link analysis platform designed to evaluate the safety of URLs, websites, and application links.  
It performs multi-layer analysis using static inspection, reputation checks, and machine-learning–based scoring to identify potentially malicious or unsafe links.

The project is structured as a full-stack system with a React frontend and a Python-based backend, focusing on real-world web security use cases such as phishing detection, suspicious domain analysis, and unsafe content identification.

---

## 🚀 Key Features

### URL Normalization & Parsing
Handles different types of links including shortened URLs, redirects, and malformed URLs.

### Static & Lexical Analysis
Detects suspicious patterns such as abnormal URL length, special characters, and domain structure anomalies.

### Reputation & Domain Intelligence
Evaluates domain age, SSL certificate validity, and known reputation signals.

### Machine Learning–Based Risk Scoring
Uses engineered features and machine learning models to compute a final safety score for each URL.

### Modular Detection Pipeline
Designed with separable components for easy extension, testing, and experimentation.

---

## 🧱 Project Architecture

SafeNav is organized as a full-stack application:

- **frontend/** – React-based user interface  
- **backend/** – Python backend responsible for API handling and link analysis  

---

## 🎨 Frontend

- Built with **React (Vite)**
- Responsible for user interaction and result visualization
- Communicates with backend APIs to request URL analysis and display safety reports

---

## ⚙️ Backend

- Built using **Python**
- Implements the core security analysis pipeline:
  - URL normalization
  - Lexical and structural checks
  - SSL and domain inspection
  - Machine learning–based scoring engine

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- JavaScript
- HTML / CSS

### Backend
- Python
- FastAPI (API layer)
- Scikit-learn (machine learning experimentation)
- Custom feature engineering modules

### Tooling
- Git & GitHub
- Visual Studio Code

---

## 📌 Use Cases

- Phishing link detection  
- Unsafe website analysis  
- Educational research on web security and threat detection  
- Full-stack development practice with a security focus  

---

## 📈 Project Status

This project is actively under development.  
Planned enhancements include:
- Advanced machine learning models
- Dynamic behavior analysis
- Containerized deployment (Docker)
- Extended reporting and visualization features

---

## ▶️ How to Run SafeNav

SafeNav can be executed in **two different modes** depending on the use case:

- **Docker Mode** – Recommended for demo, evaluation, and deployment  
- **Development Mode** – Recommended while coding and debugging  

---

## 🐳 Running with Docker (Recommended)

This mode runs the **frontend, backend, and database together** using Docker Compose.

### Prerequisites
- Docker Desktop installed  
- Docker Compose enabled  

### Steps

1. Clone the repository:
```bash
git clone https://github.com/su7ox/SafeNav.git
cd SafeNav
```

2. Build and start all services:
```bash
docker-compose up -d
```

3. Verify running containers:
```bash
docker ps
```

### Access the Application

* **Frontend UI:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:8000](http://localhost:8000)
* **API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Stop the Application

```bash
docker-compose down
```

### Apply Code Changes

Docker does not automatically reflect code changes.

```bash
docker-compose build
docker-compose up -d
```

---

## 🧑‍💻 Running in Development Mode (Without Docker)

This mode supports **hot reload** and is recommended during development.

---

### 🔹 Backend (FastAPI)

#### Prerequisites

* Python 3.10 or higher

#### Steps

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (one-time):
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run backend server:
```bash
uvicorn app.main:app --reload
```

Backend will be available at:

* [http://localhost:8000](http://localhost:8000)
* [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🔹 Frontend (React + Vite)

#### Prerequisites

* Node.js (LTS version recommended)

#### Steps

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend development server:
```bash
npm run dev
```

Frontend will be available at:

* [http://localhost:5173](http://localhost:5173)

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**su7ox**

GitHub: [@su7ox](https://github.com/su7ox)
