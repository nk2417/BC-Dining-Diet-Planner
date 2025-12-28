// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Fetch the configuration file
  fetch("page1.json")
    .then((response) => response.json())
    .then((config) => {
      initializeApp(config);
    })
    .catch((error) => {
      // Handle configuration loading errors gracefully
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = "<p>Error loading configuration. Please refresh the page.</p>";
      }
    });
});

function initializeApp(config) {
  const app = document.getElementById("app");

  // Create and append title
  const title = document.createElement("h1");
  title.textContent = config.title;
  app.appendChild(title);

  // Create form
  const form = document.createElement("form");

  // Create and add first two fields (mealTime and location)
  config.form.fields.slice(0, 2).forEach((field) => {
    const fieldContainer = createFormField(field);
    form.appendChild(fieldContainer);
  });

  // Create and add nutrition comparison chart
  const chartContainer = createNutritionComparisonChart(config.nutrition);
  form.appendChild(chartContainer);

  // Add diet selection field (third field)
  const dietField = createFormField(config.form.fields[2]);
  form.appendChild(dietField);

  // Add allergy field (fourth field)
  const allergyField = createFormField(config.form.fields[3]);
  form.appendChild(allergyField);

  // Create submit button
  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit";
  submitButton.type = "button";
  submitButton.addEventListener("click", handleSubmit);
  form.appendChild(submitButton);

  app.appendChild(form);

  // Add event listeners for conditional fields
  setupConditionalFields();
}

function createNutritionComparisonChart(nutritionData) {
  const container = document.createElement("div");
  container.className = "nutrition-comparison-chart";

  const title = document.createElement("h2");
  title.textContent = "Diet Plans Comparison";
  container.appendChild(title);

  const table = document.createElement("table");
  table.className = "comparison-table";

  // Create header row
  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  // Add empty cell for the nutrient column
  headerRow.insertCell().textContent = "Nutrient";

  // Add diet type headers
  Object.keys(nutritionData).forEach((dietType) => {
    if (dietType !== "other") {
      const th = document.createElement("th");
      th.textContent = nutritionData[dietType].name;
      headerRow.appendChild(th);
    }
  });

  // Create table body
  const tbody = table.createTBody();

  // Define which nutrients to show in comparison
  const nutrientsToShow = [
    { key: "calories", label: "Daily Calories" },
    { key: "protein", label: "Daily Protein" },
    { key: "fat", label: "Daily Fat" },
    { key: "carbs", label: "Daily Carbs" },
  ];

  // Add rows for each nutrient
  nutrientsToShow.forEach(({ key, label }) => {
    const row = tbody.insertRow();
    const nutrientCell = row.insertCell();
    nutrientCell.textContent = label;

    Object.keys(nutritionData).forEach((dietType) => {
      if (dietType !== "other") {
        const cell = row.insertCell();
        const nutrientData = nutritionData[dietType].daily[key];
        cell.textContent = `${nutrientData.min}-${nutrientData.max}${
          nutrientData.percentage ? ` (${nutrientData.percentage}%)` : ""
        }`;
      }
    });
  });

  container.appendChild(table);
  return container;
}

function createFormField(fieldConfig) {
  const container = document.createElement("div");

  // Create label
  const label = document.createElement("label");
  label.setAttribute("for", fieldConfig.id);
  label.textContent = fieldConfig.label;
  container.appendChild(label);

  // Create input element based on type
  if (fieldConfig.type === "select") {
    const select = document.createElement("select");
    select.id = fieldConfig.id;

    fieldConfig.options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      select.appendChild(optionElement);
    });

    container.appendChild(select);

    // Add conditional field if specified
    if (fieldConfig.hasConditionalField) {
      const conditionalContainer = document.createElement("div");
      conditionalContainer.id = `${fieldConfig.id}Conditional`;
      conditionalContainer.style.display = "none";

      // For allergies, create an input and button container
      if (fieldConfig.id === "allergies") {
        const inputContainer = document.createElement("div");
        inputContainer.className = "allergy-input-container";

        const input = document.createElement("input");
        input.type = fieldConfig.conditionalField.type;
        input.id = fieldConfig.conditionalField.id;
        input.placeholder = fieldConfig.conditionalField.placeholder;

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = "Add Allergy";
        addButton.onclick = addAllergy;

        const allergyList = document.createElement("div");
        allergyList.id = "allergyList";
        allergyList.className = "allergy-list";

        inputContainer.appendChild(input);
        inputContainer.appendChild(addButton);
        conditionalContainer.appendChild(inputContainer);
        conditionalContainer.appendChild(allergyList);
      } else {
        const input = document.createElement("input");
        input.type = fieldConfig.conditionalField.type;
        input.id = fieldConfig.conditionalField.id;
        input.placeholder = fieldConfig.conditionalField.placeholder;
        conditionalContainer.appendChild(input);
      }

      container.appendChild(conditionalContainer);
    }
  }

  return container;
}

function setupConditionalFields() {
  const dietPlanSelect = document.getElementById("dietPlan");
  const otherDietContainer = document.getElementById("dietPlanConditional");
  const allergiesSelect = document.getElementById("allergies");
  const allergiesContainer = document.getElementById("allergiesConditional");

  if (dietPlanSelect && otherDietContainer) {
    dietPlanSelect.addEventListener("change", () => {
      otherDietContainer.style.display =
        dietPlanSelect.value === "other" ? "block" : "none";
    });
  }

  if (allergiesSelect && allergiesContainer) {
    allergiesSelect.addEventListener("change", () => {
      allergiesContainer.style.display =
        allergiesSelect.value === "yes" ? "block" : "none";
    });
  }
}

function addAllergy() {
  const allergyInput = document.getElementById("allergyInput");
  const allergyList = document.getElementById("allergyList");

  if (allergyInput.value.trim() !== "") {
    const allergyItem = document.createElement("div");
    allergyItem.className = "allergy-item";

    const allergyText = document.createElement("span");
    allergyText.textContent = allergyInput.value.trim();

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.onclick = function () {
      allergyItem.remove();
    };

    allergyItem.appendChild(allergyText);
    allergyItem.appendChild(removeButton);
    allergyList.appendChild(allergyItem);

    allergyInput.value = "";
  }
}

function handleSubmit() {
  const allergies = Array.from(
    document.querySelectorAll("#allergyList .allergy-item span")
  ).map((item) => item.textContent);

  const formData = {
    mealTime: document.getElementById("mealTime").value,
    location: document.getElementById("location").value,
    allergies: allergies,
    dietPlan: document.getElementById("dietPlan").value,
    otherDiet:
      document.getElementById("dietPlan").value === "other"
        ? document.getElementById("otherDietText").value
        : "",
  };

  localStorage.setItem("userPreferences", JSON.stringify(formData));

  // Navigate to the new page
  window.location.href = "index.html";
}
