document.addEventListener("DOMContentLoaded", function () {
  const app = document.getElementById("app");

  // Check if the URL contains the "clear" query parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("clear") === "true") {
    localStorage.clear(); // Clear all stored data
    window.history.replaceState({}, document.title, window.location.pathname); // Clean the URL
  }

  // Add a persistent "Start Over" button
  const resetButton = document.createElement("button");
resetButton.textContent = "Start Over";
resetButton.style.marginBottom = "20px";
resetButton.onclick = () => {
    // Preserve meal history - only clear preferences and current selections
    const mealHistory = localStorage.getItem("mealHistory");
    localStorage.clear();
    if (mealHistory) {
      localStorage.setItem("mealHistory", mealHistory);
    }
    window.location.href = "index.html"; // Redirect to the home page
};
app.appendChild(resetButton);

  // Check preferences and meal phase
  const userPreferences = JSON.parse(localStorage.getItem("userPreferences"));
  const currentMeal = localStorage.getItem("currentMeal") || "form";
  const selectedFoods = JSON.parse(localStorage.getItem("selectedFoods")) || {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  if (currentMeal === "form") {
    renderForm();
  } else if (currentMeal === "summary") {
    renderSummary(selectedFoods);
  } else {
    renderMealSelection(currentMeal, selectedFoods, userPreferences);
  }
});

/**
 * Renders the initial form for user preferences
 */
function renderForm() {
  fetch("page1.json")
    .then((response) => response.json())
    .then((config) => {
      const app = document.getElementById("app");

      const form = document.createElement("form");
      form.id = "userForm";

      config.form.fields.forEach((field) => {
        const container = document.createElement("div");

        const label = document.createElement("label");
        label.textContent = field.label;

        const input =
          field.type === "select"
            ? document.createElement("select")
            : document.createElement("input");

        input.id = field.id;
        input.type = field.type || "text";

        if (field.type === "select") {
          field.options.forEach((option) => {
            const opt = document.createElement("option");
            opt.value = option.value;
            opt.textContent = option.label;
            input.appendChild(opt);
          });
        }

        if (field.id === "allergies") {
          input.addEventListener("change", () => {
            const allergyDropdown = document.getElementById("allergyTags");
            allergyDropdown.style.display =
              input.value === "yes" ? "block" : "none";
          });
        }

        container.appendChild(label);
        container.appendChild(input);
        form.appendChild(container);
      });

      // Allergies dropdown (hidden initially)
      const allergyDropdownContainer = document.createElement("div");
      allergyDropdownContainer.style.display = "none";
      allergyDropdownContainer.id = "allergyTags";

      const allergyLabel = document.createElement("label");
      allergyLabel.textContent = "Specify Allergy Type";

      const allergyDropdown = document.createElement("select");
      ["GF", "VG", "VN", "PK"].forEach((tag) => {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        allergyDropdown.appendChild(opt);
      });

      allergyDropdownContainer.appendChild(allergyLabel);
      allergyDropdownContainer.appendChild(allergyDropdown);
      form.appendChild(allergyDropdownContainer);

      const submitButton = document.createElement("button");
      submitButton.type = "button";
      submitButton.textContent = "Submit";
      submitButton.onclick = () => handleFormSubmit(config);
      form.appendChild(submitButton);

      app.appendChild(form);
    })
    .catch((error) => {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = "<p style='color: #8B2332; padding: 20px;'>Error loading form configuration. Please refresh the page.</p>";
      }
    });
}

/**
 * Handles submission of the initial form
 */
function handleFormSubmit(config) {
  const formData = config.form.fields.reduce((acc, field) => {
    acc[field.id] = document.getElementById(field.id).value;
    return acc;
  }, {});

  // Add allergy tag if applicable
  const allergies = document.getElementById("allergies").value;
  if (allergies === "yes") {
    formData.allergyTags = document.getElementById("allergyTags").querySelector("select").value;
  }

  // Retrieve goals from the nutrition section of page1.json
  const dietPlan = formData.dietPlan;
  if (dietPlan && config.nutrition[dietPlan]) {
    formData.goals = config.nutrition[dietPlan].daily;
  }

  localStorage.setItem("userPreferences", JSON.stringify(formData));
  localStorage.setItem("currentMeal", "breakfast");

  window.location.reload(); // Refresh to start with breakfast selection
}

