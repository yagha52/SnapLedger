# SnapLedger 📄

SnapLedger is an end-to-end bill management ecosystem designed to digitize, organize, and analyze paper receipts using AI-powered OCR. It consists of a React Native mobile scanner app, a Next.js web dashboard, and a C# .NET API.

## Features Built
1. **Mobile App (React Native / Expo)**: 
   - Clean, dark-mode native interface.
   - Live camera scanner & gallery selection for receipts.
   - Secure Google Authentication (OAuth2) integrated.
2. **Backend API (C# .NET 8 & PostgreSQL)**: 
   - JWT-based Auth and Google Token validation.
   - Integrates with ImgBB (image hosting) and OCR.space (receipt text extraction).
   - Custom `VisionService` that accurately parses Dates, Total Amounts, and Currencies (e.g., LBP, USD) using Regular Expressions.
3. **Web Dashboard (Next.js & React Query)**: 
   - Stunning, modern UI with gradients and micro-animations.
   - **Analytics & Visualisation**: Recharts-powered graphs showing category breakdowns and monthly spending totals.
   - **Interactive Table**: Edit incorrect OCR reads, delete receipts, and view original images.
   - **CSV Export**: Instantly download your expense data to a spreadsheet.

## Prerequisites
- Node.js 20+
- .NET 8.0 SDK
- PostgreSQL database
- API Keys for Google OAuth, ImgBB, and OCR.space

## Running Locally

### 1. Backend API
1. Navigate to `backend-api/SnapLedger.Api`
2. Create a file named `appsettings.Development.json` using `appsettings.json` as a template, and fill in your private API keys and Database connection string.
3. Run `dotnet ef database update` to apply migrations.
4. Run `dotnet run` to start the server on `http://localhost:5000`.

### 2. Web Dashboard
1. Navigate to `web-dashboard`
2. Run `npm install`
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID
   ```
4. Run `npm run dev` and open `http://localhost:3000`.

### 3. Mobile App
1. Navigate to `mobile-app`
2. Run `npm install`
3. Create a `.env` file:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID
   ```
4. Run `npx expo start` to launch in Expo Go, or `npx eas build -p android` to generate a standalone APK.
