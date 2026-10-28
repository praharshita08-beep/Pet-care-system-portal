"use strict";

/* ----------------------------------
   PAWCARE PET CARE SERVICES PORTAL
---------------------------------- */

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];


/* PET TYPES */

const petTypes = [
    "Dog",
    "Cat",
    "Rabbit",
    "Hamster",
    "Bird",
    "Turtle",
    "Fish",
    "Other"
];

$$("select.pet-type").forEach(select => {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select pet type";
    select.appendChild(placeholder);

    petTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });

    if (select.id === "adopterPetType") {
        const option = document.createElement("option");
        option.value = "Open to options";
        option.textContent = "Open to options";
        select.appendChild(option);
    }
});


/* GENERAL HELPERS */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function formatDate(value) {
    if (!value) return "Date not selected";

    const date = new Date(value + "T12:00:00");

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* MOBILE NAVIGATION */

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");

menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");

    const isOpen = mainNav.classList.contains("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );
});

$$("a", mainNav).forEach(link => {
    link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});


/* PAGE SETUP */

$("#currentYear").textContent = new Date().getFullYear();

const today = getLocalDate();

$("#healthDate").value = today;
$("#healthDate").max = today;
$("#bookingDate").min = today;


/* ----------------------------------
   1. HEALTH AND VACCINATION TRACKER
---------------------------------- */

const HEALTH_STORAGE_KEY = "pawcare-health-records";

function getHealthRecords() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(HEALTH_STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not load health records:", error);
        return [];
    }
}

function saveHealthRecords(records) {
    try {
        localStorage.setItem(
            HEALTH_STORAGE_KEY,
            JSON.stringify(records)
        );

        return true;
    } catch (error) {
        showToast("Unable to save records in this browser.");
        return false;
    }
}

function renderHealthRecords() {
    const records = getHealthRecords();
    const list = $("#healthRecordsList");

    $("#healthRecordCount").textContent =
        `${records.length} ${records.length === 1 ? "record" : "records"}`;

    if (records.length === 0) {
        list.innerHTML = `
            <p class="muted-text">
                No records saved yet. Add your first health record above.
            </p>
        `;

        return;
    }

    list.innerHTML = records.slice().reverse().map(record => `
        <article class="record-item">
            <div>
                <strong>
                    ${escapeHTML(record.petName)} ·
                    ${escapeHTML(record.recordType)}
                </strong>

                <small>
                    ${escapeHTML(record.petType)} ·
                    ${escapeHTML(formatDate(record.date))}
                </small>

                ${
                    record.details
                        ? `<small>${escapeHTML(record.details)}</small>`
                        : ""
                }
            </div>

            <button
                type="button"
                class="record-delete"
                data-delete-record="${escapeHTML(record.id)}"
            >
                Delete
            </button>
        </article>
    `).join("");
}

$("#healthForm").addEventListener("submit", event => {
    event.preventDefault();

    const record = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        petName: $("#healthPetName").value.trim(),
        petType: $("#healthPetType").value,
        recordType: $("#healthRecordType").value,
        date: $("#healthDate").value,
        details: $("#healthDetails").value.trim()
    };

    if (!record.petName || !record.petType || !record.date) {
        showToast("Please complete the required fields.");
        return;
    }

    const records = getHealthRecords();
    records.push(record);

    if (saveHealthRecords(records)) {
        renderHealthRecords();

        $("#healthDetails").value = "";

        showToast("Health record saved successfully.");
    }
});

$("#healthRecordsList").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-record]");

    if (!button) return;

    const id = button.dataset.deleteRecord;

    const updatedRecords = getHealthRecords().filter(
        record => record.id !== id
    );

    saveHealthRecords(updatedRecords);
    renderHealthRecords();

    showToast("Health record deleted.");
});

$("#clearHealthRecords").addEventListener("click", () => {
    const records = getHealthRecords();

    if (!records.length) {
        showToast("There are no records to clear.");
        return;
    }

    if (confirm("Are you sure you want to clear all health records?")) {
        if (saveHealthRecords([])) {
            renderHealthRecords();
            showToast("All health records cleared.");
        }
    }
});

renderHealthRecords();


/* ----------------------------------
   2. FOOD AND NUTRITION PLANNER
---------------------------------- */

$("#nutritionForm").addEventListener("submit", event => {
    event.preventDefault();

    const petName = $("#nutritionPetName").value.trim();
    const petType = $("#nutritionPetType").value;
    const food = $("#nutritionFood").value.trim();
    const meals = Number($("#nutritionMeals").value);
    const notes = $("#nutritionNotes").value.trim();

    if (!petName || !petType || !food) {
        showToast("Please complete the nutrition form.");
        return;
    }

    const mealTimes = {
        1: ["Daily Meal"],
        2: ["Morning", "Evening"],
        3: ["Morning", "Midday", "Evening"],
        4: ["Morning", "Midday", "Afternoon", "Evening"]
    };

    const times = mealTimes[meals] || mealTimes[2];

    const checklist = times.map(time => `
        <div class="meal-row">
            <span>${escapeHTML(time)}</span>

            <label>
                <input type="checkbox">
                Done
            </label>
        </div>
    `).join("");

    $("#nutritionResult").innerHTML = `
        <h4>${escapeHTML(petName)}'s Feeding Checklist</h4>

        <p>
            <strong>Pet:</strong> ${escapeHTML(petType)}<br>
            <strong>Food:</strong> ${escapeHTML(food)}
        </p>

        ${checklist}

        ${
            notes
                ? `<p><strong>Notes:</strong> ${escapeHTML(notes)}</p>`
                : ""
        }

        <p class="small-note">
            Follow a feeding routine suitable for your pet. This checklist
            does not calculate food portions or replace veterinary advice.
        </p>
    `;

    showToast("Feeding checklist created.");
});