/**
 * Renders the food selection form for the current meal with a location filter
 */
function renderMealSelection(currentMeal, selectedFoods, userPreferences) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  // Add "Start Over" button
  const resetButton = document.createElement("button");
  resetButton.textContent = "Start Over";
  resetButton.style.marginBottom = "20px";
  resetButton.onclick = () => {
    // Preserve meal history - only clear preferences and current selections
    const mealHistory = localStorage.getItem("mealHistory");
    localStorage.clear();
    if (mealHistory) {
      localStorage.setItem("mealHistory", mealHistory);
    }
    window.location.href = "index.html";
  };
  app.appendChild(resetButton);

  // Title for the current meal
  const title = document.createElement("h1");
  title.textContent = `Select Foods for ${capitalize(currentMeal)}`;
  app.appendChild(title);

  fetch("foods.json")
    .then((response) => response.json())
    .then((foods) => {
      // Filter foods based on meal
      const mealFoods = foods.filter((food) =>
        food.meal.some((meal) => meal.toLowerCase() === currentMeal)
      );

      const allergyTag = userPreferences.allergyTags;
      // Store the original filtered foods (by meal and allergy) - never overwrite this
      const allFilteredFoods = allergyTag
        ? mealFoods.filter((food) => food.tags.includes(allergyTag))
        : mealFoods;

      // Get unique dining hall locations for the current meal
      const locations = [
        ...new Set(allFilteredFoods.flatMap((food) => food.dining_halls)),
      ];

      // Create filter bar
      const filterBar = document.createElement("div");
      filterBar.classList.add("filter-bar");

      // Location filter
      const locationFilterLabel = document.createElement("label");
      locationFilterLabel.textContent = "Filter by Location: ";
      const locationFilter = document.createElement("select");
      locationFilter.id = "locationFilter";

      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "All Locations";
      locationFilter.appendChild(allOption);

      locations.forEach((location) => {
        const option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
      });

      filterBar.appendChild(locationFilterLabel);
      filterBar.appendChild(locationFilter);
      app.appendChild(filterBar);

      const form = document.createElement("form");
      form.id = "mealForm";

      const foodGrid = document.createElement("div");
      foodGrid.classList.add("food-grid");
      form.appendChild(foodGrid);

      const renderFoods = (selectedLocation) => {
        foodGrid.innerHTML = ""; // Clear current food grid
        
        // Start with all filtered foods (by meal and allergy)
        const displayedFoods = selectedLocation
          ? allFilteredFoods.filter((food) =>
              food.dining_halls.includes(selectedLocation)
            )
          : allFilteredFoods;

        displayedFoods.forEach((food) => {
          const card = createFoodCard(food);
          foodGrid.appendChild(card);
        });
      };

      renderFoods("");

      locationFilter.addEventListener("change", (e) => {
        renderFoods(e.target.value);
      });

      const submitButton = document.createElement("button");
      submitButton.type = "button";
      submitButton.textContent = `Submit ${capitalize(currentMeal)} Selection`;
      submitButton.onclick = () => {
        // Get currently displayed foods for submission
        const locationValue = locationFilter.value;
        const foodsForSubmission = locationValue
          ? allFilteredFoods.filter((food) =>
              food.dining_halls.includes(locationValue)
            )
          : allFilteredFoods;
        
        handleMealSubmit(currentMeal, selectedFoods, foodsForSubmission);
      };

      form.appendChild(submitButton);
      app.appendChild(form);
    })
    .catch((error) => {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = "<p style='color: #8B2332; padding: 20px;'>Error loading food data. Please refresh the page.</p>";
      }
    });
}

