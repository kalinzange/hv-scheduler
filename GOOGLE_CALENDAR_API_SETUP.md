# Google Calendar API Setup Guide

This guide walks you through setting up the Google Calendar API for automatic public holiday synchronization.

## Overview

The application uses the Google Calendar API to fetch public holidays for various countries. This requires:

- A Google Cloud Project with the Calendar API enabled (✅ You've already done this!)
- An API Key for authentication

## Setup Steps

### 1. Create API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **API Key**
5. Copy the generated API key

### 2. Restrict API Key (Recommended for Security)

1. Click on the newly created API key to edit it
2. Under **API restrictions**, select **Restrict key**
3. From the dropdown, select **Google Calendar API**
4. Under **Application restrictions** (optional but recommended):
   - Select **HTTP referrers (web sites)**
   - Add your production domain (e.g., `https://yourdomain.com/*`)
   - For local development, also add `http://localhost:*`
5. Click **Save**

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env` (if you haven't already):

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:

   ```
   GOOGLE_CALENDAR_API_KEY=AIzaSy...your_actual_key_here
   ```

3. For Firebase deployment, also set it in Firebase:
   ```bash
   firebase functions:config:set google.calendar_api_key="AIzaSy...your_actual_key_here"
   ```

### 4. Test the Integration

1. Restart your dev server:

   ```bash
   npm run dev
   ```

2. Log in as Manager or Admin
3. Open the Admin Dashboard
4. Verify that:
   - Public holidays load automatically
   - Network tab shows requests to `www.googleapis.com/calendar/v3/`
   - Optional holidays appear in the Optional section

## Supported Countries

The application currently supports public holidays for:

- 🇵🇹 Portugal (PT)
- 🇪🇸 Spain (ES)
- 🇫🇷 France (FR)
- 🇩🇪 Germany (DE)
- 🇮🇹 Italy (IT)
- 🇬🇧 United Kingdom (GB)
- 🇺🇸 United States (US)
- 🇧🇷 Brazil (BR)
- 🇹🇷 Turkey (TR)
- 🇮🇳 India (IN)

## API Endpoint Format

The application fetches holidays using:

```
GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
  ?key={YOUR_API_KEY}
  &singleEvents=true
  &orderBy=startTime
  &timeMin={year}-01-01T00:00:00Z
  &timeMax={year+1}-01-01T00:00:00Z
  &maxResults=2500
```

## Calendar IDs by Country

| Country  | Calendar ID                                         |
| -------- | --------------------------------------------------- |
| Portugal | `en.portuguese#holiday@group.v.calendar.google.com` |
| Spain    | `en.spain#holiday@group.v.calendar.google.com`      |
| France   | `en.french#holiday@group.v.calendar.google.com`     |
| Germany  | `en.german#holiday@group.v.calendar.google.com`     |
| Italy    | `en.italian#holiday@group.v.calendar.google.com`    |
| UK       | `en.uk#holiday@group.v.calendar.google.com`         |
| USA      | `en.usa#holiday@group.v.calendar.google.com`        |
| Brazil   | `en.brazilian#holiday@group.v.calendar.google.com`  |
| Turkey   | `en.turkish#holiday@group.v.calendar.google.com`    |
| India    | `en.indian#holiday@group.v.calendar.google.com`     |

## Troubleshooting

### Error: "API key not configured"

- Ensure `GOOGLE_CALENDAR_API_KEY` is set in your `.env` file
- Restart the dev server after adding the key

### Error: 403 Forbidden

- Check that the Google Calendar API is enabled in your Google Cloud Project
- Verify your API key is correct
- If using API restrictions, ensure your domain is allowed

### Error: 400 Bad Request

- Check the calendar ID is correct for the selected country
- Verify the API key has permissions for the Calendar API

### No holidays appearing

1. Open browser DevTools > Network tab
2. Filter for `googleapis.com`
3. Check if requests are being made
4. Inspect response for errors
5. Clear browser cache/localStorage (holiday cache key changed to force refresh)

### Past dates showing no holidays

- The app syncs holidays for: current year -2, -1, current, +1
- Check the Network tab to see if all years are fetched
- Cache TTL is 30 days; after that, fresh data is fetched

## Security Best Practices

1. **Never commit `.env` to version control** - It's already in `.gitignore`
2. **Restrict API key** to Google Calendar API only
3. **Add domain restrictions** for production deployments
4. **Rotate keys periodically** if you suspect compromise
5. **Monitor usage** in Google Cloud Console to detect anomalies

## Cost Considerations

- Google Calendar API has a **free quota** of 1,000,000 requests/day
- This application caches holidays for 30 days to minimize API calls
- With caching, typical usage: ~40 requests/month per user (4 years × 10 countries maximum)
- **Estimated cost**: Free for most use cases

## API Quotas & Limits

- **Queries per day**: 1,000,000 (free tier)
- **Queries per 100 seconds per user**: 500
- **Queries per minute per user**: 300

The application uses client-side caching to stay well within these limits.

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
