# Developer Documentation - Deckly

Deckly is a premium "Data Room" application designed for sharing pitch decks with high-fidelity previews and real-time viewer analytics.

## 🚀 Tech Stack

- **Frontend**: React 18 with Vite
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL Database, Storage)
- **PDF Processing**: `pdfjs-dist` (Converting PDFs to high-performance WebP slide images)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (Custom Glassmorphic Design System)

---

## 📁 File Structure Breakdown

### `src/components/common/`

This directory contains the **Atomic UI Components**. They are designed to be state-agnostic and reusable across the entire app to maintain visual consistency.

- `Button.jsx`: Handles all variants (`primary`, `glass`, `danger`) and loading states.
- `Input.jsx` & `Textarea.jsx`: Glassmorphic form fields with label and icon support.
- `Card.jsx`: The foundational "Frosted Glass" container.
- `Toggle.jsx`: Custom switch for boolean settings (e.g., Link Expiry).

### `src/pages/`

- `Home.jsx`: The main dashboard. It manages the deck list state and handles deletions/updates.
- `ManageDeck.jsx`: (Formerly Admin.jsx) A unified page for both **Creating** and **Editing** decks. Includes the PDF-to-Image processing pipeline.
- `Viewer.jsx`: The public-facing page where guests view the decks.
- `Login.jsx` & `Signup.jsx`: Auth flows using Supabase GoTrue.

### `src/services/`

- `deckService.js`: Contains all business logic for fetching decks, uploading PDFs, and converting PDF pages into images.
- `analyticsService.js`: Manages the heartbeat-based tracking system that calculates time spent per slide.
- `supabase.js`: Initialized Supabase client.

---

## 🛠 Project Architecture & Data Flow

### 1. PDF Conversion Pipeline

When a user uploads a PDF in `ManageDeck.jsx`:

1. The PDF is uploaded to Supabase Storage (`decks` bucket).
2. `pdfjs-dist` loads the file in the browser.
3. Each page is rendered to a canvas at **1.5x scale** for a balance of quality and speed.
4. Canvases are converted to **WebP blobs** (80% quality).
5. Blobs are uploaded to a structured folder in storage: `userId/deck-images/slug/page-N.webp`.

### 2. Layout & Design System (`App.css`)

The app uses a **Centralized Design Token** system in `:root`:

- `--accent-primary`: The signature green color.
- `--glass-bg`: The base transparency for cards.
- `--transition-smooth`: Harmonic easing for all hover effects.

**Utility-First Approach**: Instead of repeating CSS, we use components like `Card` and `Button` which inject these global tokens.

### 3. Analytics Tracking

Analytics are recorded in the `Viewer.jsx` via `analyticsService.js`:

- **Unique Views**: Logged on initial mount.
- **Time Spent**: Calculated by sending a "heartbeat" to Supabase every few seconds while the slide is active.
- **Aggregates**: `DeckDetailPanel.jsx` fetches and sums these records to show the "Total Views" and "Avg. Session" cards.

---

## 🚦 Getting Started for Developers

### Prerequisites

- Node.js (v16+)
- A Supabase Project with `decks` and `analytics` tables.

### Setup

1. Clone the repository.
2. Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Important Database Columns

The `decks` table expects:

- `id` (uuid)
- `title` (text)
- `slug` (text, unique)
- `file_url` (text)
- `pages` (text[], array of slide image URLs)
- `expires_at` (timestamptz, optional)
- `user_id` (uuid, fk to auth.users)
