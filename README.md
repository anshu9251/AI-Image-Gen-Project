# ImagiFlow - AI Image Generation Platform

ImagiFlow is a premium, full-stack AI Image Generation Platform. Users can register and authenticate securely to initiate chat-style generation sessions, iterate on image ideas using text prompts, view their generation history in a global gallery, and download generated artwork.

The platform uses **FastAPI** for a high-performance backend, **MongoDB** for flexible document storage, and **React + Vite** for a modern, responsive user experience. Image generation is powered by a **multi-provider fallback chain** to ensure the app keeps working even when a single provider hits rate limits or exhausts its free-tier quota:

1. **Cloudflare Workers AI** (`@cf/black-forest-labs/flux-1-schnell`) — primary provider, fast and reliable
2. **Hugging Face Serverless Inference API** (`FLUX.1-schnell`, `Stable Diffusion XL`, `Dreamshaper-8`) — automatic fallback if Cloudflare is unavailable
3. **Pollinations.ai** — final no-API-key fallback, guarantees the app never fully fails

---

## Technical Stack

* **Frontend**: React.js, Vite, Lucide Icons, Vanilla CSS (Premium Dark Theme + Glassmorphism)
* **Backend**: Python FastAPI, Uvicorn, Motor (Async MongoDB Driver)
* **Database**: MongoDB (Local or MongoDB Atlas)
* **AI Providers**: Cloudflare Workers AI, Hugging Face Serverless Inference API, Pollinations.ai
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
3. Edit `.env` and fill in your values:
   ```env
   PORT=7860
   MONGO_URI=mongodb://localhost:27017/ai_image_gen
   JWT_SECRET=your_jwt_secret_key_here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Primary image generation provider
   CF_ACCOUNT_ID=your_cloudflare_account_id
   CF_API_TOKEN=your_cloudflare_api_token

   # Fallback image generation provider
   HF_API_KEY=hf_your_free_hugging_face_token_here
   ```
   - **Cloudflare Workers AI**: create a free account at [dash.cloudflare.com](https://dash.cloudflare.com), grab your Account ID from the dashboard sidebar, and generate an API token under **My Profile → API Tokens** with `Workers AI - Edit` permission.
   - **Hugging Face**: generate a free token in your Hugging Face profile settings under Access Tokens.
   - Pollinations.ai requires no key or setup — it's used automatically as the last resort.
4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the FastAPI dev server:
   ```bash
   python -m uvicorn app.main:app --reload --port 7860
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

## Image Generation Fallback Chain

To keep the app functional even when a provider's free tier runs out, `services/huggingface.py` implements a three-tier fallback:

1. **Cloudflare Workers AI** is tried first — it's fast and has a generous free tier.
2. If Cloudflare fails or credentials aren't set, the backend tries each Hugging Face model in order (`FLUX.1-schnell` → `Stable Diffusion XL` → `Dreamshaper-8`), skipping immediately on permanent errors (e.g. `402 Payment Required` quota exhaustion) rather than wasting time retrying them.
3. If every Hugging Face model also fails, **Pollinations.ai** is used as a final, key-free fallback so the user always gets an image instead of an error.

All attempts are logged (`logger.info` / `logger.warning` / `logger.error`) so you can see exactly which provider served a given request by checking the backend logs.

---

## Deployment Guide

### Backend on Render

1. **Create a Web Service**: Go to [Render](https://dashboard.render.com) and create a new **Web Service** from your GitHub repository.
2. **Configure Settings**:
   - Set **Root Directory** to `backend`.
   - Runtime: **Docker** (uses the existing `Dockerfile`), or Python with:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Set Environment Variables**:
   - In your Render service, navigate to the **Environment** tab and add:
     - `MONGO_URI`: Your MongoDB Atlas URI.
     - `JWT_SECRET`: A secure random password string.
     - `JWT_ALGORITHM`: `HS256`
     - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
     - `CF_ACCOUNT_ID`: Your Cloudflare Account ID.
     - `CF_API_TOKEN`: Your Cloudflare Workers AI API token.
     - `HF_API_KEY`: Your Hugging Face User Access Token (fallback provider).
   - Save changes — Render will automatically trigger a new deploy.
4. **Auto-Deploy**: Render watches your connected branch (usually `main`). Every `git push` automatically triggers a new build and deploy. You can confirm this under **Settings → Auto-Deploy**.
   Render will expose your backend at `https://<your-service-name>.onrender.com`.

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
   - Set it to your Render backend URL, e.g., `https://your-service-name.onrender.com` (without a trailing slash).
5. **Deploy**: Click **Deploy**. Vercel will automatically redeploy on every push to your connected branch, and will provide a production URL.