/* ----------------------------------
   3. GROOMING AND HYGIENE CHECKLIST
---------------------------------- */

function updateGroomingProgress() {
    const tasks = $$(".groom-task");
    const completed = tasks.filter(task => task.checked).length;

    const total = tasks.length;

    const percentage = total
        ? Math.round((completed / total) * 100)
        : 0;

    $("#groomingProgressText").textContent =
        `${completed} of ${total} completed`;

    $("#groomingProgressPercent").textContent =
        `${percentage}%`;

    $("#groomingProgressBar").style.width =
        `${percentage}%`;
}

$("#groomingTasks").addEventListener("change", updateGroomingProgress);

$("#resetGrooming").addEventListener("click", () => {
    $$(".groom-task").forEach(task => {
        task.checked = false;
    });

    updateGroomingProgress();

    showToast("Grooming checklist reset.");
});

updateGroomingProgress();


/* ----------------------------------
   4. TRAINING AND EXERCISE PLANNER
---------------------------------- */

const activityIdeas = {
    Movement: [
        "Start with a gentle warm-up.",
        "Choose movement or play suitable for your pet.",
        "Finish with rest and an opportunity to drink water."
    ],

    Enrichment: [
        "Offer a safe, species-appropriate enrichment activity.",
        "Let your pet explore at their own pace.",
        "Finish before your pet becomes tired or frustrated."
    ],

    Training: [
        "Choose one small training goal.",
        "Use gentle, reward-based methods.",
        "Finish on a positive note."
    ],

    Calm: [
        "Prepare a quiet and comfortable space.",
        "Allow your pet to rest or interact by choice.",
        "Give your pet space if they seem uncomfortable."
    ]
};

$("#trainingForm").addEventListener("submit", event => {
    event.preventDefault();

    const petName = $("#trainingPetName").value.trim();
    const petType = $("#trainingPetType").value;
    const focus = $("#trainingFocus").value;
    const duration = $("#trainingDuration").value;

    if (!petName || !petType) {
        showToast("Please enter your pet's name and type.");
        return;
    }

    const ideas = activityIdeas[focus] || activityIdeas.Movement;

    const steps = ideas.map((idea, index) => `
        <p>
            <strong>Step ${index + 1}:</strong>
            ${escapeHTML(idea)}
        </p>
    `).join("");

    $("#trainingResult").innerHTML = `
        <h4>${escapeHTML(petName)}'s Activity Session</h4>

        <p>
            <strong>Pet type:</strong> ${escapeHTML(petType)}<br>
            <strong>Focus:</strong> ${escapeHTML(focus)}<br>
            <strong>Time available:</strong> ${escapeHTML(duration)} minutes
        </p>

        ${steps}

        <p class="small-note">
            Adapt the activities to your pet's needs and comfort.
        </p>
    `;

    showToast("Activity session created.");
});


/* ----------------------------------
   5. ADOPTION AND RESCUE CENTRE
---------------------------------- */

const adoptionWrap = $("#adoptionFormWrap");

$("#openAdoptionForm").addEventListener("click", () => {
    adoptionWrap.hidden = false;

    adoptionWrap.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

$("#closeAdoptionForm").addEventListener("click", () => {
    adoptionWrap.hidden = true;
});

$("#adoptionForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#adopterName").value.trim();
    const petType = $("#adopterPetType").value;
    const notes = $("#adoptionNotes").value.trim();
    const isReady = $("#adoptionReady").checked;

    if (!name || !petType || !isReady) {
        showToast("Please complete the enquiry checklist.");
        return;
    }

    $("#adoptionResult").innerHTML = `
        <h4>Enquiry Checklist Prepared!</h4>

        <p>
            Thank you, ${escapeHTML(name)}.
        </p>

        <p>
            <strong>Pet type:</strong> ${escapeHTML(petType)}
        </p>

        ${
            notes
                ? `<p><strong>Your notes:</strong> ${escapeHTML(notes)}</p>`
                : ""
        }

        <p>
            Next, contact a reputable local rescue centre and discuss
            suitable matches, veterinary history and adoption requirements.
        </p>

        <p class="small-note">
            This is a demo checklist. No adoption application has been sent.
        </p>
    `;

    showToast("Adoption enquiry checklist prepared.");
});


/* ----------------------------------
   BOOKING FORM
---------------------------------- */

// Fill in the service when the user clicks a service link.
$$("[data-service]").forEach(link => {
    link.addEventListener("click", () => {
        $("#bookingService").value = link.dataset.service;
    });
});

$("#bookingForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#bookingName").value.trim();
    const email = $("#bookingEmail").value.trim();
    const petName = $("#bookingPetName").value.trim();
    const petType = $("#bookingPetType").value;
    const service = $("#bookingService").value;
    const date = $("#bookingDate").value;
    const notes = $("#bookingNotes").value.trim();

    if (!name || !email || !petName || !petType || !service) {
        showToast("Please complete all required booking fields.");
        return;
    }

    $("#bookingConfirmation").hidden = false;

    $("#bookingConfirmation").innerHTML = `
        <h4>Service Request Prepared!</h4>

        <p>Thank you, ${escapeHTML(name)}.</p>

        <p>
            <strong>Email:</strong> ${escapeHTML(email)}<br>
            <strong>Pet:</strong> ${escapeHTML(petName)}<br>
            <strong>Pet Type:</strong> ${escapeHTML(petType)}<br>
            <strong>Service:</strong> ${escapeHTML(service)}
        </p>

        ${
            date
                ? `<p><strong>Preferred Date:</strong> ${escapeHTML(formatDate(date))}</p>`
                : ""
        }

        ${
            notes
                ? `<p><strong>Additional Information:</strong> ${escapeHTML(notes)}</p>`
                : ""
        }

        <p class="small-note">
            This is a demonstration only. Your request has not been sent
            to a service provider.
        </p>
    `;

    showToast("Demo service request prepared.");
});


