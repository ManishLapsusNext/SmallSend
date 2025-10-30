# Project: Low-Level DocSend Alternative (MVP)

## Goal
Create a minimal, modern alternative to DocSend.

## Current Stack
- **Backend:** Supabase (for PDF storage and database)
- **Frontend:** React (Vite)

## Core MVP Feature
The primary goal is to display PDF presentations as a series of images, mimicking the DocSend experience.

## Immediate Next Step
- **Implement a Supabase Edge Function:** This function will be triggered on PDF upload. Its responsibility is to:
    1. Take the uploaded PDF file.
    2. Convert each page of the PDF into an image.
    3. Store these images back into Supabase Storage.
    4. Update the corresponding deck record in the database with the URLs of the newly created images.

## Future Context
This `Gemini.md` file provides context for future development sessions. The main focus is on building out the PDF-to-image conversion pipeline.