/**
 * Handles submission of meal selection
 */
function handleMealSubmit(currentMeal, selectedFoods, filteredFoods) {
  const selectedForMeal = filteredFoods
    .filter((food) => {
      const checkboxId = `food-${food.food.replace(/\s+/g, '-')}`;
      const checkbox = document.getElementById(checkboxId);
      return checkbox && checkbox.checked;
    })
    .map((food) => food.food);

  selectedFoods[currentMeal] = selectedForMeal;
  localStorage.setItem("selectedFoods", JSON.stringify(selectedFoods));

  if (currentMeal === "breakfast") {
    localStorage.setItem("currentMeal", "lunch");
  } else if (currentMeal === "lunch") {
    localStorage.setItem("currentMeal", "dinner");
  } else if (currentMeal === "dinner") {
    localStorage.setItem("currentMeal", "summary");
  }

  window.location.reload(); // Refresh the page to load the next meal
}


function renderSummary(selectedFoods) {
  const app = document.getElementById("app");
  const content = document.createElement("div");
  content.innerHTML = "<h1>Your Food Selections and Macros</h1>";
  app.appendChild(content);

  // Add action buttons
  const actionButtons = document.createElement("div");
  actionButtons.classList.add("action-buttons");
  actionButtons.innerHTML = `
    <button id="saveMealBtn" class="action-btn">Save Meal Plan</button>
    <button id="viewHistoryBtn" class="action-btn">View History</button>
    <button id="clearHistoryBtn" class="action-btn">Clear History</button>
  `;
  app.appendChild(actionButtons);

  fetch("foods.json")
    .then((response) => response.json())
    .then((foods) => {
      const userPreferences = JSON.parse(localStorage.getItem("userPreferences")) || {};
      const userGoals = userPreferences.goals || {};
      const dailyMacros = {
        calories: 0,
        fat: 0,
        cholesterol: 0,
        sodium: 0,
        carbohydrates: 0,
        protein: 0,
      };

      ["breakfast", "lunch", "dinner"].forEach((meal) => {
        const mealSection = document.createElement("div");
        mealSection.classList.add("meal-section");

        const mealTitle = document.createElement("h2");
        mealTitle.textContent = capitalize(meal);
        mealSection.appendChild(mealTitle);

        const mealFoods = foods.filter((food) =>
          selectedFoods[meal].includes(food.food)
        );

        const mealMacros = mealFoods.reduce(
          (totals, food) => {
            const macros = food.macros || {};
            totals.calories += macros.calories || 0;
            totals.fat += macros.fat || 0;
            totals.cholesterol += macros.cholesterol || 0;
            totals.sodium += macros.sodium || 0;
            totals.carbohydrates += macros.carbohydrates || 0;
            totals.protein += macros.protein || 0;
            return totals;
          },
          { calories: 0, fat: 0, cholesterol: 0, sodium: 0, carbohydrates: 0, protein: 0 }
        );

        dailyMacros.calories += mealMacros.calories;
        dailyMacros.fat += mealMacros.fat;
        dailyMacros.cholesterol += mealMacros.cholesterol;
        dailyMacros.sodium += mealMacros.sodium;
        dailyMacros.carbohydrates += mealMacros.carbohydrates;
        dailyMacros.protein += mealMacros.protein;

        const mealList = document.createElement("ul");
        mealFoods.forEach((food) => {
          const foodItem = document.createElement("li");
          foodItem.textContent = food.food;
          mealList.appendChild(foodItem);
        });

        const macroSummary = document.createElement("p");
        macroSummary.innerHTML = `
          <strong>Calories:</strong> ${Math.round(mealMacros.calories)}, 
          <strong>Fat:</strong> ${Math.round(mealMacros.fat)}g, 
          <strong>Cholesterol:</strong> ${Math.round(mealMacros.cholesterol)}mg, 
          <strong>Sodium:</strong> ${Math.round(mealMacros.sodium)}mg, 
          <strong>Carbs:</strong> ${Math.round(mealMacros.carbohydrates)}g, 
          <strong>Protein:</strong> ${Math.round(mealMacros.protein)}g
        `;
        mealSection.appendChild(mealList);
        mealSection.appendChild(macroSummary);
        app.appendChild(mealSection);
      });

      const dailySummary = document.createElement("div");
      dailySummary.innerHTML = `
        <h2>Daily Total Macros</h2>
        <p>
          <strong>Calories:</strong> ${Math.round(dailyMacros.calories)}, 
          <strong>Fat:</strong> ${Math.round(dailyMacros.fat)}g, 
          <strong>Cholesterol:</strong> ${Math.round(dailyMacros.cholesterol)}mg, 
          <strong>Sodium:</strong> ${Math.round(dailyMacros.sodium)}mg, 
          <strong>Carbs:</strong> ${Math.round(dailyMacros.carbohydrates)}g, 
          <strong>Protein:</strong> ${Math.round(dailyMacros.protein)}g
        </p>
      `;
      app.appendChild(dailySummary);

      fetch("tips.json")
        .then((response) => response.json())
        .then((tipsData) => {
          const comparisonSection = document.createElement("div");
          comparisonSection.innerHTML = "<h2>Comparison to Your Goals</h2>";
          app.appendChild(comparisonSection);

          const comparisonList = document.createElement("ul");
          let allGoalsMet = true;

          const tipsKey = userPreferences.dietPlan || "general_tips";
          const tipsCategory =
            tipsKey === "calorie" ? "calorie_deficit" : tipsKey;

          for (const key in dailyMacros) {
            const goalRange = userGoals[key];
            if (!goalRange) continue;

            const totalValue = Math.round(dailyMacros[key]);
            const minGoal = goalRange.min;
            const maxGoal = goalRange.max;

            let status;
            let progressPercent = 0;
            let isOverGoal = false;

            if (totalValue < minGoal) {
              status = `Short by ${minGoal - totalValue}`;
              allGoalsMet = false;
              progressPercent = (totalValue / minGoal) * 100;
            } else if (totalValue > maxGoal) {
              status = `Exceeded by ${totalValue - maxGoal}`;
              allGoalsMet = false;
              progressPercent = 100;
              isOverGoal = true;
            } else {
              status = "Met ✓";
              progressPercent = ((totalValue - minGoal) / (maxGoal - minGoal)) * 100;
            }

            const listItem = document.createElement("li");
            listItem.style.marginBottom = "15px";
            listItem.innerHTML = `
              <div class="goal-progress">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <strong>${capitalize(key)}:</strong>
                  <span>${totalValue} / ${minGoal}-${maxGoal}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${isOverGoal ? 'over-goal' : ''}" style="width: ${Math.min(progressPercent, 100)}%">
                    ${progressPercent.toFixed(0)}%
                  </div>
                </div>
                <small style="color: ${isOverGoal ? '#ff6b6b' : totalValue < minGoal ? '#ffa500' : '#4caf50'};">
                  ${status}
                </small>
              </div>
            `;
            comparisonList.appendChild(listItem);
          }

          comparisonSection.appendChild(comparisonList);

          // Overall goal status
          const overallStatus = document.createElement("p");
          overallStatus.innerHTML = `<strong>Overall Status:</strong> ${
            allGoalsMet
              ? "Congratulations! You met/exceeded all your goals!"
              : "You did not meet all your goals. Keep working at it!"
          }`;
          comparisonSection.appendChild(overallStatus);

          // Pick a tip
          let tipsList = allGoalsMet
            ? tipsData.nutritional_tips.general_tips
            : tipsData.nutritional_tips[tipsCategory];

          if (!Array.isArray(tipsList) || tipsList.length === 0) {
            // Fallback to general tips if no valid tips are found
            tipsList = tipsData.nutritional_tips.general_tips;
          }

          const randomTip =
            tipsList[Math.floor(Math.random() * tipsList.length)];

          const tipSection = document.createElement("div");
          tipSection.innerHTML = `
            <h3>Here's a Tip for You:</h3>
            <p>${randomTip}</p>
          `;
          app.appendChild(tipSection);

          // Add event listeners for action buttons
          setupActionButtons(selectedFoods, dailyMacros, foods, userPreferences);
        })
        .catch((error) => {
          // Tips loading failed, but continue without them
        });
    })
    .catch((error) => {
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = "<p style='color: #8B2332; padding: 20px;'>Error loading food data. Please refresh the page.</p>";
      }
    });
}

