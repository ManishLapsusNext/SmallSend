# 🚀 Deckly | Easy Pitchdeck Workspace

### A shared deck workspace for founders and investors (https://deckly-xi.vercel.app)

**Deckly** is an open-source pitch deck workspace built for both founders and investors. Founders can share and update decks effortlessly, while investors get a clean system to manage, review, and remember what matters. Designed for speed, privacy, and simplicity.

---

## ✨ Key Features

- **🎯 Smooth, App-Like Deck Viewing**  
  A custom slide-based viewer that turns static PDFs into fast, responsive experiences with a native-app feel on any device.

- **⚡ Client-Side Rendering**  
  Decks are processed directly in the browser into high-resolution slides, reducing backend load and improving privacy and speed.

- **🔄 Same-Link Deck Updates**  
  Replace or update your pitch deck while keeping the **same shareable link** — no need to resend links after small fixes or iterations.

- **🗂 Data Rooms (Multiple Decks)**  
  Group related decks into data rooms for structured sharing during fundraising or reviews.

- **⏳ Link Expiration & Access Control**  
  Set expiration dates, disable downloads, and control how your deck is accessed.

- **🔗 One-Click Sharing**  
  Instant share links with clipboard feedback for a frictionless workflow.

- **🧠 Investor-Friendly Experience**  
  Investors can save decks, add private notes, tag startups, and revisit decks without losing context.

- **🤖 AI-Powered Deck Summaries**  
  Automatically generate concise, investor-focused summaries to quickly understand what a deck is about.

- **📊 Built-in Analytics**  
  Track deck engagement, slide drop-offs, and revisit signals using PostHog — with configurable analytics retention.

- **🔐 Privacy-First by Design**  
  No forced email capture, optional anonymous viewing, and minimal data collection by default.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (PostgreSQL + Storage)
- **Processing**: pdf.js (Client-side rendering)
- **Styling**: Vanilla CSS (Outfit Typography)
- **Analytics**: PostHog

## 🌍 Open Source & Community

Deckly is **100% Open Source**. We believe that every founder should have access to high-quality investor tools without the "Doc Tax."

Whether you want to self-host your own private Data Room or contribute to the next generation of founder tools, the code is yours to explore, modify, and deploy.

## 🚀 Getting Started

1. **Clone the Repo**

   ```bash
   git clone https://github.com/ManishLapsusNext/Deckly.git
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