/* ----------------------------------
   6. PET DEPARTMENTAL STORE
---------------------------------- */

const products = [
    {
        id: "food1",
        name: "Everyday Pet Food",
        category: "Food",
        price: 499,
        icon: "🥣",
        color: "#f5e3bd",
        description: "Sample pet food listing."
    },
    {
        id: "food2",
        name: "Treat Time Bites",
        category: "Food",
        price: 199,
        icon: "🦴",
        color: "#f1d7c7",
        description: "Example pet treat listing."
    },
    {
        id: "toy1",
        name: "Playtime Ball",
        category: "Toys",
        price: 149,
        icon: "🎾",
        color: "#dbeecf",
        description: "A sample toy for supervised play."
    },
    {
        id: "toy2",
        name: "Puzzle Toy",
        category: "Toys",
        price: 349,
        icon: "🧩",
        color: "#e9def4",
        description: "Example enrichment toy."
    },
    {
        id: "clothing1",
        name: "Cozy Pet Sweater",
        category: "Clothing",
        price: 599,
        icon: "🧥",
        color: "#dcecf2",
        description: "Example pet clothing."
    },
    {
        id: "clothing2",
        name: "Pet Bandana",
        category: "Clothing",
        price: 179,
        icon: "🎀",
        color: "#f7dfe1",
        description: "Example pet accessory."
    },
    {
        id: "hygiene1",
        name: "Gentle Care Kit",
        category: "Hygiene",
        price: 299,
        icon: "🧴",
        color: "#dcebe7",
        description: "Sample hygiene essentials."
    },
    {
        id: "hygiene2",
        name: "Cleaning Supplies",
        category: "Hygiene",
        price: 249,
        icon: "🫧",
        color: "#dce8f6",
        description: "Example cleaning supplies."
    },
    {
        id: "accessory1",
        name: "Food and Water Bowl",
        category: "Accessories",
        price: 229,
        icon: "🍽️",
        color: "#f4e4c8",
        description: "Everyday accessory example."
    },
    {
        id: "accessory2",
        name: "Travel Carrier",
        category: "Accessories",
        price: 899,
        icon: "🧺",
        color: "#e1e8d8",
        description: "Sample pet carrier."
    },
    {
        id: "accessory3",
        name: "Comfort Pet Bed",
        category: "Accessories",
        price: 799,
        icon: "🛏️",
        color: "#e9e1ee",
        description: "Example pet bed."
    },
    {
        id: "accessory4",
        name: "Water Bottle",
        category: "Accessories",
        price: 189,
        icon: "💧",
        color: "#d7edf3",
        description: "Sample hydration accessory."
    }
];

let currentCategory = "All";
const cart = new Map();

function rupees(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
}

function getFilteredProducts() {
    const query = $("#productSearch")
        .value
        .trim()
        .toLowerCase();

    const sortBy = $("#productSort").value;

    // Filter products by category and search text.
    const filtered = products.filter(product => {
        const categoryMatches =
            currentCategory === "All" ||
            product.category === currentCategory;

        const searchMatches =
            `${product.name} ${product.category} ${product.description}`
                .toLowerCase()
                .includes(query);

        return categoryMatches && searchMatches;
    });

    // Sort the filtered products.
    if (sortBy === "name-asc") {
        filtered.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    } else if (sortBy === "price-asc") {
        filtered.sort((a, b) =>
            a.price - b.price
        );
    } else if (sortBy === "price-desc") {
        filtered.sort((a, b) =>
            b.price - a.price
        );
    }

    return filtered;
}
function renderProducts() {
    const grid = $("#productGrid");
    const filtered = getFilteredProducts();

    if (!filtered.length) {
        grid.innerHTML = `
            <p class="muted-text">
                No products found. Try a different search.
            </p>
        `;

        return;
    }

    grid.innerHTML = filtered.map(product => `
        <article class="product-card">

            <div
                class="product-art"
                style="background:${product.color}"
            >
                ${product.icon}
            </div>

            <p class="product-category">
                ${escapeHTML(product.category)}
            </p>

            <h3>${escapeHTML(product.name)}</h3>

            <p>${escapeHTML(product.description)}</p>

            <div class="product-bottom">
                <span class="product-price">
                    ${rupees(product.price)}
                </span>

                <button
                    type="button"
                    class="add-cart"
                    data-add-product="${escapeHTML(product.id)}"
                >
                    + Add
                </button>
            </div>

        </article>
    `).join("");
}

function getCartCount() {
    let count = 0;

    cart.forEach(item => {
        count += item.quantity;
    });

    return count;
}

function getCartTotal() {
    let total = 0;

    cart.forEach(item => {
        total += item.product.price * item.quantity;
    });

    return total;
}

