# AI Assessment Application - Deployment Guide

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account and project

## Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure Supabase:
- Create a new Supabase project
- Copy your project URL and anon key
- Update the `.env` file with your Supabase credentials

4. Run database migrations:
```bash
# Apply the migration file in supabase/migrations/
```

5. Start development server:
```bash
npm run dev
```

## Production Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DEFAULT_COHORT`
   - `VITE_USE_LOCAL_ONLY`

3. Deploy automatically on push to main branch

### Manual Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

- 10-question AI efficiency assessment
- 5-dimensional scoring system
- Personalized results with radar charts
- Group statistics and data visualization
- Responsive design with animations
- Supabase integration for data storage

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_SUPABASE_URL | Supabase project URL | required |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | required |
| VITE_DEFAULT_COHORT | Default user cohort | default |
| VITE_USE_LOCAL_ONLY | Use local storage only | false |