# 🚀 SmallSend

### Secure, Premium Pitch Deck Streaming for Modern Founders.

**SmallSend** is an open-source, high-performance Data Room designed to give founders a "DocSend-killer" experience. Built with a focus on speed, aesthetics, and privacy, it transforms static PDFs into immersive, slide-based experiences that load instantly on any device.

---

## ✨ Key Features

- **💎 Elite Viewing Experience**: A custom-built, image-based viewer that provides a smooth, app-like feel for your pitch decks.
- **⚡ Client-Side Processing**: PDFs are rendered and processed into high-resolution images directly in your browser—no heavy backend processing required.
- **🔄 Dynamic Replacement**: Update your deck content while keeping the **exact same sharing link**. No more resending links to investors after a typo fix.
- **🔗 Instant Sharing**: One-click sharing with built-in clipboard feedback.
- **🗑️ Deep Asset Cleanup**: Intelligent management that wipes all associated files (PDFs and processed slides) when a deck is deleted.
- **📊 Analytics Ready**: Integrated with PostHog for tracking engagement and slide performance.

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (PostgreSQL + Storage)
- **Processing**: pdf.js (Client-side rendering)
- **Styling**: Vanilla CSS (Outfit Typography)
- **Analytics**: PostHog

## 🌍 Open Source & Community

SmallSend is **100% Open Source**. We believe that every founder should have access to high-quality investor tools without the "DocSend Tax."

Whether you want to self-host your own private Data Room or contribute to the next generation of founder tools, the code is yours to explore, modify, and deploy.

## 🚀 Getting Started

1. **Clone the Repo**

   ```bash
   git clone https://github.com/ManishLapsusNext/SmallSend.git
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file with your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

4. **Launch**
   ```bash
   npm run dev
   ```

---

Built with ❤️ for the startup community.