function renderCart() {
    $("#cartCount").textContent = getCartCount();

    $("#cartTotal").textContent = rupees(getCartTotal());

    $("#cartSubtotal").textContent = rupees(getCartTotal());

    const cartItems = $("#cartItems");

    if (cart.size === 0) {
        cartItems.innerHTML = `
            <p class="muted-text">
                Your bag is empty. Add some pet essentials!
            </p>
        `;

        return;
    }

    cartItems.innerHTML = [...cart.values()].map(item => `
        <div class="cart-line">

            <div>
                <strong>${escapeHTML(item.product.name)}</strong>
                <small>${rupees(item.product.price)} each</small>
            </div>

            <div class="cart-quantity">
                <button
                    type="button"
                    data-cart-change="${item.product.id}"
                    data-delta="-1"
                    aria-label="Remove one item"
                >−</button>

                <span>${item.quantity}</span>

                <button
                    type="button"
                    data-cart-change="${item.product.id}"
                    data-delta="1"
                    aria-label="Add one item"
                >+</button>
            </div>

            <strong>
                ${rupees(item.product.price * item.quantity)}
            </strong>

        </div>
    `).join("");
}


// Product category buttons
$$(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        currentCategory = button.dataset.category;

        $$(".filter-button").forEach(item => {
            item.classList.toggle("active", item === button);
        });

        renderProducts();
    });
});


// Product search
$("#productSearch").addEventListener("input", renderProducts);


// Add products to the cart
$("#productGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-add-product]");

    if (!button) return;

    const product = products.find(item =>
        item.id === button.dataset.addProduct
    );

    if (!product) return;

    const existing = cart.get(product.id);

    cart.set(product.id, {
        product,
        quantity: existing ? existing.quantity + 1 : 1
    });

    renderCart();

    showToast(`${product.name} added to your bag.`);
});


// Open shopping cart
$("#cartSummary").addEventListener("click", () => {
    $("#cartPanel").hidden = false;

    $("#cartPanel").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
});


// Close shopping cart
$("#closeCart").addEventListener("click", () => {
    $("#cartPanel").hidden = true;
});


// Change item quantities
$("#cartItems").addEventListener("click", event => {
    const button = event.target.closest("[data-cart-change]");

    if (!button) return;

    const id = button.dataset.cartChange;
    const item = cart.get(id);

    if (!item) return;

    const newQuantity =
        item.quantity + Number(button.dataset.delta);

    if (newQuantity <= 0) {
        cart.delete(id);
    } else {
        cart.set(id, {
            ...item,
            quantity: newQuantity
        });
    }

    renderCart();
});


// Clear shopping cart
$("#clearCart").addEventListener("click", () => {
    cart.clear();

    renderCart();

    showToast("Shopping bag cleared.");
});


// Display the initial product list and empty cart.
renderProducts();
renderCart();


/* ==================================
   SAVE NUTRITION PLANS
================================== */

const NUTRITION_STORAGE_KEY = "pawcare-saved-nutrition-plans";


// Read the saved plans.
function getSavedNutritionPlans() {
    try {
        const plans = JSON.parse(
            localStorage.getItem(NUTRITION_STORAGE_KEY) || "[]"
        );

        return Array.isArray(plans) ? plans : [];
    } catch (error) {
        console.error("Could not load nutrition plans:", error);
        return [];
    }
}


// Save the plans.
function saveNutritionPlans(plans) {
    try {
        localStorage.setItem(
            NUTRITION_STORAGE_KEY,
            JSON.stringify(plans)
        );

        return true;
    } catch (error) {
        showToast("Could not save nutrition plans in this browser.");
        return false;
    }
}


// Display all saved plans.
function renderSavedNutritionPlans() {
    const plans = getSavedNutritionPlans();
    const container = $("#savedNutritionPlans");

    $("#savedNutritionPlanCount").textContent =
        `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`;

    if (plans.length === 0) {
        container.innerHTML = `
            <p class="muted-text">
                No saved feeding plans yet.
                Create a plan using the form above.
            </p>
        `;
        return;
    }

    container.innerHTML = plans.slice().reverse().map(plan => {
        const mealRows = plan.mealChecks.map((completed, index) => `
            <div class="nutrition-plan-meal">
                <span>Meal ${index + 1}</span>

                <label>
                    <input
                        type="checkbox"
                        data-plan-id="${escapeHTML(plan.id)}"
                        data-meal-index="${index}"
                        ${completed ? "checked" : ""}
                    >
                    Completed
                </label>
            </div>
        `).join("");

        return `
            <article class="nutrition-plan-card">
                <h4>${escapeHTML(plan.petName)}'s Feeding Plan</h4>

                <p>
                    <strong>Pet:</strong> ${escapeHTML(plan.petType)}<br>
                    <strong>Food:</strong> ${escapeHTML(plan.food)}<br>
                    <strong>Created:</strong> ${escapeHTML(formatDate(plan.date))}
                </p>

                ${mealRows}

                ${
                    plan.notes
                        ? `<p><strong>Notes:</strong>
                            ${escapeHTML(plan.notes)}</p>`
                        : ""
                }

                <button
                    type="button"
                    class="button outline-button"
                    data-delete-nutrition="${escapeHTML(plan.id)}"
                >
                    Delete Plan
                </button>
            </article>
        `;
    }).join("");
}


// Whenever a nutrition plan is created, save a copy.
$("#nutritionForm").addEventListener("submit", event => {
    const petName = $("#nutritionPetName").value.trim();
    const petType = $("#nutritionPetType").value;
    const food = $("#nutritionFood").value.trim();
    const meals = Number($("#nutritionMeals").value);
    const notes = $("#nutritionNotes").value.trim();

    if (!petName || !petType || !food) {
        return;
    }

    const plans = getSavedNutritionPlans();

    const plan = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),

        petName: petName,
        petType: petType,
        food: food,
        meals: meals,
        notes: notes,
        date: getLocalDate(),
        mealChecks: Array.from(
            { length: meals },
            () => false
        )
    };

    plans.push(plan);

    if (saveNutritionPlans(plans)) {
        renderSavedNutritionPlans();
        showToast("Feeding plan saved!");
    }
});


