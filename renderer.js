// Initialize variables
let dailyCalorieGoal = 2000;
let foodEntries = [];
let referenceList = [];
let lastUsedDate = new Date().toISOString().split('T')[0]; // Initialize with today
let currentEditEntryId = null;
let currentEditReferenceName = null;

// DOM Elements
let foodEntryForm;
let foodEntriesTable;
let referenceListTable;
let totalCaloriesElement;
let remainingCaloriesElement;
let foodItemInput;
let foodItemsDatalist;
let newItemFields;
let caloriesPer100gInput;
let dailyCalorieLimitElement;
let calorieLimitInput;
let calorieLimitDisplay;
let calorieLimitEdit;
let toggleEntriesButton;
let entriesContent;
let dateInput;
let caloriesPreview;
let estimatedCalories;
let remainingCaloriesPreview;
let editAmountModal;
let editAmountInput;
let editReferenceModal;
let editReferenceNameInput;
let editReferenceCaloriesInput;

// Initialize collapsible sections
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  foodEntryForm = document.getElementById("foodEntryForm");
  foodEntriesTable = document.getElementById("foodEntries");
  referenceListTable = document.getElementById("referenceList");
  totalCaloriesElement = document.getElementById("totalCalories");
  remainingCaloriesElement = document.getElementById("remainingCalories");
  foodItemInput = document.getElementById("foodItem");
  foodItemsDatalist = document.getElementById("foodItems");
  newItemFields = document.getElementById("newItemFields");
  caloriesPer100gInput = document.getElementById("caloriesPer100g");
  dailyCalorieLimitElement = document.getElementById("dailyCalorieLimit");
  calorieLimitInput = document.getElementById("calorieLimitInput");
  calorieLimitDisplay = document.getElementById("calorieLimitDisplay");
  calorieLimitEdit = document.getElementById("calorieLimitEdit");
  toggleEntriesButton = document.getElementById("toggleEntries");
  entriesContent = document.getElementById("entriesContent");
  dateInput = document.getElementById("date");
  caloriesPreview = document.getElementById("caloriesPreview");
  estimatedCalories = document.getElementById("estimatedCalories");
  remainingCaloriesPreview = document.getElementById(
    "remainingCaloriesPreview"
  );
  editAmountModal = document.getElementById("editAmountModal");
  editAmountInput = document.getElementById("editAmountInput");
  editReferenceModal = document.getElementById("editReferenceModal");
  editReferenceNameInput = document.getElementById("editReferenceNameInput");
  editReferenceCaloriesInput = document.getElementById(
    "editReferenceCaloriesInput"
  );

  // Set initial state
  entriesContent.style.display = "block";
  toggleEntriesButton.querySelector(".toggle-icon").textContent = "▼";

  // Add click handler for toggle button
  toggleEntriesButton.addEventListener("click", () => {
    const isVisible = entriesContent.style.display !== "none";
    entriesContent.style.display = isVisible ? "none" : "block";
    toggleEntriesButton.querySelector(".toggle-icon").textContent = isVisible
      ? "▶"
      : "▼";
  });

  // Add event listeners for calorie calculation
  foodItemInput.addEventListener("input", calculateEstimatedCalories);
  document
    .getElementById("amount")
    .addEventListener("input", calculateEstimatedCalories);
  caloriesPer100gInput.addEventListener("input", calculateEstimatedCalories);
  dateInput.addEventListener("change", calculateEstimatedCalories);

  // Add event listener for Enter key in edit amount input
  editAmountInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      saveAmountEdit();
    } else if (e.key === "Escape") {
      closeEditAmountModal();
    }
  });

  // Add event listener for Enter key in edit reference name input
  editReferenceNameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      saveReferenceEdit();
    } else if (e.key === "Escape") {
      closeEditReferenceModal();
    }
  });

  // Add event listener for Enter key in edit reference calories input
  editReferenceCaloriesInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      saveReferenceEdit();
    } else if (e.key === "Escape") {
      closeEditReferenceModal();
    }
  });

  // Add event listener for food entry form
  foodEntryForm.addEventListener("submit", addFoodEntry);

  // Handle new item input
  foodItemInput.addEventListener("input", function () {
    const inputValue = this.value.trim();
    if (!inputValue) {
      newItemFields.classList.add("hidden");
      return;
    }

    const isNewItem = !referenceList.some(
      (item) => item.name.toLowerCase() === inputValue.toLowerCase()
    );
    newItemFields.classList.toggle("hidden", !isNewItem);
  });

  // Load initial data after all initialization is complete
  loadData();
});

