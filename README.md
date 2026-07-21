# ImagiFlow - AI Image Generation Platform

ImagiFlow is a premium, full-stack AI Image Generation Platform. Users can register and authenticate securely to initiate chat-style generation sessions, iterate on image ideas using text prompts, view their generation history in a global gallery, and download generated artwork.

The platform uses **FastAPI** for a high-performance backend, **MongoDB** for flexible document storage, and **React + Vite** for a modern, responsive user experience. Image generation is powered by the state-of-the-art **`black-forest-labs/FLUX.1-schnell`** model via Hugging Face's Serverless Inference API, with built-in fallbacks to **Stable Diffusion XL** and **Stable Diffusion 1.5**.

---

## Technical Stack

* **Frontend**: React.js, Vite, Lucide Icons, Vanilla CSS (Premium Dark Theme + Glassmorphism)
* **Backend**: Python FastAPI, Uvicorn, Motor (Async MongoDB Driver)
* **Database**: MongoDB (Local or MongoDB Atlas)
* **AI Model**: `black-forest-labs/FLUX.1-schnell` via Hugging Face Serverless Inference API
* **Authentication**: JWT (JSON Web Tokens) with Secure HTTP Bearer headers

---

## Directory Structure

```text
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── sessions.py
│   │   │   └── images.py
│   │   ├── services/
│   │   │   └── huggingface.py
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── models.py
│   ├── .env.sample
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.sample
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
└── README.md
```

---

## Local Setup & Run

### 1. MongoDB Setup
Make sure you have MongoDB running locally, or use a free cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
Default connection URI: `mongodb://localhost:27017/ai_image_gen`

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your `.env` file from the sample:
   ```bash
   cp .env.sample .env
   ```
3. Edit `.env` and fill in your values, including your **Hugging Face User Access Token** (you can generate one for free in your Hugging Face Profile settings under Access Tokens):
   ```env
   PORT=7860
   MONGO_URI=mongodb://localhost:27017/ai_image_gen
   JWT_SECRET=your_jwt_secret_key_here
   HF_API_KEY=hf_your_free_hugging_face_token_here
   ```
4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the FastAPI dev server:
   ```bash
   python app/main.py
   ```
   The backend will be running at `http://localhost:7860`. You can access the interactive Swagger API documentation at `http://localhost:7860/docs`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create your `.env` file from the sample:
   ```bash
   cp .env.sample .env
   ```
3. Verify that `VITE_API_URL` points to your backend instance:
   ```env
   VITE_API_URL=http://localhost:7860
   ```
4. Install npm packages:
   ```bash
   npm install
   ```
5. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:5173`. Open this URL in your web browser.

---

## Deployment Guide

### Backend on Hugging Face Spaces (Docker Space)

Hugging Face Spaces allows you to host Docker containers for free. Because our backend calls HF's serverless inference API, the backend can easily run on a free CPU-basic space without crashing or lagging.

1. **Create a Space**: Go to [Hugging Face Spaces](https://huggingface.co/new-space).
2. **Configure Settings**:
   - Give your space a name.
   - Choose **Docker** as the SDK.
   - Choose the **Blank** template.
   - Choose **Public** or **Private** visibility.
3. **Set Secrets (Variables)**:
   - In your Hugging Face Space page, navigate to **Settings** -> **Variables and Secrets**.
   - Add the following secrets (do not put them in your code files to keep them safe):
     - `MONGO_URI`: Your MongoDB Atlas URI.
     - `JWT_SECRET`: A secure random password string.
     - `HF_API_KEY`: Your Hugging Face User Access Token (to lift API limits).
4. **Push Files**:
   - Clone the space's git repository.
   - Copy all files from the `backend/` directory directly into the space's root directory (so `Dockerfile`, `requirements.txt`, and `app/` are at the root level of your space).
   - Commit and push to Hugging Face.
   Hugging Face will automatically compile the Dockerfile, launch the FastAPI server, and expose it at `https://<your-username>-<your-space-name>.hf.space`.

---

### Frontend on Vercel

1. **Push Frontend to GitHub**: Create a repository on GitHub and push the project.
2. **Create Vercel Project**: Go to [Vercel](https://vercel.com) and import your repository.
3. **Configure Build & Output**:
   - Set **Root Directory** to `frontend`.
   - Vercel will automatically detect **Vite** and configure the build settings.
     - Build Command: `npm run build`
     - Output Directory: `dist`
4. **Add Environment Variables**:
   - Add a new environment variable: `VITE_API_URL`
   - Set it to your Hugging Face Space URL, e.g., `https://username-space-name.hf.space` (without a trailing slash).
5. **Deploy**: Click **Deploy**. Vercel will deploy your site and provide a production URL.
