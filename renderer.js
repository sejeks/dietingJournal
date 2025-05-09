// Initialize variables
let dailyCalorieGoal = 2000;
let foodEntries = [];
let referenceList = [];
let lastUsedDate = new Date().toISOString().split('T')[0]; // Initialize with today

// DOM Elements
const foodEntryForm = document.getElementById('foodEntryForm');
const foodEntriesTable = document.getElementById('foodEntries');
const referenceListTable = document.getElementById('referenceList');
const totalCaloriesElement = document.getElementById('totalCalories');
const remainingCaloriesElement = document.getElementById('remainingCalories');
const foodItemInput = document.getElementById('foodItem');
const foodItemsDatalist = document.getElementById('foodItems');
const newItemFields = document.getElementById('newItemFields');
const caloriesPer100gInput = document.getElementById('caloriesPer100g');
const dailyCalorieLimitElement = document.getElementById('dailyCalorieLimit');
const calorieLimitInput = document.getElementById('calorieLimitInput');
const calorieLimitDisplay = document.getElementById('calorieLimitDisplay');
const calorieLimitEdit = document.getElementById('calorieLimitEdit');
const toggleEntriesButton = document.getElementById('toggleEntries');
const entriesContent = document.getElementById('entriesContent');
const dateInput = document.getElementById('date');

// Initialize collapsible sections
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state
    entriesContent.style.display = 'block';
    toggleEntriesButton.querySelector('.toggle-icon').textContent = '▼';
    
    // Add click handler for toggle button
    toggleEntriesButton.addEventListener('click', () => {
        const isVisible = entriesContent.style.display !== 'none';
        entriesContent.style.display = isVisible ? 'none' : 'block';
        toggleEntriesButton.querySelector('.toggle-icon').textContent = isVisible ? '▶' : '▼';
    });
    
    // Load initial data
    loadData();
});

// Load saved data
async function loadData() {
    try {
        console.log('Renderer - Loading data...');
        if (!window.api) {
            throw new Error('API not available - preload script may not be working');
        }
        
        const data = await window.api.invoke('load-data');
        console.log('Renderer - Received data from main process:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data received from main process');
        }
        
        foodEntries = data.foodEntries || [];
        referenceList = data.referenceList || [];
        dailyCalorieGoal = data.dailyCalorieGoal || 2000;
        lastUsedDate = data.lastUsedDate || new Date().toISOString().split('T')[0];
        
        console.log('Renderer - Processed data:', {
            foodEntries,
            referenceList,
            dailyCalorieGoal,
            lastUsedDate
        });
        
        // Set the last used date in the date input
        dateInput.value = lastUsedDate;
        
        updateReferenceListUI();
        updateFoodItemsDatalist();
        updateUI();
        updateCalorieLimitDisplay();
        
        console.log('Renderer - Data loaded successfully');
    } catch (error) {
        console.error('Renderer - Error loading data:', error);
        alert('Failed to load data: ' + error.message);
    }
}