// Load saved data
async function loadData() {
  try {
    if (!window.api) {
      throw new Error("API not available");
    }

    const data = await window.api.invoke("load-data");
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data received");
    }

    foodEntries = data.foodEntries || [];
    referenceList = data.referenceList || [];
    dailyCalorieGoal = data.dailyCalorieGoal || 2000;
    lastUsedDate = data.lastUsedDate || new Date().toISOString().split("T")[0];

    if (dateInput) {
      dateInput.value = lastUsedDate;
    }

    updateReferenceListUI();
    updateFoodItemsDatalist();
    updateUI();
    updateCalorieLimitDisplay();

    // Initialize all date sections as expanded
    // document.querySelectorAll(".date-section").forEach((section) => {
    //   // section.style.display = "contents";
    // });
  } catch (error) {
    alert("Failed to load data: " + error.message);
  }
}

// Save data
async function saveData() {
  try {
    if (!window.api) {
      throw new Error("API not available");
    }

    const data = {
      foodEntries: [...foodEntries],
      referenceList: [...referenceList],
      dailyCalorieGoal,
      lastUsedDate,
    };

    const result = await window.api.invoke("save-data", data);
    if (!result) {
      throw new Error("Save operation failed");
    }

    // Verify by loading the data back
    const loadedData = await window.api.invoke("load-data");

    // Verify data integrity
    const isVerified =
      loadedData.foodEntries.length === data.foodEntries.length &&
      loadedData.referenceList.length === data.referenceList.length &&
      loadedData.dailyCalorieGoal === data.dailyCalorieGoal &&
      loadedData.lastUsedDate === data.lastUsedDate;

    if (!isVerified) {
      throw new Error("Data verification failed");
    }

    return true;
  } catch (error) {
    alert("Failed to save data: " + error.message);
    return false;
  }
}

// Update food items datalist
function updateFoodItemsDatalist() {
  if (!foodItemsDatalist) return;

  foodItemsDatalist.innerHTML = "";
  referenceList.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    foodItemsDatalist.appendChild(option);
  });
}

// Calculate estimated calories
function calculateEstimatedCalories() {
  if (
    !foodItemInput ||
    !caloriesPreview ||
    !estimatedCalories ||
    !remainingCaloriesPreview
  )
    return;

  const foodItem = foodItemInput.value.trim();
  const amount = parseInt(document.getElementById("amount").value) || 0;
  const date = dateInput.value || lastUsedDate;

  if (!foodItem || amount <= 0) {
    caloriesPreview.classList.add("hidden");
    return;
  }

  let caloriesPer100g;
  const referenceItem = referenceList.find(
    (item) => item.name.toLowerCase() === foodItem.toLowerCase()
  );

  if (referenceItem) {
    caloriesPer100g = referenceItem.caloriesPer100g;
  } else if (caloriesPer100gInput.value) {
    caloriesPer100g = parseInt(caloriesPer100gInput.value);
  } else {
    caloriesPreview.classList.add("hidden");
    return;
  }

  const estimatedTotal = Math.round((amount * caloriesPer100g) / 100);
  estimatedCalories.textContent = estimatedTotal;

  // Calculate remaining calories for the selected date, including the new entry
  const dateEntries = foodEntries.filter((entry) => entry.date === date);
  const dateTotal = dateEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const remaining = dailyCalorieGoal - (dateTotal + estimatedTotal);
  remainingCaloriesPreview.textContent = remaining;

  caloriesPreview.classList.remove("hidden");
}

// Update the addFoodEntry function to hide the preview after submission
async function addFoodEntry(event) {
  event.preventDefault();

  const foodItem = foodItemInput.value.trim();
  if (!foodItem) {
    alert("Please enter a food item");
    return;
  }

  const amount = parseInt(document.getElementById("amount").value);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  // Get date or use last used date
  let date = dateInput.value;
  if (!date) {
    date = lastUsedDate;
  }

  // Update last used date
  lastUsedDate = date;

  let calories;
  let referenceItem = referenceList.find(
    (item) => item.name.toLowerCase() === foodItem.toLowerCase()
  );

  if (!referenceItem) {
    const caloriesPer100g = parseInt(caloriesPer100gInput.value);
    if (isNaN(caloriesPer100g) || caloriesPer100g <= 0) {
      alert("Please enter valid calories per 100g for the new item");
      return;
    }

    referenceItem = {
      name: foodItem,
      caloriesPer100g: caloriesPer100g,
    };
    referenceList.push(referenceItem);
    updateReferenceListUI();
    updateFoodItemsDatalist();
  }

  calories = Math.round((amount * referenceItem.caloriesPer100g) / 100);

  const entry = {
    id: Date.now(),
    foodItem,
    amount,
    calories,
    date,
  };

  foodEntries.unshift(entry);

  // Save data and verify
  const saveResult = await saveData();
  if (!saveResult) {
    alert("Failed to save entry. Please try again.");
    foodEntries.pop(); // Remove the entry if save failed
    return;
  }

  updateUI();
  foodEntryForm.reset();
  // Keep the last used date in the input
  dateInput.value = lastUsedDate;
  newItemFields.classList.add("hidden");
  caloriesPreview.classList.add("hidden");
}

