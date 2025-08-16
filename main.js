const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Set the app name
app.setName('Dieting App');

// Get the app directory path
const APP_DIR = __dirname;
const DATA_DIR = path.join(APP_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Log all paths
console.log('Main Process - App directory:', APP_DIR);
console.log('Main Process - Data directory:', DATA_DIR);
console.log('Main Process - Data file:', DATA_FILE);

// Initialize data file if it doesn't exist
function initializeDataFile() {
    console.log('Main Process - Initializing data file...');
    try {
        if (!fs.existsSync(DATA_DIR)) {
            console.log('Main Process - Creating data directory:', DATA_DIR);
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        // Only initialize if file doesn't exist
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                foodEntries: [],
                referenceList: [],
                dailyCalorieGoal: 2000
            };
            
            console.log('Main Process - Writing initial data:', initialData);
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            
            // Verify the write
            const readData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            console.log('Main Process - Verified initial data:', readData);
        } else {
            // Verify existing file
            const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            console.log('Main Process - Existing data file found:', existingData);
            
            // If file exists but has wrong structure, fix it
            if (!Array.isArray(existingData.foodEntries) || 
                !Array.isArray(existingData.referenceList) || 
                typeof existingData.dailyCalorieGoal !== 'number') {
                console.log('Main Process - Fixing invalid data structure');
                const fixedData = {
                    foodEntries: Array.isArray(existingData.foodEntries) ? existingData.foodEntries : [],
                    referenceList: Array.isArray(existingData.referenceList) ? existingData.referenceList : [],
                    dailyCalorieGoal: typeof existingData.dailyCalorieGoal === 'number' ? existingData.dailyCalorieGoal : 2000
                };
                fs.writeFileSync(DATA_FILE, JSON.stringify(fixedData, null, 2));
                console.log('Main Process - Fixed data structure:', fixedData);
            }
        }
    } catch (error) {
        console.error('Main Process - Error initializing data file:', error);
    }
}

// IPC handlers for data operations
ipcMain.handle('load-data', async () => {
    try {
        console.log('Main Process - Loading data from:', DATA_FILE);
        
        if (!fs.existsSync(DATA_FILE)) {
            console.log('Main Process - Data file not found, initializing...');
            initializeDataFile();
        }
        
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        console.log('Main Process - Raw file content:', content);
        
        let data;
        try {
            data = JSON.parse(content);
        } catch (parseError) {
            console.error('Main Process - Error parsing data file:', parseError);
            // If file is corrupted, initialize with default data
            initializeDataFile();
            data = {
                foodEntries: [],
                referenceList: [],
                dailyCalorieGoal: 2000
            };
        }
        
        // Validate data structure
        if (!data || typeof data !== 'object') {
            console.error('Main Process - Invalid data structure');
            data = {
                foodEntries: [],
                referenceList: [],
                dailyCalorieGoal: 2000
            };
        }
        
        if (!Array.isArray(data.foodEntries)) {
            console.error('Main Process - Invalid foodEntries array');
            data.foodEntries = [];
        }
        
        if (!Array.isArray(data.referenceList)) {
            console.error('Main Process - Invalid referenceList array');
            data.referenceList = [];
        }
        
        if (typeof data.dailyCalorieGoal !== 'number' || data.dailyCalorieGoal <= 0) {
            console.error('Main Process - Invalid dailyCalorieGoal');
            data.dailyCalorieGoal = 2000;
        }
        
        console.log('Main Process - Parsed and validated data:', data);
        return data;
    } catch (error) {
        console.error('Main Process - Error loading data:', error);
        return { foodEntries: [], referenceList: [], dailyCalorieGoal: 2000 };
    }
});

ipcMain.handle('save-data', async (event, data) => {
    try {
        console.log('Main Process - Received data to save:', JSON.stringify(data, null, 2));
        console.log('Main Process - Saving to:', DATA_FILE);
        
        // Ensure directory exists
        if (!fs.existsSync(DATA_DIR)) {
            console.log('Main Process - Creating data directory:', DATA_DIR);
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        // Validate data structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }
        
        if (!Array.isArray(data.foodEntries)) {
            throw new Error('Invalid foodEntries format');
        }
        
        if (!Array.isArray(data.referenceList)) {
            throw new Error('Invalid referenceList format');
        }
        
        // Format data for saving
        const dataToSave = {
            foodEntries: data.foodEntries,
            referenceList: data.referenceList,
            dailyCalorieGoal: data.dailyCalorieGoal || 2000,
            lastUsedDate: data.lastUsedDate || new Date().toISOString().split('T')[0]
        };
        
        console.log('Main Process - Formatted data to save:', JSON.stringify(dataToSave, null, 2));
        
        // Write to temporary file first
        const tempFile = `${DATA_FILE}.tmp`;
        console.log('Main Process - Writing to temporary file:', tempFile);
        fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2));
        
        // Verify temporary file
        const tempContent = fs.readFileSync(tempFile, 'utf8');
        console.log('Main Process - Temporary file content:', tempContent);
        
        // Move temporary file to actual file
        console.log('Main Process - Moving temporary file to:', DATA_FILE);
        fs.renameSync(tempFile, DATA_FILE);
        
        // Final verification
        const savedContent = fs.readFileSync(DATA_FILE, 'utf8');
        console.log('Main Process - Final file content:', savedContent);
        
        return true;
    } catch (error) {
        console.error('Main Process - Error saving data:', error);
        console.error('Main Process - Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return false;
    }
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Dieting App",
    icon: path.join(APP_DIR, "icon.icns"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(APP_DIR, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  // Open DevTools only in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Add keyboard shortcut to toggle DevTools (Cmd+Option+I on Mac, Ctrl+Shift+I on Windows/Linux)
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Log when window is ready
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Main Process - Window loaded");
  });

  // Log any errors
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Main Process - Window failed to load:", errorDescription);
    }
  );
}

// Initialize app
app.whenReady().then(() => {
    console.log('Main Process - App is ready');
    console.log('Main Process - Current working directory:', process.cwd());
    console.log('Main Process - App directory:', APP_DIR);
    
    // Only initialize if file doesn't exist
    if (!fs.existsSync(DATA_FILE)) {
        initializeDataFile();
    }
    
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 