// Save data
async function saveData() {
    try {
        console.log('Renderer - Starting save operation...');
        console.log('Renderer - Current state before save:', {
            foodEntries,
            referenceList,
            dailyCalorieGoal,
            lastUsedDate
        });
        
        const data = {
            foodEntries: [...foodEntries],
            referenceList: [...referenceList],
            dailyCalorieGoal,
            lastUsedDate
        };
        
        if (!window.api) {
            throw new Error('API not available - preload script may not be working');
        }
        
        console.log('Renderer - Sending data to main process:', data);
        const result = await window.api.invoke('save-data', data);
        console.log('Renderer - Save result from main process:', result);
        
        if (!result) {
            throw new Error('Save operation failed - main process returned false');
        }
        
        // Verify by loading the data back
        console.log('Renderer - Verifying save by loading data back...');
        const loadedData = await window.api.invoke('load-data');
        console.log('Renderer - Verification - loaded data:', loadedData);

        // Detailed verification logging
        console.log('Renderer - Verification details:');
        console.log('- Food entries length match:', loadedData.foodEntries.length === data.foodEntries.length);
        console.log('- Reference list length match:', loadedData.referenceList.length === data.referenceList.length);
        
        // Check food entries
        const foodEntriesMatch = data.foodEntries.every(entry => {
            const matchingEntry = loadedData.foodEntries.find(loadedEntry => 
                loadedEntry.id === entry.id &&
                loadedEntry.foodItem === entry.foodItem &&
                loadedEntry.amount === entry.amount &&
                loadedEntry.calories === entry.calories &&
                loadedEntry.date === entry.date
            );
            if (!matchingEntry) {
                console.log('Renderer - Missing food entry:', entry);
                return false;
            }
            return true;
        });
        console.log('- All food entries match:', foodEntriesMatch);
        
        // Check reference list
        const referenceListMatch = data.referenceList.every(item => {
            const matchingItem = loadedData.referenceList.find(loadedItem => 
                loadedItem.name === item.name &&
                loadedItem.caloriesPer100g === item.caloriesPer100g
            );
            if (!matchingItem) {
                console.log('Renderer - Missing reference item:', item);
                return false;
            }
            return true;
        });
        console.log('- All reference items match:', referenceListMatch);
        
        // Check other properties
        const otherPropsMatch = 
            loadedData.dailyCalorieGoal === data.dailyCalorieGoal &&
            loadedData.lastUsedDate === data.lastUsedDate;
        console.log('- Other properties match:', otherPropsMatch);
        console.log('- Daily calorie goal match:', loadedData.dailyCalorieGoal === data.dailyCalorieGoal);
        console.log('- Last used date match:', loadedData.lastUsedDate === data.lastUsedDate);
        
        const isVerified = 
            loadedData.foodEntries.length === data.foodEntries.length &&
            loadedData.referenceList.length === data.referenceList.length &&
            foodEntriesMatch &&
            referenceListMatch &&
            otherPropsMatch;
            
        if (!isVerified) {
            console.error('Renderer - Data verification failed:', {
                expected: data,
                received: loadedData,
                details: {
                    foodEntriesLength: {
                        expected: data.foodEntries.length,
                        received: loadedData.foodEntries.length
                    },
                    referenceListLength: {
                        expected: data.referenceList.length,
                        received: loadedData.referenceList.length
                    },
                    foodEntriesMatch,
                    referenceListMatch,
                    otherPropsMatch
                }
            });
            throw new Error('Data verification failed - saved data does not match current data');
        }
        
        console.log('Renderer - Save operation completed and verified');
        return true;
    } catch (error) {
        console.error('Renderer - Error saving data:', error);
        alert('Failed to save data: ' + error.message);
        return false;
    }
}

// Update food items datalist
function updateFoodItemsDatalist() {
    foodItemsDatalist.innerHTML = '';
    referenceList.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        foodItemsDatalist.appendChild(option);
    });
}

