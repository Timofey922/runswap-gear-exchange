---
name: Strava integration
description: OAuth flow via edge function, shared session across recommendations and mileage verification
type: feature
---
- Strava Client ID: 222256, stored as constant in useStrava hook
- Client secret stored as STRAVA_CLIENT_SECRET Supabase secret (never client-side)
- Edge functions: strava-auth (token exchange), strava-proxy (API calls), ai-recommendations (Lovable AI + listings matching)
- Shared OAuth session via localStorage (pacemarket_strava_tokens)
- Mileage verification on Sell page for shoes category — matches gear by brand/model
- AI recommendations page analyzes 30 recent activities + gear, uses Lovable AI to match listings
