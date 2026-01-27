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

## 👨‍💻 Author

**Manish Barti**  
B.Tech CSE Student  
GitHub: https://github.com/su7ox

---

## ⚠️ Disclaimer

SafeNav is an academic and experimental project.  
It is intended for educational and research purposes only and should not be used as a replacement for professional security solutions.