// Add new food entry
async function addFoodEntry(event) {
    event.preventDefault();
    console.log('Adding new food entry...');

    const foodItem = foodItemInput.value.trim();
    if (!foodItem) {
        alert('Please enter a food item');
        return;
    }

    const amount = parseInt(document.getElementById('amount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Get date or use last used date
    let date = dateInput.value;
    if (!date) {
        date = lastUsedDate;
    }
    
    // Update last used date
    lastUsedDate = date;
    
    console.log('Processing entry with date:', date);
    
    let calories;
    let referenceItem = referenceList.find(item => item.name.toLowerCase() === foodItem.toLowerCase());
    
    if (!referenceItem) {
        const caloriesPer100g = parseInt(caloriesPer100gInput.value);
        if (isNaN(caloriesPer100g) || caloriesPer100g <= 0) {
            alert('Please enter valid calories per 100g for the new item');
            return;
        }
        
        referenceItem = {
            name: foodItem,
            caloriesPer100g: caloriesPer100g
        };
        referenceList.push(referenceItem);
        console.log('Added new reference item:', referenceItem);
        // Update reference list UI immediately
        updateReferenceListUI();
        updateFoodItemsDatalist();
    }
    
    calories = Math.round((amount * referenceItem.caloriesPer100g) / 100);

    const entry = {
        id: Date.now(),
        foodItem,
        amount,
        calories,
        date
    };

    console.log('Adding new entry:', entry);
    foodEntries.push(entry);
    
    // Save data and verify
    const saveResult = await saveData();
    if (!saveResult) {
        alert('Failed to save entry. Please try again.');
        foodEntries.pop(); // Remove the entry if save failed
        return;
    }

    updateUI();
    foodEntryForm.reset();
    // Keep the last used date in the input
    dateInput.value = lastUsedDate;
    newItemFields.classList.add('hidden');
}

// Delete food entry
function deleteEntry(id) {
    foodEntries = foodEntries.filter(entry => entry.id !== id);
    saveData();
    updateUI();
}

// Delete reference item
function deleteReferenceItem(name) {
    referenceList = referenceList.filter(item => item.name !== name);
    saveData();
    updateReferenceListUI();
    updateFoodItemsDatalist();
}

// Update UI with current data
function updateUI() {
    foodEntriesTable.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = foodEntries.filter(entry => entry.date === today);

    const totalCalories = todaysEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const remainingCalories = dailyCalorieGoal - totalCalories;

    totalCaloriesElement.textContent = totalCalories;
    remainingCaloriesElement.textContent = remainingCalories;

    // Group entries by date
    const entriesByDate = foodEntries.reduce((groups, entry) => {
        const date = entry.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(entry);
        return groups;
    }, {});

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach(date => {
        const entries = entriesByDate[date];
        const isToday = date === today;
        
        // Combine similar foods for this date
        const combinedEntries = entries.reduce((combined, entry) => {
            const existingEntry = combined.find(e => 
                e.foodItem.toLowerCase() === entry.foodItem.toLowerCase()
            );
            
            if (existingEntry) {
                existingEntry.amount += entry.amount;
                existingEntry.calories += entry.calories;
            } else {
                combined.push({...entry});
            }
            return combined;
        }, []);

        // Calculate daily total
        const dailyTotal = combinedEntries.reduce((sum, entry) => sum + entry.calories, 0);
        
        // Only add date header for previous days
        if (!isToday) {
            const dateHeader = document.createElement('tr');
            const formattedDate = formatDate(date);
            dateHeader.innerHTML = `
                <td colspan="5" class="px-4 py-2 bg-gray-800 font-medium text-gray-200 border-b border-gray-700">
                    ${formattedDate}
                </td>
            `;
            foodEntriesTable.appendChild(dateHeader);
        }

        // Add entries for this date
        combinedEntries.forEach(entry => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700 text-gray-300';
            row.innerHTML = `
                <td class="px-4 py-2"></td>
                <td class="px-4 py-2">${entry.foodItem}</td>
                <td class="px-4 py-2">${entry.amount}g</td>
                <td class="px-4 py-2">${entry.calories}</td>
                <td class="px-4 py-2">
                    <button onclick="deleteEntry(${entry.id})" class="text-red-400 hover:text-red-300">
                        Delete
                    </button>
                </td>
            `;
            foodEntriesTable.appendChild(row);
        });

        // Add daily total row with distinct styling
        const totalRow = document.createElement('tr');
        totalRow.className = 'bg-gray-800/50 font-medium';
        totalRow.innerHTML = `
            <td colspan="3" class="px-4 py-2 text-right text-gray-400">Daily Total:</td>
            <td class="px-4 py-2 text-blue-400">${dailyTotal}</td>
            <td></td>
        `;
        foodEntriesTable.appendChild(totalRow);
    });
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
        return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Update reference list UI
function updateReferenceListUI() {
    referenceListTable.innerHTML = '';
    
    referenceList.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700 text-gray-300';
        row.innerHTML = `
            <td class="px-4 py-2">${item.name}</td>
            <td class="px-4 py-2">${item.caloriesPer100g}</td>
            <td class="px-4 py-2">
                <button onclick="deleteReferenceItem('${item.name}')" class="text-red-400 hover:text-red-300">
                    Delete
                </button>
            </td>
        `;
        referenceListTable.appendChild(row);
    });
}

// Calorie limit functions
function toggleCalorieLimitEdit() {
    calorieLimitDisplay.classList.add('hidden');
    calorieLimitEdit.classList.remove('hidden');
    calorieLimitInput.value = dailyCalorieGoal;
}

function saveCalorieLimit() {
    const newLimit = parseInt(calorieLimitInput.value);
    if (isNaN(newLimit) || newLimit <= 0) {
        alert('Please enter a valid calorie limit');
        return;
    }
    
    dailyCalorieGoal = newLimit;
    updateCalorieLimitDisplay();
    saveData();
    updateUI();
}

function cancelCalorieLimitEdit() {
    calorieLimitDisplay.classList.remove('hidden');
    calorieLimitEdit.classList.add('hidden');
}

function updateCalorieLimitDisplay() {
    dailyCalorieLimitElement.textContent = dailyCalorieGoal;
}

// Event Listeners
foodEntryForm.addEventListener('submit', addFoodEntry);

// Handle new item input
foodItemInput.addEventListener('input', function() {
    const inputValue = this.value.trim();
    if (!inputValue) {
        newItemFields.classList.add('hidden');
        return;
    }

    const isNewItem = !referenceList.some(item => 
        item.name.toLowerCase() === inputValue.toLowerCase()
    );
    newItemFields.classList.toggle('hidden', !isNewItem);
});

// Initialize app
loadData();

// Reload app function
function reloadApp() {
    window.location.reload();
} 