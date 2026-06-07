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
## Live Production Links
- **Web Dashboard**: [https://snap-ledger-web.vercel.app/](https://snap-ledger-web.vercel.app/)
- **Backend API Base URL**: [https://snapledger-9wsn.onrender.com](https://snapledger-9wsn.onrender.com)
- **Mobile APK Download**: [https://expo.dev/artifacts/eas/6m9Q9WFKWX9CMjDB9CDP3Y.apk](https://expo.dev/artifacts/eas/6m9Q9WFKWX9CMjDB9CDP3Y.apk)

## Environment Variables Template
Do not commit raw keys. Use the following templates when deploying or running locally.

**Backend (`appsettings.Development.json`):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=YOUR_DB_HOST;Database=snapledger;Username=YOUR_USER;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "Secret": "YOUR_SUPER_SECRET_JWT_KEY",
    "Issuer": "snapledger",
    "Audience": "snapledger-clients"
  },
  "Google": {
    "ClientId": "YOUR_GOOGLE_WEB_CLIENT_ID"
  },
  "OcrSpace": {
    "ApiKey": "YOUR_OCR_API_KEY"
  },
  "ImgBB": {
    "ApiKey": "YOUR_IMGBB_API_KEY"
  }
}
```

**Web Dashboard (`web-dashboard/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
```

**Mobile App (`mobile-app/.env`):**
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_GOOGLE_ANDROID_CLIENT_ID
```

## Creative Feature & Rationale
**Feature Built:** Spending Analytics & Multi-Currency Normalisation + CSV Export.

**Rationale:** A bill scanner is fundamentally a data-entry tool, but users extract value from *insights*, not just stored images. By implementing Recharts-powered analytics, users can instantly visualize their monthly spending and category breakdowns. To make this data actionable, we implemented a CSV Export tool so users can integrate their scanned receipts into Excel or accounting software. Because bills are often in different currencies, the backend features a currency normalisation layer (e.g., LBP to USD) ensuring the charts and totals accurately reflect unified spending. This transforms the app from a simple scanner into a genuine financial management tool.

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