// Delete food entry
function deleteEntry(id) {
  foodEntries = foodEntries.filter((entry) => entry.id !== id);
  saveData();
  updateUI();
}

// Delete reference item
function deleteReferenceItem(name) {
  referenceList = referenceList.filter((item) => item.name !== name);
  saveData();
  updateReferenceListUI();
  updateFoodItemsDatalist();
}

// Update UI with current data
function updateUI() {
  if (!foodEntriesTable || !totalCaloriesElement || !remainingCaloriesElement)
    return;

  foodEntriesTable.innerHTML = "";

  // Get the currently selected date or use today
  const selectedDate =
    dateInput.value || new Date().toISOString().split("T")[0];
  const todaysEntries = foodEntries.filter(
    (entry) => entry.date === selectedDate
  );

  const totalCalories = todaysEntries.reduce(
    (sum, entry) => sum + entry.calories,
    0
  );
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
  const sortedDates = Object.keys(entriesByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  sortedDates.forEach((date) => {
    const entries = entriesByDate[date].sort((a, b) => b.id - a.id); // Sort by ID descending (newest first)
    const isSelectedDate = date === selectedDate;
    const isToday = date === new Date().toISOString().split("T")[0];

    // Calculate daily total
    const dailyTotal = entries.reduce((sum, entry) => sum + entry.calories, 0);

    // Add date header for all dates except the selected one
    if (!isSelectedDate) {
      const dateHeader = document.createElement("tr");
      const formattedDate = formatDate(date);
      dateHeader.innerHTML = `
        <td colspan="3" class="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 font-medium text-gray-200 border-b border-gray-600">
            <div class="flex items-center justify-between">
                <div class="flex items-right">
                    <span class="text-blue-400 mr-2">●</span>
                    ${formattedDate}
                    <span class="ml-4 text-gray-400 text-sm date-total" data-date="${date}">${dailyTotal} calories</span>
                </div>
                <button onclick="toggleDateSection('${date}')" class="text-gray-400 hover:text-gray-300 transition-colors duration-200">
                    <span class="toggle-date-icon" data-date="${date}">▶</span>
                </button>
            </div>
        </td>
    `;
      foodEntriesTable.appendChild(dateHeader);
    }

    // Create a container for the date's entries
    const dateContainer = document.createElement("tbody");
    dateContainer.id = `date-${date}`;
    dateContainer.className = "date-section";
    // Set initial display state based on whether it's today or not
    dateContainer.style.display =
      isToday || isSelectedDate ? "table-row-group" : "none";

    // Add entries for this date
    entries.forEach((entry) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-700 text-gray-300 group flex-row";
      row.innerHTML = `
        <td class="px-4 py-2 w-full">${entry.foodItem}</td>
        <td class="px-4 py-2 text-right">${entry.amount}g
            <button onclick="editAmount(${entry.id})" class="ml-2 text-blue-400 hover:text-blue-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Edit
            </button>
        </td>
        <td class="px-4 py-2 text-right">
            ${entry.calories}kcal
            <button onclick="deleteEntry(${entry.id})" class="ml-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Delete
            </button>
        </td>
    `;
      dateContainer.appendChild(row);
    });

    // Add daily total row with distinct styling
    const totalRow = document.createElement("tr");
    totalRow.className = "bg-gray-800/50 font-medium hover:bg-gray-700/50";
    totalRow.innerHTML = `
        <td colspan="2" class="px-4 py-2 text-right text-gray-400">Daily Total:</td>
        <td class="px-4 py-2 text-right text-blue-400">${dailyTotal}kcal</td>
    `;
    dateContainer.appendChild(totalRow);

    // Add the date container to the table
    foodEntriesTable.appendChild(dateContainer);
  });
}

// Edit amount functions
function editAmount(id) {
  const entry = foodEntries.find((e) => e.id === id);
  if (!entry) return;

  currentEditEntryId = id;
  editAmountInput.value = entry.amount;
  editAmountModal.classList.remove("hidden");
  editAmountInput.focus();
}

function closeEditAmountModal() {
  editAmountModal.classList.add("hidden");
  currentEditEntryId = null;
}