// Save changes when a meal is marked completed.
$("#savedNutritionPlans").addEventListener("change", event => {
    const checkbox = event.target;

    if (!checkbox.matches("[data-plan-id]")) {
        return;
    }

    const planId = checkbox.dataset.planId;
    const mealIndex = Number(checkbox.dataset.mealIndex);

    const plans = getSavedNutritionPlans();

    const plan = plans.find(item => item.id === planId);

    if (!plan || !Number.isInteger(mealIndex)) {
        return;
    }

    plan.mealChecks[mealIndex] = checkbox.checked;

    saveNutritionPlans(plans);
});


// Delete a saved nutrition plan.
$("#savedNutritionPlans").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-nutrition]");

    if (!button) {
        return;
    }

    const confirmed = confirm(
        "Do you want to delete this feeding plan?"
    );

    if (!confirmed) {
        return;
    }

    const plans = getSavedNutritionPlans().filter(
        plan => plan.id !== button.dataset.deleteNutrition
    );

    if (saveNutritionPlans(plans)) {
        renderSavedNutritionPlans();
        showToast("Feeding plan deleted.");
    }
});
renderSavedNutritionPlans();


/* ==================================
   PET PROFILE MANAGEMENT
================================== */

const PET_PROFILE_STORAGE_KEY = "pawcare-pet-profiles";

const petTypeEmojis = {
    Dog: "🐶",
    Cat: "🐱",
    Rabbit: "🐰",
    Hamster: "🐹",
    Bird: "🐦",
    Turtle: "🐢",
    Fish: "🐠",
    Other: "🐾"
};


// Read saved profiles from this browser.
function getPetProfiles() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(PET_PROFILE_STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not load pet profiles:", error);
        return [];
    }
}


// Save profiles to this browser.
function savePetProfiles(profiles) {
    try {
        localStorage.setItem(
            PET_PROFILE_STORAGE_KEY,
            JSON.stringify(profiles)
        );

        return true;
    } catch (error) {
        showToast("Could not save profiles in this browser.");
        return false;
    }
}


// Reset the form and leave edit mode.
function resetPetProfileForm() {
    $("#petProfileForm").reset();

    $("#petProfileId").value = "";
    $("#petFormTitle").textContent = "Add a New Pet";
    $("#savePetButton").textContent = "Save Pet Profile +";
    $("#cancelPetEdit").hidden = true;
}


// Display all saved pet profiles.
function renderPetProfiles() {
    const profiles = getPetProfiles();
    const list = $("#petProfilesList");

    $("#petProfileCount").textContent =
        `${profiles.length} ${profiles.length === 1 ? "pet" : "pets"}`;

    if (profiles.length === 0) {
        list.innerHTML = `
            <p class="empty-pets">
                You haven't added any pets yet.
                Create your first pet profile using the form.
            </p>
        `;

        return;
    }

    list.innerHTML = profiles.map(pet => {
        const emoji = petTypeEmojis[pet.type] || "🐾";

        return `
            <article class="pet-profile-card">

                <div class="pet-profile-top">
                    <div class="pet-profile-avatar">${emoji}</div>

                    <div class="pet-profile-title">
                        <h4>${escapeHTML(pet.name)}</h4>
                        <p>${escapeHTML(pet.type)}</p>
                    </div>
                </div>

                <div class="pet-profile-details">

                    <p>
                        <strong>Breed:</strong>
                        ${escapeHTML(pet.breed || "Not specified")}
                    </p>

                    <p>
                        <strong>Date of Birth:</strong>
                        ${escapeHTML(pet.birthDate
                            ? formatDate(pet.birthDate)
                            : "Not specified")}
                    </p>

                    ${
                        pet.notes
                            ? `<p><strong>Notes:</strong> ${escapeHTML(pet.notes)}</p>`
                            : ""
                    }

                </div>

                <div class="pet-profile-actions">

                    <button
                        type="button"
                        data-use-pet="${escapeHTML(pet.id)}"
                    >
                        Use in Forms
                    </button>

                    <button
                        type="button"
                        data-edit-pet="${escapeHTML(pet.id)}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-pet-button"
                        data-delete-pet="${escapeHTML(pet.id)}"
                    >
                        Delete
                    </button>

                </div>

            </article>
        `;
    }).join("");
}


// Add a new profile or update an existing one.
$("#petProfileForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = $("#petProfileId").value;

    const profile = {
        id: id || (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 10)
        ),

        name: $("#profilePetName").value.trim(),
        type: $("#profilePetType").value,
        breed: $("#profilePetBreed").value.trim(),
        birthDate: $("#profilePetBirthDate").value,
        notes: $("#profilePetNotes").value.trim()
    };

    if (!profile.name || !profile.type) {
        showToast("Please enter a pet name and type.");
        return;
    }

    if (
        profile.birthDate &&
        profile.birthDate > getLocalDate()
    ) {
        showToast("Date of birth cannot be in the future.");
        return;
    }

    const profiles = getPetProfiles();

    let updatedProfiles;

    if (id) {
        updatedProfiles = profiles.map(pet =>
            pet.id === id ? profile : pet
        );
    } else {
        updatedProfiles = [...profiles, profile];
    }

    if (savePetProfiles(updatedProfiles)) {
        renderPetProfiles();
        resetPetProfileForm();

        showToast(
            id
                ? "Pet profile updated!"
                : "Pet profile added!"
        );
    }
});