/**
 * Sets up event listeners for action buttons
 */
function setupActionButtons(selectedFoods, dailyMacros, foods, userPreferences) {
  const saveBtn = document.getElementById("saveMealBtn");
  const historyBtn = document.getElementById("viewHistoryBtn");
  const clearBtn = document.getElementById("clearHistoryBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveMealPlan(selectedFoods, dailyMacros));
  }

  if (historyBtn) {
    historyBtn.addEventListener("click", () => showMealHistory());
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => clearMealHistory());
  }
}

/**
 * Saves the current meal plan to history
 */
function saveMealPlan(selectedFoods, dailyMacros) {
  const mealHistory = JSON.parse(localStorage.getItem("mealHistory")) || [];
  const mealPlan = {
    date: new Date().toISOString(),
    foods: selectedFoods,
    macros: dailyMacros,
    timestamp: Date.now()
  };
  
  mealHistory.push(mealPlan);
  localStorage.setItem("mealHistory", JSON.stringify(mealHistory));
  
  alert("Meal plan saved successfully!");
}

/**
 * Clears all meal history
 */
function clearMealHistory() {
  if (confirm("Are you sure you want to clear all meal history? This action cannot be undone.")) {
    localStorage.removeItem("mealHistory");
    alert("Meal history cleared successfully!");
    
    // If viewing history modal, close it
    const modal = document.querySelector(".modal");
    if (modal) {
      document.body.removeChild(modal);
    }
  }
}