async function saveAmountEdit() {
  if (!currentEditEntryId) return;

  const entry = foodEntries.find((e) => e.id === currentEditEntryId);
  if (!entry) return;

  const amount = parseInt(editAmountInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  // Find the reference item to recalculate calories
  const referenceItem = referenceList.find(
    (item) => item.name.toLowerCase() === entry.foodItem.toLowerCase()
  );

  if (!referenceItem) {
    alert("Could not find reference item for recalculation");
    return;
  }

  // Update the entry
  entry.amount = amount;
  entry.calories = Math.round((amount * referenceItem.caloriesPer100g) / 100);

  // Save and update UI
  const saveResult = await saveData();
  if (!saveResult) {
    alert("Failed to save changes. Please try again.");
    return;
  }

  updateUI();
  closeEditAmountModal();
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const inputDate = new Date(dateString);
  inputDate.setHours(0, 0, 0, 0); // Reset time to start of day

  if (inputDate.getTime() === today.getTime()) {
    return "Today";
  } else if (inputDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

// Edit reference functions
function editReference(name) {
  const referenceItem = referenceList.find((item) => item.name === name);
  if (!referenceItem) return;

  currentEditReferenceName = name;
  editReferenceNameInput.value = referenceItem.name;
  editReferenceCaloriesInput.value = referenceItem.caloriesPer100g;
  editReferenceModal.classList.remove("hidden");
  editReferenceCaloriesInput.focus();
}

function closeEditReferenceModal() {
  editReferenceModal.classList.add("hidden");
  currentEditReferenceName = null;
}

async function saveReferenceEdit() {
  if (!currentEditReferenceName) return;

  const referenceItem = referenceList.find(
    (item) => item.name === currentEditReferenceName
  );
  if (!referenceItem) return;

  const newName = editReferenceNameInput.value.trim();
  const newCaloriesPer100g = parseInt(editReferenceCaloriesInput.value);

  if (!newName) {
    alert("Please enter a valid food item name");
    return;
  }

  if (isNaN(newCaloriesPer100g) || newCaloriesPer100g <= 0) {
    alert("Please enter valid calories per 100g");
    return;
  }

  // Check if the new name already exists (unless it's the same as current)
  if (
    newName !== currentEditReferenceName &&
    referenceList.some(
      (item) => item.name.toLowerCase() === newName.toLowerCase()
    )
  ) {
    alert("A food item with this name already exists");
    return;
  }

  const oldName = referenceItem.name;

  // Update the reference item
  referenceItem.name = newName;
  referenceItem.caloriesPer100g = newCaloriesPer100g;

  // Update all entries that use this reference item
  foodEntries.forEach((entry) => {
    if (entry.foodItem.toLowerCase() === oldName.toLowerCase()) {
      entry.foodItem = newName; // Update the food item name
      entry.calories = Math.round((entry.amount * newCaloriesPer100g) / 100); // Recalculate calories
    }
  });

  // Save and update UI
  const saveResult = await saveData();
  if (!saveResult) {
    alert("Failed to save changes. Please try again.");
    return;
  }

  updateUI();
  updateReferenceListUI();
  updateFoodItemsDatalist(); // Update the datalist for the food input
  closeEditReferenceModal();
}

// Update reference list UI
function updateReferenceListUI() {
  if (!referenceListTable) return;

  referenceListTable.innerHTML = "";

  // Sort reference list alphabetically by name
  const sortedReferenceList = [...referenceList].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  sortedReferenceList.forEach((item) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-700 text-gray-300";
    row.innerHTML = `
        <td class="px-4 py-2">${item.name}</td>
        <td class="px-4 py-2">${item.caloriesPer100g}</td>
        <td class="px-4 py-2">
            <button onclick="editReference('${item.name}')" class="text-blue-400 hover:text-blue-300 mr-2">
                Edit
            </button>
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
  calorieLimitDisplay.classList.add("hidden");
  calorieLimitEdit.classList.remove("hidden");
  calorieLimitInput.value = dailyCalorieGoal;
}

function saveCalorieLimit() {
  const newLimit = parseInt(calorieLimitInput.value);
  if (isNaN(newLimit) || newLimit <= 0) {
    alert("Please enter a valid calorie limit");
    return;
  }

  dailyCalorieGoal = newLimit;
  updateCalorieLimitDisplay();
  saveData();
  updateUI();
}

function cancelCalorieLimitEdit() {
  calorieLimitDisplay.classList.remove("hidden");
  calorieLimitEdit.classList.add("hidden");
}

function updateCalorieLimitDisplay() {
  if (!dailyCalorieLimitElement) return;
  dailyCalorieLimitElement.textContent = dailyCalorieGoal;
}

// Update toggle date section function
function toggleDateSection(date) {
  const container = document.getElementById(`date-${date}`);
  const icon = document.querySelector(`.toggle-date-icon[data-date="${date}"]`);
  const dateTotal = document.querySelector(`.date-total[data-date="${date}"]`);

  if (container && icon) {
    const isVisible = container.style.display !== "none";
    container.style.display = isVisible ? "none" : "table-row-group";
    icon.textContent = isVisible ? "▶" : "▼";

    // Update the date total visibility
    if (dateTotal) {
      dateTotal.style.display = isVisible ? "inline" : "none";
    }
  }
}

// Initialize app
loadData();

// Reload app function
function reloadApp() {
    window.location.reload();
} 