// Handle Edit, Delete and Use in Forms buttons.
$("#petProfilesList").addEventListener("click", event => {

    const editButton = event.target.closest("[data-edit-pet]");
    const deleteButton = event.target.closest("[data-delete-pet]");
    const useButton = event.target.closest("[data-use-pet]");

    const profiles = getPetProfiles();

    // EDIT A PROFILE
    if (editButton) {
        const pet = profiles.find(
            item => item.id === editButton.dataset.editPet
        );

        if (!pet) return;

        $("#petProfileId").value = pet.id;
        $("#profilePetName").value = pet.name;
        $("#profilePetType").value = pet.type;
        $("#profilePetBreed").value = pet.breed || "";
        $("#profilePetBirthDate").value = pet.birthDate || "";
        $("#profilePetNotes").value = pet.notes || "";

        $("#petFormTitle").textContent = "Edit Pet Profile";
        $("#savePetButton").textContent = "Save Changes ✓";
        $("#cancelPetEdit").hidden = false;

        $("#petProfileForm").scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return;
    }

    // DELETE A PROFILE
    if (deleteButton) {
        const pet = profiles.find(
            item => item.id === deleteButton.dataset.deletePet
        );

        if (!pet) return;

        const confirmed = confirm(
            `Delete the profile for ${pet.name}?`
        );

        if (!confirmed) return;

        const updatedProfiles = profiles.filter(
            item => item.id !== pet.id
        );

        if (savePetProfiles(updatedProfiles)) {
            if ($("#petProfileId").value === pet.id) {
                resetPetProfileForm();
            }

            renderPetProfiles();

            showToast("Pet profile deleted.");
        }

        return;
    }

    // FILL THE EXISTING CARE FORMS
    if (useButton) {
        const pet = profiles.find(
            item => item.id === useButton.dataset.usePet
        );

        if (!pet) return;

        const fieldValues = {
            healthPetName: pet.name,
            healthPetType: pet.type,

            nutritionPetName: pet.name,
            nutritionPetType: pet.type,

            trainingPetName: pet.name,
            trainingPetType: pet.type,

            bookingPetName: pet.name,
            bookingPetType: pet.type
        };

        Object.entries(fieldValues).forEach(([id, value]) => {
            const field = document.getElementById(id);

            if (field) {
                field.value = value;
            }
        });

        showToast(
            `${pet.name}'s details added to the care forms.`
        );

        return;
    }
});


// Exit edit mode without saving changes.
$("#cancelPetEdit").addEventListener("click", () => {
    resetPetProfileForm();
    showToast("Editing cancelled.");
});


// Set the date-of-birth limit.
$("#profilePetBirthDate").max = getLocalDate();


// Show profiles already stored in this browser.
renderPetProfiles();


/* ==================================
   PAWCARE DASHBOARD FUNCTIONALITY
================================== */

const DASHBOARD_PET_KEY = "pawcare-selected-pet-id";


// Find the currently selected pet.
function getDashboardSelectedPet() {
    const pets = getPetProfiles();
    const selectedId = localStorage.getItem(DASHBOARD_PET_KEY);

    return pets.find(pet => pet.id === selectedId) || null;
}


// Update dashboard counts and the selected pet card.
function renderPawCareDashboard() {
    const pets = getPetProfiles();
    const records = getHealthRecords();

    const petSelect = $("#dashboardPetSelect");
    const petInfo = $("#dashboardSelectedPetInfo");

    const previousId = localStorage.getItem(DASHBOARD_PET_KEY);

    // Update summary counts.
    $("#dashboardPetCount").textContent = pets.length;
    $("#dashboardHealthCount").textContent = records.length;

    $("#dashboardCartCount").textContent =
        $("#cartCount").textContent;

    // Remember the selected pet if it still exists.
    let selectedId = pets.some(pet => pet.id === previousId)
        ? previousId
        : (pets.length ? pets[0].id : "");

    if (selectedId) {
        localStorage.setItem(DASHBOARD_PET_KEY, selectedId);
    } else {
        localStorage.removeItem(DASHBOARD_PET_KEY);
    }

    // Fill the dropdown with saved pet profiles.
    petSelect.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = pets.length
        ? "Choose a pet"
        : "No pets added yet";

    petSelect.appendChild(placeholder);

    pets.forEach(pet => {
        const option = document.createElement("option");

        option.value = pet.id;
        option.textContent = pet.name + " (" + pet.type + ")";

        petSelect.appendChild(option);
    });

    petSelect.value = selectedId;

    const selectedPet = pets.find(pet => pet.id === selectedId);

    // Show the selected pet's details.
    if (!selectedPet) {
        petInfo.innerHTML = `
            <p class="muted-text">
                No pet profiles found yet.
                Visit My Pets to add your first pet.
            </p>
        `;

        $("#dashboardUsePet").disabled = true;
        $("#dashboardEditPet").disabled = true;

        return;
    }

    const emoji = petTypeEmojis[selectedPet.type] || "🐾";

    petInfo.innerHTML = `
        <div class="dashboard-pet-heading">
            <div class="dashboard-pet-emoji">
                ${emoji}
            </div>

            <div>
                <h4>${escapeHTML(selectedPet.name)}</h4>
                <p>${escapeHTML(selectedPet.type)}</p>
            </div>
        </div>

        <div class="dashboard-pet-details">
            <p>
                <strong>Breed:</strong>
                ${escapeHTML(selectedPet.breed || "Not specified")}
            </p>

            <p>
                <strong>Date of Birth:</strong>
                ${escapeHTML(
                    selectedPet.birthDate
                        ? formatDate(selectedPet.birthDate)
                        : "Not specified"
                )}
            </p>

            ${
                selectedPet.notes
                    ? `<p><strong>Notes:</strong>
                        ${escapeHTML(selectedPet.notes)}</p>`
                    : ""
            }
        </div>
    `;

    $("#dashboardUsePet").disabled = false;
    $("#dashboardEditPet").disabled = false;
}


