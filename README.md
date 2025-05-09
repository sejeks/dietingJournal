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

To build the application for your platform:

```bash
npm run build
```

## Data Structure

The application stores data in `data/data.json` with the following structure:

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