# ClaimLens

ClaimLens is a full-stack web application designed to automatically analyze the credibility of advertisements across major platforms like YouTube, Instagram

By simply pasting an ad URL, our multi-modal AI pipeline extracts audio transcripts, on-screen text, and visual frames to detect false claims, misleading comparisons, and visual manipulation. It leverages **Gemini 1.5 Flash** for deep multimodal analysis and the **Serper Google Search API** for live fact-checking, ultimately generating a comprehensive credibility report and verdict.

## Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Authentication
- **AI Services Pipeline:** Python, FastAPI, yt-dlp, ffmpeg, Sarvam AI (multilingual), Tessaract OCR, Gemini 2.5 Flash
- **Job Queue:** BullMQ & Upstash Redis (to handle long-running video analysis asynchronously)