// Change the selected pet.
$("#dashboardPetSelect").addEventListener("change", event => {
    const selectedId = event.target.value;

    if (selectedId) {
        localStorage.setItem(DASHBOARD_PET_KEY, selectedId);
    } else {
        localStorage.removeItem(DASHBOARD_PET_KEY);
    }

    renderPawCareDashboard();
});


// Fill the existing care forms with the selected pet's information.
function fillDashboardPetForms(pet) {
    const fields = {
        healthPetName: pet.name,
        healthPetType: pet.type,

        nutritionPetName: pet.name,
        nutritionPetType: pet.type,

        trainingPetName: pet.name,
        trainingPetType: pet.type,

        bookingPetName: pet.name,
        bookingPetType: pet.type
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);

        if (field) {
            field.value = value;
        }
    });
}


// Use the selected pet in the care forms.
$("#dashboardUsePet").addEventListener("click", () => {
    const pet = getDashboardSelectedPet();

    if (!pet) {
        showToast("Please add and select a pet first.");
        return;
    }

    fillDashboardPetForms(pet);

    showToast(
        pet.name + "'s details added to the care forms."
    );
});


// Open the saved pet profile for editing.
$("#dashboardEditPet").addEventListener("click", () => {
    const pet = getDashboardSelectedPet();

    if (!pet) {
        showToast("Please select a pet first.");
        return;
    }

    $("#petProfileId").value = pet.id;
    $("#profilePetName").value = pet.name;
    $("#profilePetType").value = pet.type;
    $("#profilePetBreed").value = pet.breed || "";
    $("#profilePetBirthDate").value = pet.birthDate || "";
    $("#profilePetNotes").value = pet.notes || "";

    $("#petFormTitle").textContent = "Edit Pet Profile";
    $("#savePetButton").textContent = "Save Changes ✓";
    $("#cancelPetEdit").hidden = false;

    $("#pets").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


// Refresh the dashboard after pet profile changes.
$("#petProfileForm").addEventListener("submit", () => {
    renderPawCareDashboard();
});

$("#petProfilesList").addEventListener("click", () => {
    renderPawCareDashboard();
});


// Refresh after health records are added, deleted or cleared.
$("#healthForm").addEventListener("submit", () => {
    renderPawCareDashboard();
});

$("#healthRecordsList").addEventListener("click", () => {
    renderPawCareDashboard();
});

$("#clearHealthRecords").addEventListener("click", () => {
    renderPawCareDashboard();
});


// Refresh the item count when the shopping bag changes.
$("#productGrid").addEventListener("click", () => {
    renderPawCareDashboard();
});

$("#cartItems").addEventListener("click", () => {
    renderPawCareDashboard();
});

$("#clearCart").addEventListener("click", () => {
    renderPawCareDashboard();
});


// Display the dashboard when the website loads.
renderPawCareDashboard();



/* ==================================
   SAVE GROOMING CHECKLIST PROGRESS
================================== */

// Save a separate checklist for each pet selected
// in the dashboard. If no pet is selected, use a
// general checklist instead.

function getGroomingStorageKey() {
    const selectedPetId = localStorage.getItem(
        "pawcare-selected-pet-id"
    );

    return selectedPetId
        ? "pawcare-grooming-" + selectedPetId
        : "pawcare-grooming-default";
}


// Save all grooming checkbox states.
function saveGroomingChecklist() {
    const checklist = $$(".groom-task").map(task => task.checked);

    try {
        localStorage.setItem(
            getGroomingStorageKey(),
            JSON.stringify(checklist)
        );
    } catch (error) {
        showToast("Could not save grooming progress.");
    }
}


// Restore the checklist for the selected pet.
function loadGroomingChecklist() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(getGroomingStorageKey()) || "[]"
        );

        $$(".groom-task").forEach((task, index) => {
            task.checked = saved[index] === true;
        });

    } catch (error) {
        console.error("Could not load grooming checklist:", error);
    }

    updateGroomingProgress();
}


// Store changes when a grooming task is checked.
$("#groomingTasks").addEventListener("change", () => {
    saveGroomingChecklist();
});


// Restore the right checklist when a different
// dashboard pet is selected.
$("#dashboardPetSelect").addEventListener("change", () => {
    loadGroomingChecklist();
});


// When the checklist is reset, save its cleared state.
$("#resetGrooming").addEventListener("click", () => {
    saveGroomingChecklist();
});


// Display saved nutrition plans and grooming progress
// when the page loads.
renderSavedNutritionPlans();
loadGroomingChecklist();

/* ==================================
   CARE REMINDERS
================================== */

const CARE_REMINDERS_KEY = "pawcare-care-reminders";


// Load reminders saved in this browser.
function getCareReminders() {
    try {
        const reminders = JSON.parse(
            localStorage.getItem(CARE_REMINDERS_KEY) || "[]"
        );

        return Array.isArray(reminders) ? reminders : [];

    } catch (error) {
        console.error("Could not load care reminders:", error);
        return [];
    }
}


// Save reminders in this browser.
function saveCareReminders(reminders) {
    try {
        localStorage.setItem(
            CARE_REMINDERS_KEY,
            JSON.stringify(reminders)
        );

        return true;

    } catch (error) {
        showToast("Could not save reminders in this browser.");
        return false;
    }
}


