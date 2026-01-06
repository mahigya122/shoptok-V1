# Shoptok

A luxurious, commercial-ready social commerce app combining a TikTok-style video feed with shopping.

## Tech
- Frontend: Expo + React Native + Expo Router, Expo AV for video
- Backend: Supabase (Auth, DB, Storage, Edge Functions)
- Payments: Stripe
- Analytics: custom events table

## Setup
1. Clone repository.
2. Create Supabase project. Set:
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
3. In Supabase SQL Editor:
   - Run `supabase/schema.sql` and `supabase/seed.sql`.
4. Deploy Edge Functions:
   - `supabase functions deploy recommend`
   - `supabase functions deploy webhook-stripe`
5. Stripe:
   - Get Publishable and Secret keys.
   - Configure webhook to point to your `webhook-stripe` function endpoint.
6. Create `.env` in project root with all env values.
7. Install dependencies:
   - `npm install`
8. Run app:
   - `npm run start`

## Notes
- Video playback uses `expo-av` with loop, poster images, and mute/play controls.
- For You page uses an Edge Function that adapts to user likes/follows/views.
- Auth uses email OTP (magic link). Customize for OAuth easily via Supabase.
- Payment Intent creation should be handled by a secure backend endpoint (Node/Express or Supabase Edge function) returning `{ paymentIntent, ephemeralKey, customer }`. Replace `https://YOUR_SERVER/create-payment-intent` in `app/checkout.tsx`.

## Production
- Enable RLS policies and test with real users.
- Configure EAS build profiles for iOS/Android.
- Replace placeholder media URLs with Supabase Storage.
- Harden recommendation scoring and privacy.