/**
 * Shows meal history modal
 */
function showMealHistory() {
  const mealHistory = JSON.parse(localStorage.getItem("mealHistory")) || [];
  
  if (mealHistory.length === 0) {
    alert("No meal history found. Save a meal plan first!");
    return;
  }
  
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2>Meal History</h2>
      <div class="history-list">
        ${mealHistory.reverse().map((plan, index) => `
          <div class="history-item">
            <h3>${new Date(plan.date).toLocaleDateString()}</h3>
            <p><strong>Calories:</strong> ${Math.round(plan.macros.calories)} | 
               <strong>Protein:</strong> ${Math.round(plan.macros.protein)}g | 
               <strong>Carbs:</strong> ${Math.round(plan.macros.carbohydrates)}g</p>
            <button class="view-details-btn" data-index="${mealHistory.length - 1 - index}">View Details</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector(".close-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelectorAll(".view-details-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-index"));
      const plan = mealHistory[mealHistory.length - 1 - index];
      alert(`Meal Plan Details:\n\nBreakfast: ${plan.foods.breakfast.join(", ")}\nLunch: ${plan.foods.lunch.join(", ")}\nDinner: ${plan.foods.dinner.join(", ")}`);
    });
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Creates a food card element
 */
function createFoodCard(food) {
  const card = document.createElement("div");
  card.classList.add("food-card");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `food-${food.food.replace(/\s+/g, '-')}`;
  checkbox.value = food.food;
  checkbox.name = "foodSelection";

  const label = document.createElement("label");
  label.setAttribute("for", checkbox.id);
  label.innerHTML = `
    <strong>${food.food}</strong>
    <p><em>${food.dining_halls.join(", ")}</em></p>
    <small>Cal: ${food.macros?.calories || 0} | Protein: ${food.macros?.protein || 0}g</small>
  `;

  card.appendChild(checkbox);
  card.appendChild(label);
  
  return card;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}