// Fill the reminder dropdown with saved pets only.
function updateReminderPetOptions() {
    const select = $("#reminderPetSelect");
    const pets = getPetProfiles();
    const previousValue = select.value;

    // Remove all previous options, including General care.
    select.innerHTML = "";

    // Show a placeholder instead of General care.
    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = pets.length
        ? "Select a pet"
        : "Add a pet profile first";

    placeholder.disabled = true;
    placeholder.selected = true;

    select.appendChild(placeholder);

    // Add only pets saved in My Pets.
    pets.forEach(pet => {
        const option = document.createElement("option");

        option.value = pet.id;
        option.textContent = pet.name + " (" + pet.type + ")";

        select.appendChild(option);
    });

    // Preserve the selected pet if it still exists.
    const petStillExists = pets.some(
        pet => pet.id === previousValue
    );

    select.value = petStillExists ? previousValue : "";
}

// Work out a reminder's current status.
function getReminderStatus(reminder) {
    if (reminder.completed) {
        return {
            text: "Completed",
            className: "completed"
        };
    }

    if (reminder.date < getLocalDate()) {
        return {
            text: "Overdue",
            className: "overdue"
        };
    }

    if (reminder.date === getLocalDate()) {
        return {
            text: "Due Today",
            className: ""
        };
    }

    return {
        text: "Upcoming",
        className: ""
    };
}


// Display the saved reminders.
function renderCareReminders() {
    const reminders = getCareReminders();
    const container = $("#careRemindersList");

    $("#reminderCount").textContent =
        `${reminders.length} ${
            reminders.length === 1 ? "reminder" : "reminders"
        }`;

    if (reminders.length === 0) {
        container.innerHTML = `
            <p class="muted-text">
                No care reminders saved yet.
                Use the form above to add one.
            </p>
        `;

        return;
    }

    // Sort incomplete reminders by date; completed reminders
    // appear after incomplete reminders.
    const sortedReminders = reminders.slice().sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        return a.date.localeCompare(b.date);
    });

    container.innerHTML = sortedReminders.map(reminder => {
        const status = getReminderStatus(reminder);

        return `
            <article class="reminder-card">

                <span class="reminder-status ${status.className}">
                    ${status.text}
                </span>

                <h4>${escapeHTML(reminder.title)}</h4>

                <p>
                    <strong>Category:</strong>
                    ${escapeHTML(reminder.category)}
                </p>

                <p>
                    <strong>Pet:</strong>
                    ${escapeHTML(reminder.petName)}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(formatDate(reminder.date))}
                </p>

                ${
                    reminder.notes
                        ? `<p><strong>Notes:</strong>
                            ${escapeHTML(reminder.notes)}</p>`
                        : ""
                }

                <button
                    type="button"
                    class="button outline-button"
                    data-toggle-reminder="${escapeHTML(reminder.id)}"
                >
                    ${reminder.completed ? "Reopen" : "Mark Complete"}
                </button>

                <button
                    type="button"
                    class="button outline-button"
                    data-delete-reminder="${escapeHTML(reminder.id)}"
                >
                    Delete
                </button>

            </article>
        `;
    }).join("");
}


// Create a reminder.
$("#careReminderForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("#reminderTitle").value.trim();
    const date = $("#reminderDate").value;
    const category = $("#reminderCategory").value;
    const notes = $("#reminderNotes").value.trim();
    const petId = $("#reminderPetSelect").value;

    if (!title || !date || !petId) {
        showToast("Please complete the required reminder fields.");
        return;
    }

    const pets = getPetProfiles();
    const pet = petId === "general"
        ? null
        : pets.find(item => item.id === petId);

    if (petId !== "general" && !pet) {
        showToast("Please select an existing pet profile.");
        updateReminderPetOptions();
        return;
    }

    const reminder = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),

        title: title,
        date: date,
        category: category,
        notes: notes,
        petId: pet ? pet.id : "",
        petName: pet ? pet.name : "General care",
        completed: false
    };

    const reminders = getCareReminders();
    reminders.push(reminder);

    if (saveCareReminders(reminders)) {
        renderCareReminders();

        $("#careReminderForm").reset();
        updateReminderPetOptions();

        showToast("Care reminder saved.");
    }
});


// Mark a reminder complete or reopen it.
$("#careRemindersList").addEventListener("click", event => {
    const toggleButton = event.target.closest(
        "[data-toggle-reminder]"
    );

    const deleteButton = event.target.closest(
        "[data-delete-reminder]"
    );

    if (toggleButton) {
        const reminders = getCareReminders();

        const reminder = reminders.find(
            item => item.id === toggleButton.dataset.toggleReminder
        );

        if (!reminder) return;

        reminder.completed = !reminder.completed;

        if (saveCareReminders(reminders)) {
            renderCareReminders();

            showToast(
                reminder.completed
                    ? "Reminder marked complete."
                    : "Reminder reopened."
            );
        }

        return;
    }

    if (deleteButton) {
        const confirmed = confirm(
            "Are you sure you want to delete this reminder?"
        );

        if (!confirmed) return;

        const reminders = getCareReminders().filter(
            item => item.id !== deleteButton.dataset.deleteReminder
        );

        if (saveCareReminders(reminders)) {
            renderCareReminders();
            showToast("Reminder deleted.");
        }
    }
});


// Keep the pet dropdown up to date when profiles change.
$("#petProfileForm").addEventListener("submit", () => {
    updateReminderPetOptions();
});

$("#petProfilesList").addEventListener("click", () => {
    updateReminderPetOptions();
});


// Initialise the reminder feature when the page loads.
updateReminderPetOptions();
renderCareReminders();


// Today's date can be selected or a future date.
$("#reminderDate").min = getLocalDate();
