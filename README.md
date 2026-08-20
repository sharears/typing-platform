# Learn Anything by Typing

An adaptive, web-based typing platform built to help you improve your typing speed while absorbing knowledge. Provide any URL or upload a file, and the platform will extract the readable content and turn it into a custom typing session.

## Features

- **Custom Typing Content**: Paste any URL (news articles, documentation) or upload a local text/PDF file to practice typing real-world content.
- **Smart Text Extraction**: Uses Mozilla's Readability library to aggressively strip out ads, navbars, and junk, leaving only pure, readable paragraphs.
- **Adaptive Progress Tracking**: Tracks your Words Per Minute (WPM) and Error Rate. Daily progress is saved incrementally to your profile.
- **Customizable Interface**: Change the window width, font size, font style, and color themes directly from your dashboard preferences.
- **User Authentication**: Secure signup and login system using NextAuth.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Text Parsing**: JSDOM + @mozilla/readability
- **Deployment**: Vercel

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file with a `DATABASE_URL` pointing to your Postgres instance, and a `NEXTAUTH_SECRET`.
4. Push the database schema:
   ```bash
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for seamless deployment on [Vercel](https://vercel.com). Just connect your GitHub repository and ensure the environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) are configured in your Vercel project settings.
