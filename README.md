# Dieting Journal

A desktop application built with Electron to help track daily food intake and nutrition goals.

## Features

- Track daily food entries with calories
- Maintain a reference list of common foods
- Set and monitor daily calorie goals
- View food history grouped by date
- Dark theme interface
- Data persistence between sessions

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/sejeks/dietingJournal.git
cd dietingJournal
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Building

To build a standalone app for your platform:

```bash
npm run build
```

On macOS this builds `dist/mac*/Dieting App.app` and installs it into `/Applications` (replacing any previous copy), so you can launch it from Spotlight, Launchpad or the Dock — no terminal needed. Re-run `npm run build` after making changes to update the installed app.

To produce a shareable DMG instead, run `npm run build:dmg`.

## Data Structure

The application stores data in the per-user app data folder (macOS: `~/Library/Application Support/Dieting App/data.json`). Existing data in `data/data.json` is copied there automatically on first run or build. The file has the following structure:

```json
{
  "foodEntries": [
    {
      "id": number,
      "foodItem": string,
      "amount": number,
      "calories": number,
      "date": string
    }
  ],
  "referenceList": [
    {
      "name": string,
      "caloriesPer100g": number
    }
  ],
  "dailyCalorieGoal": number,
  "lastUsedDate": string
}
```

## License

MIT 