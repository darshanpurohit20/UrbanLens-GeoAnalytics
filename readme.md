# 🌆 UrbanLens – Geospatial Analytics Dashboard

UrbanLens is a modern, full-stack geospatial analytics dashboard that visualizes urban mobility patterns using latitude-longitude data. It helps identify clusters, density zones, and traffic hotspots through an interactive map-based interface.

---

## 🚀 Features

### 🗺️ Interactive Map
- **Full-screen map:** Leaflet / Mapbox ready.
- **Dynamic rendering:** Supports zooming and panning.
- **Toggle layers:** Switch between raw points, clusters, and heatmaps easily.

### 📊 Spatial Analytics
- **Primary Clustering:** DBSCAN clustering.
- **Alternative Clustering:** Optional K-Means clustering.
- **Density-based hotspot detection:**
  - 🔴 High density
  - 🟡 Medium density
  - 🟢 Low density

### 🔥 Heatmap Visualization
- Real-time density rendering.
- Simple toggle on/off functionality.

### 🎛️ Filters
- Time range filtering.
- Location bounds filtering.
- Density threshold control.

### 📈 Insights Panel
- Total clusters tracked.
- Average density metrics.
- Top hotspots identification.
- Activity distribution charts.

---

## 🧱 Tech Stack

**Frontend:**
- Next.js (App Router)
- Tailwind CSS
- Leaflet (Map rendering)
- Recharts (Analytics)

**Backend:**
- FastAPI (Python)
- GeoPandas, Shapely
- Pandas, NumPy
- Scikit-learn (DBSCAN, KMeans)

---

## 📁 Project Structure

URBANLENS-GEOANALYTICS/
│
├── backend/
│   ├── main.py              # FastAPI app
│   ├── pyproject.toml       # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   ├── next.config.mjs
│
├── hooks/
├── public/
├── vercel.json
└── README.md

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

git clone https://github.com/darshanpurohit20/urbanlens-geoanalytics.git
cd urbanlens-geoanalytics

### 2️⃣ Backend Setup (FastAPI)

cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
# OR if using pyproject: pip install .

# Run server
uvicorn main:app --reload

📍 Backend runs at: http://127.0.0.1:8000

### 3️⃣ Frontend Setup (Next.js)

cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

📍 Frontend runs at: http://localhost:3000

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Payload/Response |
| :--- | :--- | :--- | :--- |
| POST | /upload-data | Upload dataset | Accepts CSV/JSON with latitude, longitude, and optional timestamp. |
| GET | /clusters | Clustering Data | Returns grouped coordinates using DBSCAN / KMeans. |
| GET | /heatmap | Heatmap Data | Returns the density grid for visualization. |
| GET | /insights | Analytics Insights | Returns cluster count, avg density, and top hotspots. |

---

## 📊 Sample Data Format

latitude,longitude,timestamp
19.0760,72.8777,2025-01-01T10:00:00
19.0820,72.8810,2025-01-01T10:05:00

---

## 🎨 UI/UX Highlights

- 🌙 Dark mode by default
- 📦 Clean dashboard layout
- 📍 Floating stat cards
- 🎯 Smooth animations
- 📊 Real-time updates

---

## ⚡ Deployment

Vercel (Recommended)

vercel deploy

- Frontend: Deploy directly to Vercel.
- Backend: Deploy via Vercel Serverless, Railway, or Render.

---

## 🧠 Future Enhancements

- [ ] WebSocket live tracking
- [ ] Real-time GPS ingestion
- [ ] AI-based traffic prediction
- [ ] User authentication
- [ ] Save & export analytics

---

## 👨‍💻 Author

**Darshan Purohit**
🔗 GitHub: https://github.com/darshanpurohit20

## 📜 License

MIT License
