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


/* ==================================
   SAVED ACTIVITY SESSIONS
================================== */

const ACTIVITY_STORAGE_KEY = "pawcare-activity-sessions";

function getSavedActivitySessions() {
    try {
        const sessions = JSON.parse(
            localStorage.getItem(ACTIVITY_STORAGE_KEY) || "[]"
        );

        return Array.isArray(sessions) ? sessions : [];
    } catch (error) {
        console.error("Could not load activity sessions:", error);
        return [];
    }
}

function saveActivitySessions(sessions) {
    try {
        localStorage.setItem(
            ACTIVITY_STORAGE_KEY,
            JSON.stringify(sessions)
        );
        return true;
    } catch (error) {
        showToast("Could not save activity sessions.");
        return false;
    }
}

function renderSavedActivitySessions() {
    const sessions = getSavedActivitySessions();
    const container = $("#savedActivitySessions");

    $("#savedActivityCount").textContent =
        sessions.length + (sessions.length === 1 ? " session" : " sessions");

    if (sessions.length === 0) {
        container.innerHTML = `
            <p class="muted-text">No saved sessions yet.</p>
        `;
        return;
    }

    container.innerHTML = sessions.slice().reverse().map(session => {
        const ideas = activityIdeas[session.focus] || activityIdeas.Movement;

        return `
            <article class="record-item">
                <div>
                    <h4>${escapeHTML(session.petName)}'s Activity Session</h4>

                    <p>
                        <strong>Pet Type:</strong> ${escapeHTML(session.petType)}<br>
                        <strong>Focus:</strong> ${escapeHTML(session.focus)}<br>
                        <strong>Duration:</strong> ${escapeHTML(session.duration)} minutes<br>
                        <strong>Created:</strong> ${escapeHTML(formatDate(session.date))}
                    </p>

                    ${ideas.map((idea, index) => `
                        <p>
                            <strong>Step ${index + 1}:</strong>
                            ${escapeHTML(idea)}
                        </p>
                    `).join("")}
                </div>

                <button
                    type="button"
                    class="record-delete"
                    data-delete-activity="${escapeHTML(session.id)}"
                >
                    Delete
                </button>
            </article>
        `;
    }).join("");
}

$("#trainingForm").addEventListener("submit", event => {
    const petName = $("#trainingPetName").value.trim();
    const petType = $("#trainingPetType").value;
    const focus = $("#trainingFocus").value;
    const duration = $("#trainingDuration").value;

    if (!petName || !petType) return;

    const sessions = getSavedActivitySessions();

    sessions.push({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        petName: petName,
        petType: petType,
        focus: focus,
        duration: duration,
        date: getLocalDate()
    });

    if (saveActivitySessions(sessions)) {
        renderSavedActivitySessions();
        showToast("Activity session saved.");
    }
});

$("#savedActivitySessions").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-activity]");

    if (!button) return;

    const updated = getSavedActivitySessions().filter(
        session => session.id !== button.dataset.deleteActivity
    );

    if (saveActivitySessions(updated)) {
        renderSavedActivitySessions();
        showToast("Activity session deleted.");
    }
});

renderSavedActivitySessions();


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

// Validate email address
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(email)) {
    showToast("Please enter a valid email address.");
    return;
}

// Validate preferred booking date
if (date && date < getLocalDate()) {
    showToast("Booking date cannot be in the past.");
    return;
}

    const request = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        name: name,
        petName: petName,
        petType: petType,
        service: service,
        date: date,
        notes: notes,
        status: "Saved",
        createdDate: getLocalDate()
    };

    const requests = getSavedBookingRequests();
    requests.push(request);

    if (!saveSavedBookingRequests(requests)) {
        return;
    }

    $("#bookingConfirmation").hidden = false;

    $("#bookingConfirmation").innerHTML = `
        <h4>Service Request Saved!</h4>

        <p>Thank you, ${escapeHTML(name)}.</p>

        <p>
            <strong>Pet:</strong> ${escapeHTML(petName)}<br>
            <strong>Pet Type:</strong> ${escapeHTML(petType)}<br>
            <strong>Service:</strong> ${escapeHTML(service)}
        </p>

        ${
            date
                ? `<p><strong>Preferred Date:</strong>
                    ${escapeHTML(formatDate(date))}</p>`
                : ""
        }

        <p class="small-note">
            This request is saved in this browser only.
            It has not been sent to a real service provider.
        </p>
    `;

    renderServiceReviewBookingOptions();
    showToast("Service request saved.");
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
    const searchBox = $("#productSearch");
    const sortMenu = $("#productSort");

    const query = searchBox
        ? searchBox.value.trim().toLowerCase()
        : "";

    const sortBy = sortMenu ? sortMenu.value : "default";

    // First, filter products by category and search.
    const filtered = products.filter(product => {
        const categoryMatches =
            currentCategory === "All" ||
            product.category === currentCategory;

        const searchText =
            `${product.name} ${product.category} ${product.description}`
                .toLowerCase();

        const searchMatches = searchText.includes(query);

        return categoryMatches && searchMatches;
    });

    // Next, sort the filtered products.
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


// CATEGORY FILTER BUTTONS
$$(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        currentCategory = button.dataset.category;

        // Highlight the selected category.
        $$(".filter-button").forEach(item => {
            item.classList.toggle(
                "active",
                item === button
            );
        });

        renderProducts();
    });
});


// PRODUCT SEARCH
$("#productSearch").addEventListener("input", () => {
    renderProducts();
});


// PRODUCT SORTING
$("#productSort").addEventListener("change", () => {
    renderProducts();
});

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
   // Prevent names made entirely of spaces or numbers
const petNamePattern = /^(?=.*[A-Za-z])[A-Za-z0-9 .'-]+$/;

if (!petNamePattern.test(profile.name)) {
    showToast("Please enter a valid pet name.");
    return;
}

// Limit pet name length
if (profile.name.length > 40) {
    showToast("Pet name must be 40 characters or fewer.");
    return;
}

// Limit breed field length
if (profile.breed.length > 60) {
    showToast("Breed must be 60 characters or fewer.");
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
function updateGroomingPetOptions() {
    const select = $("#groomingPetSelect");
    const pets = getPetProfiles();
    const previousValue = select.value;

    select.innerHTML = `
        <option value="">General Checklist</option>
    `;

    pets.forEach(pet => {
        const option = document.createElement("option");
        option.value = pet.id;
        option.textContent = pet.name + " (" + pet.type + ")";
        select.appendChild(option);
    });

    const savedId = localStorage.getItem("pawcare-selected-pet-id");

    select.value = pets.some(pet => pet.id === previousValue)
        ? previousValue
        : (pets.some(pet => pet.id === savedId) ? savedId : "");
}

$("#groomingPetSelect").addEventListener("change", event => {
    const selectedId = event.target.value;

    if (selectedId) {
        localStorage.setItem("pawcare-selected-pet-id", selectedId);
    } else {
        localStorage.removeItem("pawcare-selected-pet-id");
    }

    $("#dashboardPetSelect").value = selectedId;
    loadGroomingChecklist();
    updateDashboardGroomingCount();
});

$("#dashboardPetSelect").addEventListener("change", () => {
    updateGroomingPetOptions();
    loadGroomingChecklist();
});

$("#petProfileForm").addEventListener("submit", () => {
    updateGroomingPetOptions();
});

$("#petProfilesList").addEventListener("click", () => {
    updateGroomingPetOptions();
});

updateGroomingPetOptions();

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

/* ==================================
   BOOKING EMAIL VALIDATION
================================== */

const bookingEmailField = $("#bookingEmail");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


// Check the email whenever the user types.
bookingEmailField.addEventListener("input", () => {
    const email = bookingEmailField.value.trim();

    if (email === "") {
        bookingEmailField.setCustomValidity("");
        return;
    }

    if (emailPattern.test(email)) {
        bookingEmailField.setCustomValidity("");
    } else {
        bookingEmailField.setCustomValidity(
            "Please enter a valid email address, such as name@example.com."
        );
    }
});


/* ==================================
   FRIENDLY FORM VALIDATION
================================== */

function addFriendlyFormValidation(formId) {
    const form = document.getElementById(formId);

    if (!form) {
        return;
    }

    const fields = form.querySelectorAll(
        "input, select, textarea"
    );

    fields.forEach(field => {

        // Show a helpful message when a field is invalid.
        field.addEventListener("invalid", function () {

            if (this.validity.valueMissing) {
                this.setCustomValidity(
                    "Please complete this required field."
                );

            } else if (this.validity.typeMismatch) {
                this.setCustomValidity(
                    "Please enter a valid value."
                );

            } else if (this.validity.patternMismatch) {
                this.setCustomValidity(
                    "Please follow the requested format."
                );

            } else if (
                this.validity.rangeUnderflow ||
                this.validity.rangeOverflow
            ) {
                this.setCustomValidity(
                    "Please choose a value within the allowed range."
                );
            }
        });

        // Clear the old message when the user corrects the field.
        ["input", "change"].forEach(eventName => {
            field.addEventListener(eventName, function () {
                this.setCustomValidity("");
            });
        });
    });
}


// Apply validation to the existing PawCare forms.
[
    "petProfileForm",
    "healthForm",
    "nutritionForm",
    "trainingForm",
    "adoptionForm",
    "bookingForm",
    "careReminderForm"
].forEach(addFriendlyFormValidation);


/* ==================================
   DASHBOARD UPCOMING CARE SUMMARY
================================== */

function renderDashboardUpcomingReminders() {
    const container = $("#dashboardUpcomingReminders");
    const count = $("#dashboardPendingReminderCount");

    if (!container || !count) {
        return;
    }

    // Get reminders that haven't been completed.
    const pendingReminders = getCareReminders()
        .filter(reminder => !reminder.completed)
        .sort((a, b) => a.date.localeCompare(b.date));

    count.textContent =
        `${pendingReminders.length} pending`;

    if (pendingReminders.length === 0) {
        container.innerHTML = `
            <p class="muted-text">
                No pending reminders. Add one in Care Reminders below.
            </p>
        `;

        return;
    }

    // Show the three nearest incomplete reminders.
    container.innerHTML = pendingReminders.slice(0, 3).map(reminder => {
        const status = getReminderStatus(reminder);

        return `
            <article class="dashboard-reminder-item">

                <span class="reminder-status ${status.className}">
                    ${escapeHTML(status.text)}
                </span>

                <h4>${escapeHTML(reminder.title)}</h4>

                <p>
                    <strong>Pet:</strong>
                    ${escapeHTML(reminder.petName)}
                </p>

                <p>
                    <strong>Category:</strong>
                    ${escapeHTML(reminder.category)}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(formatDate(reminder.date))}
                </p>

            </article>
        `;
    }).join("");
}


// Refresh the Dashboard after a reminder is saved.
$("#careReminderForm").addEventListener("submit", () => {
    renderDashboardUpcomingReminders();
});


// Refresh after a reminder is completed, reopened or deleted.
$("#careRemindersList").addEventListener("click", () => {
    renderDashboardUpcomingReminders();
});


// Display the current reminder summary on page load.
renderDashboardUpcomingReminders();

/* ==================================
   DASHBOARD FEEDING PLAN COUNT
================================== */

function updateDashboardNutritionCount() {
    const countElement = $("#dashboardNutritionCount");

    if (!countElement) {
        return;
    }

    const plans = getSavedNutritionPlans();

    countElement.textContent = plans.length;
}


// Update the count when a new feeding plan is saved.
$("#nutritionForm").addEventListener("submit", () => {
    updateDashboardNutritionCount();
});


// Update the count when a saved plan is deleted.
$("#savedNutritionPlans").addEventListener("click", () => {
    updateDashboardNutritionCount();
});


// Display the saved count when the website loads.
updateDashboardNutritionCount();

/* ==================================
   DASHBOARD GROOMING PROGRESS
================================== */

function updateDashboardGroomingCount() {
    const countElement = $("#dashboardGroomingCount");

    if (!countElement) {
        return;
    }

    // Find which pet is currently selected.
    const selectedPetId = localStorage.getItem(
        "pawcare-selected-pet-id"
    );

    const storageKey = selectedPetId
        ? "pawcare-grooming-" + selectedPetId
        : "pawcare-grooming-default";

    const totalTasks = $$(".groom-task").length;

    try {
        const savedTasks = JSON.parse(
            localStorage.getItem(storageKey) || "[]"
        );

        const completedTasks = Array.isArray(savedTasks)
            ? savedTasks.filter(task => task === true).length
            : 0;

        countElement.textContent =
            `${completedTasks}/${totalTasks}`;

    } catch (error) {
        console.error(
            "Could not load grooming progress:",
            error
        );

        countElement.textContent = `0/${totalTasks}`;
    }
}


// Update when grooming tasks are checked.
$("#groomingTasks").addEventListener(
    "change",
    updateDashboardGroomingCount
);


// Update when the user resets the checklist.
$("#resetGrooming").addEventListener(
    "click",
    updateDashboardGroomingCount
);


// Update when a different pet is selected.
$("#dashboardPetSelect").addEventListener(
    "change",
    updateDashboardGroomingCount
);


// Show the saved progress when the website opens.
updateDashboardGroomingCount();

/* ==========================================
   PAWCARE VOLUNTEER ASSISTANCE CENTRE
========================================== */

const VA_KEYS = {
    requests: "pawcare-va-requests",
    volunteers: "pawcare-va-volunteers",
    ratings: "pawcare-va-ratings",
    reports: "pawcare-va-reports",
    blocked: "pawcare-va-blocked"
};

const VA_SERVICES = [
    "Walking",
    "Pet Feeding",
    "Grooming Assistance",
    "Veterinary Transport",
    "Temporary Pet Care",
    "Supply Delivery",
    "Other"
];


// Read saved data safely.
function vaRead(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error("Could not read Volunteer Centre data:", error);
        return [];
    }
}


// Save data safely.
function vaWrite(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Could not save Volunteer Centre data:", error);
        showToast("Could not save data in this browser.");
        return false;
    }
}


function vaId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10);
}


function vaNormalise(value) {
    return String(value || "").trim().toLowerCase();
}


function vaGetVolunteers() {
    return vaRead(VA_KEYS.volunteers);
}


function vaGetRequests() {
    return vaRead(VA_KEYS.requests);
}


function vaGetRatings() {
    return vaRead(VA_KEYS.ratings);
}


function vaGetBlockedIds() {
    return vaRead(VA_KEYS.blocked);
}


function vaPetEmoji(type) {
    return petTypeEmojis[type] || "🐾";
}


function vaStatusClass(status) {
    if (status === "Accepted") return "accepted";
    if (status === "Completed") return "completed";
    if (status === "Pending") return "pending";
    return "";
}


function vaGetVolunteerRating(volunteerId) {
    const ratings = vaGetRatings().filter(
        item => item.volunteerId === volunteerId
    );

    if (!ratings.length) {
        return "Not rated yet";
    }

    const total = ratings.reduce(
        (sum, item) => sum + Number(item.stars),
        0
    );

    return (total / ratings.length).toFixed(1) +
        " / 5 (" + ratings.length + ")";
}


// Generate checkboxes for all pet types.
function vaBuildPetTypeOptions() {
    const container = $("#vaVolunteerPetTypes");

    container.innerHTML = petTypes.map(type => `
        <label class="va-check-option">
            <input
                type="checkbox"
                data-va-pet-type
                value="${escapeHTML(type)}"
            >
            ${escapeHTML(type)}
        </label>
    `).join("");
}


// Populate the assistance-request pet dropdown.
function vaUpdatePetOptions() {
    const select = $("#vaRequestPet");
    const previousValue = select.value;
    const pets = getPetProfiles();

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = pets.length
        ? "Select a saved pet"
        : "Add a pet profile first";
    placeholder.disabled = true;

    select.appendChild(placeholder);

    pets.forEach(pet => {
        const option = document.createElement("option");
        option.value = pet.id;
        option.textContent = pet.name + " (" + pet.type + ")";
        select.appendChild(option);
    });

    const exists = pets.some(pet => pet.id === previousValue);

    select.value = exists ? previousValue : "";
}


// Find volunteers whose saved details match a request.
// Match volunteers by service, pet type, area,
// available day, available hours and verification status.
function vaFindMatches(request) {
    const volunteers = vaGetVolunteers();
    const blocked = vaGetBlockedIds();

    const requestArea = vaNormalise(request.area);

    const requestWeekday = new Date(
        request.date + "T12:00:00"
    ).getDay();
// Find requests that already have an accepted volunteer.
const scheduledRequests = vaGetRequests().filter(
    item => item.status === "Accepted"
);
   
    return volunteers.filter(volunteer => {
        // Only verified, unblocked volunteers can match.
        if (!volunteer.verified) return false;
        if (blocked.includes(volunteer.id)) return false;
       // A volunteer cannot accept two requests at the same time.
const hasScheduleConflict = scheduledRequests.some(scheduled =>
    scheduled.id !== request.id &&
    scheduled.acceptedVolunteerId === volunteer.id &&
    scheduled.date === request.date &&
    scheduled.time === request.time
);

if (hasScheduleConflict) return false;

        // Match the requested service.
        if (!volunteer.services.includes(request.service)) {
            return false;
        }

        // Match the pet's species.
        if (!volunteer.petTypes.includes(request.petType)) {
            return false;
        }

        // Match the available weekday.
        if (!volunteer.availableDays.includes(requestWeekday)) {
            return false;
        }

        // Match the general area.
        if (vaNormalise(volunteer.area) !== requestArea) {
            return false;
        }

        // Match the requested time against available hours.
        // Older demo profiles without saved hours remain compatible.
        if (volunteer.availableFrom && volunteer.availableTo) {
            if (
                request.time < volunteer.availableFrom ||
                request.time > volunteer.availableTo
            ) {
                return false;
            }
        }

        return true;
    });
}
        // Match the general area entered on both profiles.
       

// Render all assistance requests and their matching volunteers.
function vaRenderRequests() {
    const container = $("#vaRequestsList");
    const requests = vaGetRequests();
    const volunteers = vaGetVolunteers();

    $("#vaRequestCount").textContent =
        requests.length + (requests.length === 1 ? " request" : " requests");

    if (!requests.length) {
        container.innerHTML = `
            <p class="empty-pets">
                No assistance requests yet. Create one using the form above.
            </p>
        `;
        return;
    }

    container.innerHTML = requests.slice().reverse().map(request => {
        const statusClass = vaStatusClass(request.status);
        const acceptedVolunteer = volunteers.find(
            item => item.id === request.acceptedVolunteerId
        );

        let requestActions = "";

        if (request.status === "Open") {
            const matches = vaFindMatches(request);

            requestActions = matches.length
                ? `
                    <div class="va-match-list">
                        <strong>Matching verified volunteers</strong>

                        ${matches.map(volunteer => `
                            <div class="va-match-item">
                                <strong>
                                    ${escapeHTML(volunteer.name)}
                                </strong>

                                <p>
                                    Rating:
                                    ${escapeHTML(
                                        vaGetVolunteerRating(volunteer.id)
                                    )}
                                </p>

                                <button
                                    type="button"
                                    class="button primary-button"
                                    data-va-accept="${escapeHTML(request.id)}"
                                    data-va-volunteer="${escapeHTML(volunteer.id)}"
                                >
                                    Accept Request
                                </button>
                            </div>
                        `).join("")}
                    </div>
                `
                : `
                    <p class="muted-text">
                        No verified volunteer matches all criteria yet.
                        A profile may need verification or a matching
                        area, service, pet type and available day.
                    </p>
                `;
        } else if (request.status === "Accepted") {
            requestActions = `
                <p>
                    <strong>Accepted by:</strong>
                    ${escapeHTML(
                        request.acceptedVolunteerName || "Volunteer"
                    )}
                </p>

                <button
                    type="button"
                    class="button primary-button"
                    data-va-complete="${escapeHTML(request.id)}"
                >
                    Mark Completed
                </button>
            `;
        } else if (request.status === "Completed") {
            requestActions = `
                <p>This request is marked as completed.</p>
            `;
        }

        return `
            <article class="va-card">

                <span class="va-status ${statusClass}">
                    ${escapeHTML(request.status)}
                </span>

                <h4>
                    ${escapeHTML(request.petName)} —
                    ${escapeHTML(request.service)}
                </h4>

                <p>
                    <strong>Pet type:</strong>
                    ${escapeHTML(request.petType)}
                </p>

                <p>
                    <strong>General area:</strong>
                    ${escapeHTML(request.area)}
                </p>

                <p>
                    <strong>Scheduled:</strong>
                    ${escapeHTML(formatDate(request.date))}
                    at ${escapeHTML(request.time)}
                </p>

                <p>
                    <strong>Details:</strong>
                    ${escapeHTML(request.details)}
                </p>

                ${requestActions}

                <div class="va-card-actions">
                    <button
                        type="button"
                        class="button outline-button"
                        data-va-delete-request="${escapeHTML(request.id)}"
                    >
                        Remove Request
                    </button>
                </div>

            </article>
        `;
    }).join("");
}


// Show volunteer profiles and their ratings.
function vaRenderVolunteers() {
    const container = $("#vaVolunteersList");
    const volunteers = vaGetVolunteers();
    const blocked = vaGetBlockedIds();

    $("#vaVolunteerCount").textContent =
        volunteers.length +
        (volunteers.length === 1 ? " volunteer" : " volunteers");

    if (!volunteers.length) {
        container.innerHTML = `
            <p class="empty-pets">
                No volunteers have registered yet.
            </p>
        `;
        return;
    }

    container.innerHTML = volunteers.slice().reverse().map(volunteer => {
        const isBlocked = blocked.includes(volunteer.id);

        return `
            <article class="va-card ${isBlocked ? "va-safety-blocked" : ""}">

                <span class="va-status ${
                    volunteer.verified ? "" : "pending"
                }">
                    ${volunteer.verified ? "Verified (Demo)" : "Pending Verification"}
                </span>

                ${isBlocked ? `
                    <span class="va-status pending">Blocked locally</span>
                ` : ""}

                <h4>${escapeHTML(volunteer.name)}</h4>

                <p>
                    <strong>General area:</strong>
                    ${escapeHTML(volunteer.area)}
                </p>

                <p>
    <strong>Available hours:</strong>
    ${escapeHTML(volunteer.availableFrom || "Not specified")}
    –
    ${escapeHTML(volunteer.availableTo || "Not specified")}
</p>

                <p>
                    <strong>Pet types:</strong>
                    ${escapeHTML(volunteer.petTypes.join(", "))}
                </p>

                <p>
                    <strong>Services:</strong>
                    ${escapeHTML(volunteer.services.join(", "))}
                </p>

                <p>
                    <strong>Available days:</strong>
                    ${escapeHTML(
                        volunteer.availableDays
                            .map(day => [
                                "Sunday", "Monday", "Tuesday",
                                "Wednesday", "Thursday", "Friday",
                                "Saturday"
                            ][day])
                            .join(", ")
                    )}
                </p>

                ${volunteer.notes ? `
                    <p>
                        <strong>Notes:</strong>
                        ${escapeHTML(volunteer.notes)}
                    </p>
                ` : ""}

                <p class="va-rating-text">
                    ★ ${escapeHTML(
                        vaGetVolunteerRating(volunteer.id)
                    )}
                </p>

            </article>
        `;
    }).join("");
}


// Populate the volunteer picker used by the report/block tools.
function vaUpdateSafetyOptions() {
    const select = $("#vaSafetyVolunteer");
    const previous = select.value;
    const volunteers = vaGetVolunteers();
    const blocked = vaGetBlockedIds();

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a volunteer";
    placeholder.disabled = true;
    select.appendChild(placeholder);

    volunteers.forEach(volunteer => {
        const option = document.createElement("option");
        option.value = volunteer.id;

        option.textContent =
            volunteer.name +
            (blocked.includes(volunteer.id) ? " (Blocked)" : "");

        select.appendChild(option);
    });

    select.value = volunteers.some(
        volunteer => volunteer.id === previous
    ) ? previous : "";

    vaUpdateBlockButton();
}


function vaUpdateBlockButton() {
    const select = $("#vaSafetyVolunteer");
    const button = $("#vaBlockToggle");
    const volunteerId = select.value;

    button.disabled = !volunteerId;

    button.textContent = vaGetBlockedIds().includes(volunteerId)
        ? "Unblock Selected Volunteer"
        : "Block Selected Volunteer";
}


// Render admin verification controls and recorded reports.
function vaRenderAdmin() {
    const container = $("#vaAdminList");
    const volunteers = vaGetVolunteers();
    const reportsContainer = $("#vaReportsList");
    const reports = vaRead(VA_KEYS.reports);

    if (!volunteers.length) {
        container.innerHTML = `
            <p class="muted-text">No volunteer profiles to review.</p>
        `;
    } else {
        container.innerHTML = volunteers.map(volunteer => `
            <article class="record-item">
                <div>
                    <strong>${escapeHTML(volunteer.name)}</strong>

                    <small>
                        ${escapeHTML(volunteer.area)} ·
                        ${volunteer.verified
                            ? "Verified (Demo)"
                            : "Pending Verification"}
                    </small>
                </div>

                <button
                    type="button"
                    class="record-delete"
                    data-va-verify="${escapeHTML(volunteer.id)}"
                >
                    ${volunteer.verified ? "Unverify" : "Verify"}
                </button>
            </article>
        `).join("");
    }

    if (!reports.length) {
        reportsContainer.innerHTML = `
            <p class="muted-text">No reports submitted.</p>
        `;
    } else {
        reportsContainer.innerHTML = reports.slice().reverse().map(report => `
            <article class="record-item">
                <div>
                    <strong>
                        Report: ${escapeHTML(report.volunteerName)}
                    </strong>
                    <small>${escapeHTML(formatDate(report.date))}</small>
                    <small>${escapeHTML(report.reason)}</small>
                    <small>Status: Locally Recorded</small>
                </div>
            </article>
        `).join("");
    }
}


// Fill the rating dropdown with completed, not-yet-rated requests.
function vaUpdateRatingOptions() {
    const select = $("#vaRatingRequest");
    const previous = select.value;
    const requests = vaGetRequests();
    const ratings = vaGetRatings();

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a completed request";
    placeholder.disabled = true;
    select.appendChild(placeholder);

    requests.filter(request =>
        request.status === "Completed" &&
        !ratings.some(rating => rating.requestId === request.id)
    ).forEach(request => {
        const option = document.createElement("option");
        option.value = request.id;
        option.textContent =
            request.petName + " — " +
            request.service + " — " +
            (request.acceptedVolunteerName || "Volunteer");

        select.appendChild(option);
    });

    const exists = [...select.options].some(
        option => option.value === previous
    );

    select.value = exists ? previous : "";
}


// Render all parts of the Volunteer Centre.
function vaRenderAll() {
    vaUpdatePetOptions();
    vaRenderRequests();
    vaRenderVolunteers();
    vaRenderAdmin();
    vaUpdateSafetyOptions();
    vaUpdateRatingOptions();
}


/* CREATE ASSISTANCE REQUEST */

$("#vaRequestForm").addEventListener("submit", event => {
    event.preventDefault();

    const petId = $("#vaRequestPet").value;
    const pets = getPetProfiles();
    const pet = pets.find(item => item.id === petId);

    if (!pet) {
        showToast("Please add and select a saved pet profile.");
        return;
    }

    const date = $("#vaRequestDate").value;

    if (!date || date < getLocalDate()) {
        showToast("Choose today or a future date.");
        return;
    }

    const request = {
        id: vaId(),
        petId: pet.id,
        petName: pet.name,
        petType: pet.type,
        service: $("#vaRequestService").value,
        area: $("#vaRequestArea").value.trim(),
        date: date,
        time: $("#vaRequestTime").value,
        details: $("#vaRequestDetails").value.trim(),
        status: "Open",
        acceptedVolunteerId: "",
        acceptedVolunteerName: "",
        createdDate: getLocalDate()
    };

    if (
        !request.service ||
        !request.area ||
        !request.time ||
        !request.details
    ) {
        showToast("Please complete all required fields.");
        return;
    }

    const requests = vaGetRequests();
    requests.push(request);

    if (vaWrite(VA_KEYS.requests, requests)) {
        $("#vaRequestForm").reset();
        $("#vaRequestDate").min = getLocalDate();

        vaRenderAll();
        showToast("Assistance request saved.");
    }
});


/* CREATE VOLUNTEER PROFILE */

$("#vaVolunteerForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#vaVolunteerName").value.trim();
    const area = $("#vaVolunteerArea").value.trim();
    const notes = $("#vaVolunteerNotes").value.trim();
   const availableFrom = $("#vaVolunteerStart").value;
const availableTo = $("#vaVolunteerEnd").value;

if (!availableFrom || !availableTo || availableFrom >= availableTo) {
    showToast("Choose valid volunteer availability hours.");
    return;
}

    const petTypeChoices = $$(
        "[data-va-pet-type]:checked",
        $("#vaVolunteerForm")
    ).map(input => input.value);

    const serviceChoices = $$(
        "[data-va-service]:checked",
        $("#vaVolunteerForm")
    ).map(input => input.value);

    const dayChoices = $$(
        "[data-va-day]:checked",
        $("#vaVolunteerForm")
    ).map(input => Number(input.value));

    if (
        !name ||
        !area ||
        !petTypeChoices.length ||
        !serviceChoices.length ||
        !dayChoices.length
    ) {
        showToast(
            "Add a name, area, pet type, service and available day."
        );
        return;
    }

    const volunteer = {
        id: vaId(),
        name: name,
        area: area,
        notes: notes,
        petTypes: petTypeChoices,
        services: serviceChoices,
        availableDays: dayChoices,
       availableFrom: availableFrom,
       availableTo: availableTo,
        verified: false,
        createdDate: getLocalDate()
    };

    const volunteers = vaGetVolunteers();
    volunteers.push(volunteer);

    if (vaWrite(VA_KEYS.volunteers, volunteers)) {
        $("#vaVolunteerForm").reset();

        vaRenderAll();
        showToast("Volunteer profile saved as pending verification.");
    }
});


/* HANDLE ASSISTANCE REQUEST ACTIONS */

$("#vaRequestsList").addEventListener("click", event => {
    const acceptButton = event.target.closest("[data-va-accept]");
    const completeButton = event.target.closest("[data-va-complete]");
    const deleteButton = event.target.closest("[data-va-delete-request]");

    const requests = vaGetRequests();

    if (acceptButton) {
        const request = requests.find(
            item => item.id === acceptButton.dataset.vaAccept
        );

        const volunteer = vaGetVolunteers().find(
            item => item.id === acceptButton.dataset.vaVolunteer
        );

        if (!request || request.status !== "Open" || !volunteer) {
            showToast("This request is no longer open.");
            return;
        }

        if (!vaFindMatches(request).some(
            item => item.id === volunteer.id
        )) {
            showToast("This volunteer no longer matches the request.");
            return;
        }

        request.status = "Accepted";
        request.acceptedVolunteerId = volunteer.id;
        request.acceptedVolunteerName = volunteer.name;

        if (vaWrite(VA_KEYS.requests, requests)) {
            vaRenderAll();
            showToast("Request accepted in this demo.");
        }

        return;
    }

    if (completeButton) {
        const request = requests.find(
            item => item.id === completeButton.dataset.vaComplete
        );

        if (!request || request.status !== "Accepted") {
            return;
        }

        request.status = "Completed";

        if (vaWrite(VA_KEYS.requests, requests)) {
            vaRenderAll();
            showToast("Request marked as completed.");
        }

        return;
    }

    if (deleteButton) {
        const confirmed = confirm(
            "Remove this assistance request?"
        );

        if (!confirmed) return;

        const updated = requests.filter(
            item => item.id !== deleteButton.dataset.vaDeleteRequest
        );

        if (vaWrite(VA_KEYS.requests, updated)) {
            vaRenderAll();
            showToast("Request removed.");
        }
    }
});


/* ADMIN DEMO VERIFICATION */

$("#vaAdminList").addEventListener("click", event => {
    const button = event.target.closest("[data-va-verify]");

    if (!button) return;

    const volunteerId = button.dataset.vaVerify;
    const volunteers = vaGetVolunteers();

    const volunteer = volunteers.find(
        item => item.id === volunteerId
    );

    if (!volunteer) return;

    volunteer.verified = !volunteer.verified;

    if (vaWrite(VA_KEYS.volunteers, volunteers)) {
        vaRenderAll();

        showToast(
            volunteer.verified
                ? "Profile marked verified in this demo."
                : "Verification removed."
        );
    }
});


/* REPORT A VOLUNTEER */

$("#vaReportForm").addEventListener("submit", event => {
    event.preventDefault();

    const volunteerId = $("#vaSafetyVolunteer").value;
    const reason = $("#vaReportReason").value.trim();

    const volunteer = vaGetVolunteers().find(
        item => item.id === volunteerId
    );

    if (!volunteer || !reason) {
        showToast("Select a volunteer and enter report details.");
        return;
    }

    const reports = vaRead(VA_KEYS.reports);

    reports.push({
        id: vaId(),
        volunteerId: volunteer.id,
        volunteerName: volunteer.name,
        reason: reason,
        date: getLocalDate(),
        status: "Locally Recorded"
    });

    if (vaWrite(VA_KEYS.reports, reports)) {
        $("#vaReportReason").value = "";

        vaRenderAll();
        showToast("Report saved locally in this demo.");
    }
});


/* BLOCK OR UNBLOCK A VOLUNTEER */

$("#vaSafetyVolunteer").addEventListener("change", () => {
    vaUpdateBlockButton();
});

$("#vaBlockToggle").addEventListener("click", () => {
    const volunteerId = $("#vaSafetyVolunteer").value;

    if (!volunteerId) {
        showToast("Select a volunteer first.");
        return;
    }

    const volunteer = vaGetVolunteers().find(
        item => item.id === volunteerId
    );

    if (!volunteer) return;

    let blocked = vaGetBlockedIds();

    if (blocked.includes(volunteerId)) {
        blocked = blocked.filter(id => id !== volunteerId);
    } else {
        if (!confirm(
            "Block this volunteer from matching in this browser?"
        )) {
            return;
        }

        blocked.push(volunteerId);
    }

    if (vaWrite(VA_KEYS.blocked, blocked)) {
        vaRenderAll();

        showToast(
            blocked.includes(volunteerId)
                ? "Volunteer blocked in this browser."
                : "Volunteer unblocked."
        );
    }
});


/* RATE A COMPLETED REQUEST */

$("#vaRatingForm").addEventListener("submit", event => {
    event.preventDefault();

    const requestId = $("#vaRatingRequest").value;
    const stars = Number($("#vaRatingStars").value);
    const comment = $("#vaRatingComment").value.trim();

    const request = vaGetRequests().find(
        item => item.id === requestId
    );

    if (
        !request ||
        request.status !== "Completed" ||
        stars < 1 ||
        stars > 5
    ) {
        showToast("Select a completed request and a rating.");
        return;
    }

    const ratings = vaGetRatings();

    if (ratings.some(item => item.requestId === request.id)) {
        showToast("This request has already been rated.");
        return;
    }

    ratings.push({
        id: vaId(),
        requestId: request.id,
        volunteerId: request.acceptedVolunteerId,
        stars: stars,
        comment: comment,
        date: getLocalDate()
    });

    if (vaWrite(VA_KEYS.ratings, ratings)) {
        $("#vaRatingForm").reset();

        vaRenderAll();
        showToast("Rating saved in this browser.");
    }
});


/* INITIALISE VOLUNTEER ASSISTANCE */

$("#vaRequestDate").min = getLocalDate();

vaBuildPetTypeOptions();
vaRenderAll();


// Keep volunteer request dropdown current after pet profile changes.
$("#petProfileForm").addEventListener("submit", () => {
    vaUpdatePetOptions();
});

/* ==================================
   PET CARE TIPS: FETCH AND JSON
================================== */

let petCareTips = [];


// Load the JSON file from the GitHub repository.
async function loadPetCareTips() {
    const status = $("#tipsStatus");
    const container = $("#tipsList");

    status.textContent = "Loading pet-care tips...";

    try {
        const response = await fetch("pet-tips.json");

        if (!response.ok) {
            throw new Error(
                "Could not load pet-tips.json. Check that the file exists."
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The pet tips data format is incorrect.");
        }

        petCareTips = data;

        renderPetTips();

    } catch (error) {
        console.error("Pet Care Tips error:", error);

        status.textContent =
            "Pet-care tips could not be loaded. Please check the JSON file and refresh the page.";

        container.innerHTML = "";
    }
}


// Search and filter the tips.
function getFilteredPetTips() {
    const searchText = $("#tipSearch")
        .value
        .trim()
        .toLowerCase();

    const category = $("#tipCategory").value;
    const petType = $("#tipPetType").value;

    return petCareTips.filter(tip => {
        const searchableText = [
            tip.title,
            tip.category,
            tip.description,
            ...(Array.isArray(tip.petTypes) ? tip.petTypes : [])
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);

        const matchesCategory =
            category === "All" ||
            tip.category === category;

        // An empty pet-type selection means all pet types.
        const matchesPetType =
            !petType ||
            petType === "All" ||
            (
                Array.isArray(tip.petTypes) &&
                tip.petTypes.includes(petType)
            );

        return matchesSearch &&
            matchesCategory &&
            matchesPetType;
    });
}


// Display the filtered tips on the page.
function renderPetTips() {
    const container = $("#tipsList");
    const status = $("#tipsStatus");

    const filteredTips = getFilteredPetTips();

    status.textContent =
        `${filteredTips.length} ${
            filteredTips.length === 1 ? "tip" : "tips"
        } found.`;

    container.innerHTML = "";

    if (filteredTips.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-pets";
        emptyMessage.textContent =
            "No tips match your search. Try another keyword or category.";

        container.appendChild(emptyMessage);
        return;
    }

    filteredTips.forEach(tip => {
        const card = document.createElement("article");

        card.className = "tip-card";

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "tip-category";
        categoryBadge.textContent = tip.category;

        const title = document.createElement("h4");
        title.textContent = tip.title;

        const description = document.createElement("p");
        description.textContent = tip.description;

        const petTypesLabel = document.createElement("div");
        petTypesLabel.className = "tip-pet-types";

        petTypesLabel.textContent =
            "Suitable for: " +
            (
                Array.isArray(tip.petTypes)
                    ? tip.petTypes.join(", ")
                    : "General guidance"
            );

        card.appendChild(categoryBadge);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(petTypesLabel);

        container.appendChild(card);
    });
}


// Update results when users search or change filters.
$("#tipSearch").addEventListener("input", renderPetTips);

$("#tipCategory").addEventListener("change", renderPetTips);

$("#tipPetType").addEventListener("change", renderPetTips);


// Load the tips when the page opens.
loadPetCareTips();

/* ==================================
   DAILY CARE ROUTINE
   Drag and Drop API + localStorage
================================== */

const ROUTINE_STORAGE_KEY = "pawcare-daily-routine";

const defaultRoutineTasks = [
    {
        id: "water",
        label: "Refresh clean drinking water",
        completed: false
    },
    {
        id: "feeding",
        label: "Follow the appropriate feeding routine",
        completed: false
    },
    {
        id: "environment",
        label: "Check the pet's living space",
        completed: false
    },
    {
        id: "activity",
        label: "Plan suitable movement or play",
        completed: false
    },
    {
        id: "grooming",
        label: "Check grooming and hygiene needs",
        completed: false
    },
    {
        id: "enrichment",
        label: "Provide safe enrichment or interaction",
        completed: false
    }
];


// Get the saved tasks, or start with the default routine.
function getRoutineTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(ROUTINE_STORAGE_KEY) || "null"
        );

        if (
            Array.isArray(saved) &&
            saved.every(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.label === "string" &&
                typeof task.completed === "boolean"
            )
        ) {
            return saved;
        }
    } catch (error) {
        console.error("Could not load daily routine:", error);
    }

    return defaultRoutineTasks.map(task => ({ ...task }));
}


// Save the routine to this browser.
function saveRoutineTasks(tasks) {
    try {
        localStorage.setItem(
            ROUTINE_STORAGE_KEY,
            JSON.stringify(tasks)
        );

        return true;
    } catch (error) {
        console.error("Could not save daily routine:", error);
        showToast("Could not save your routine in this browser.");
        return false;
    }
}


// Update the progress bar.
function updateRoutineProgress() {
    const tasks = getRoutineTasks();
    const completed = tasks.filter(task => task.completed).length;

    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    $("#routineProgressText").textContent =
        `${completed} of ${tasks.length} tasks completed`;

    $("#routineProgressPercent").textContent =
        `${percentage}%`;

    $("#routineProgressBar").style.width =
        `${percentage}%`;

    $("#routineProgress").setAttribute(
        "aria-valuenow",
        percentage
    );
}


// Display tasks in their saved order.
function renderRoutineTasks() {
    const list = $("#routineTaskList");
    const tasks = getRoutineTasks();

    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const item = document.createElement("li");
        item.className = "routine-task";

        if (task.completed) {
            item.classList.add("completed");
        }

        item.draggable = true;
        item.dataset.routineId = task.id;

        const handle = document.createElement("span");
        handle.className = "routine-drag-handle";
        handle.textContent = "⠿";
        handle.title = "Drag to reorder";
        handle.setAttribute("aria-hidden", "true");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "routine-task-checkbox";
        checkbox.checked = task.completed;
        checkbox.dataset.routineCheck = task.id;
        checkbox.setAttribute(
            "aria-label",
            "Mark " + task.label + " complete"
        );

        const label = document.createElement("span");
        label.className = "routine-task-label";
        label.textContent = task.label;

        const controls = document.createElement("div");
        controls.className = "routine-task-controls";

        const upButton = document.createElement("button");
        upButton.type = "button";
        upButton.className = "routine-move-button";
        upButton.textContent = "↑";
        upButton.title = "Move task up";
        upButton.setAttribute(
            "aria-label",
            "Move " + task.label + " up"
        );
        upButton.dataset.routineMove = "up";
        upButton.disabled = index === 0;

        const downButton = document.createElement("button");
        downButton.type = "button";
        downButton.className = "routine-move-button";
        downButton.textContent = "↓";
        downButton.title = "Move task down";
        downButton.setAttribute(
            "aria-label",
            "Move " + task.label + " down"
        );
        downButton.dataset.routineMove = "down";
        downButton.disabled = index === tasks.length - 1;

        controls.appendChild(upButton);
        controls.appendChild(downButton);

        item.appendChild(handle);
        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(controls);

        list.appendChild(item);
    });

    updateRoutineProgress();
}


// Save the order shown in the list.
function saveRoutineOrderFromList() {
    const tasks = getRoutineTasks();

    const taskMap = new Map(
        tasks.map(task => [task.id, task])
    );

    const orderedIds = [
        ...$("#routineTaskList").querySelectorAll(".routine-task")
    ].map(item => item.dataset.routineId);

    const orderedTasks = orderedIds
        .map(id => taskMap.get(id))
        .filter(Boolean);

    if (saveRoutineTasks(orderedTasks)) {
        updateRoutineProgress();
        $("#routineStatus").textContent =
            "Routine order saved in this browser.";
    }
}


// Respond when a task is checked or unchecked.
$("#routineTaskList").addEventListener("change", event => {
    const checkbox = event.target.closest("[data-routine-check]");

    if (!checkbox) {
        return;
    }

    const tasks = getRoutineTasks();

    const task = tasks.find(
        item => item.id === checkbox.dataset.routineCheck
    );

    if (!task) {
        return;
    }

    task.completed = checkbox.checked;

    if (saveRoutineTasks(tasks)) {
        renderRoutineTasks();

        $("#routineStatus").textContent =
            "Task progress saved.";
    }
});


// Move tasks using the arrow buttons.
$("#routineTaskList").addEventListener("click", event => {
    const button = event.target.closest("[data-routine-move]");

    if (!button) {
        return;
    }

    const item = button.closest(".routine-task");

    if (!item) {
        return;
    }

    const list = $("#routineTaskList");

    if (button.dataset.routineMove === "up" && item.previousElementSibling) {
        list.insertBefore(item, item.previousElementSibling);
    } else if (
        button.dataset.routineMove === "down" &&
        item.nextElementSibling
    ) {
        list.insertBefore(item.nextElementSibling, item);
    }

    saveRoutineOrderFromList();
    renderRoutineTasks();

    $("#routineStatus").textContent =
        "Routine order updated.";
});


// Begin a drag operation.
$("#routineTaskList").addEventListener("dragstart", event => {
    const item = event.target.closest(".routine-task");

    if (!item) {
        return;
    }

    item.classList.add("dragging");

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
            "text/plain",
            item.dataset.routineId
        );
    }
});


// Allow the dragged task to be dropped onto the list.
$("#routineTaskList").addEventListener("dragover", event => {
    event.preventDefault();

    const list = $("#routineTaskList");
    const dragging = list.querySelector(".dragging");
    const target = event.target.closest(".routine-task");

    if (!dragging || !target || dragging === target) {
        return;
    }

    const rectangle = target.getBoundingClientRect();

    const placeBefore =
        event.clientY < rectangle.top + rectangle.height / 2;

    target.classList.add("drop-target");

    if (placeBefore) {
        list.insertBefore(dragging, target);
    } else {
        list.insertBefore(dragging, target.nextSibling);
    }
});


// Remove drop highlighting when the pointer leaves a task.
$("#routineTaskList").addEventListener("dragleave", event => {
    const item = event.target.closest(".routine-task");

    if (item && !item.contains(event.relatedTarget)) {
        item.classList.remove("drop-target");
    }
});


// Save the reordered list when a drag ends.
$("#routineTaskList").addEventListener("dragend", event => {
    const list = $("#routineTaskList");

    list.querySelectorAll(".routine-task").forEach(item => {
        item.classList.remove("dragging", "drop-target");
    });

    saveRoutineOrderFromList();
    renderRoutineTasks();

    $("#routineStatus").textContent =
        "Routine order saved in this browser.";
});


// Reset task order and completion states.
$("#resetRoutine").addEventListener("click", () => {
    const confirmed = confirm(
        "Reset the routine to its default tasks and clear completed states?"
    );

    if (!confirmed) {
        return;
    }

    const freshTasks = defaultRoutineTasks.map(task => ({
        ...task
    }));

    if (saveRoutineTasks(freshTasks)) {
        renderRoutineTasks();

        $("#routineStatus").textContent =
            "Routine has been reset.";

        showToast("Daily routine reset.");
    }
});


// Load the saved routine when the page opens.
renderRoutineTasks();

/* ==================================
   NAVIGATION DROPDOWN BEHAVIOUR
================================== */

const navigationDropdowns = $$(".nav-dropdown");

navigationDropdowns.forEach(dropdown => {
    dropdown.addEventListener("toggle", () => {
        if (!dropdown.open) {
            return;
        }

        // Close any other open navigation dropdown.
        navigationDropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
                otherDropdown.open = false;
            }
        });
    });
});

// Close a dropdown after the user selects a menu link.
navigationDropdowns.forEach(dropdown => {
    $$("a", dropdown).forEach(link => {
        link.addEventListener("click", () => {
            dropdown.open = false;
        });
    });
});

/* ==================================
   PAWCARE FORM DRAFT SAVING
   Uses sessionStorage and JSON
================================== */

function setupPawCareDraft(formId, fieldIds, storageKey, isSaved) {
    const form = document.getElementById(formId);

    if (!form) {
        return;
    }

    // Restore a saved draft when the page opens.
    try {
        const savedDraft = sessionStorage.getItem(storageKey);

        if (savedDraft) {
            const draft = JSON.parse(savedDraft);

            fieldIds.forEach(fieldId => {
                const field = document.getElementById(fieldId);

                if (
                    field &&
                    Object.prototype.hasOwnProperty.call(draft, fieldId) &&
                    typeof draft[fieldId] === "string"
                ) {
                    // Restore only options that actually exist.
                    if (field.tagName === "SELECT") {
                        const validOption = [...field.options].some(
                            option => option.value === draft[fieldId]
                        );

                        field.value = validOption ? draft[fieldId] : "";
                    } else {
                        field.value = draft[fieldId];
                    }
                }
            });
        }
    } catch (error) {
        console.error("Could not restore form draft:", error);
    }

    // Save current form values as the user types or changes selections.
    function saveDraft() {
        const draft = {};

        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);

            if (field) {
                draft[fieldId] = field.value;
            }
        });

        try {
            sessionStorage.setItem(storageKey, JSON.stringify(draft));
        } catch (error) {
            console.error("Could not save form draft:", error);
        }
    }

    fieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);

        if (field) {
            field.addEventListener("input", saveDraft);
            field.addEventListener("change", saveDraft);
        }
    });

    // Clear the draft only after successful submission.
    form.addEventListener("submit", () => {
        if (typeof isSaved === "function" && isSaved()) {
            sessionStorage.removeItem(storageKey);
        }
    });
}


// Service booking form draft
setupPawCareDraft(
    "bookingForm",
    [
        "bookingName",
        "bookingEmail",
        "bookingPetName",
        "bookingPetType",
        "bookingService",
        "bookingDate",
        "bookingNotes"
    ],
    "pawcare-booking-draft",
    () => !$("#bookingConfirmation").hidden
);


// Volunteer assistance request draft
setupPawCareDraft(
    "vaRequestForm",
    [
        "vaRequestPet",
        "vaRequestService",
        "vaRequestArea",
        "vaRequestDate",
        "vaRequestTime",
        "vaRequestDetails"
    ],
    "pawcare-assistance-draft",
    () =>
        $("#vaRequestPet").value === "" &&
        $("#vaRequestDetails").value === ""
);


/* ==================================
   SAVED SERVICE REQUESTS
================================== */

const SAVED_BOOKING_REQUESTS_KEY =
    "pawcare-saved-service-requests";

function getSavedBookingRequests() {
    try {
        const requests = JSON.parse(
            localStorage.getItem(SAVED_BOOKING_REQUESTS_KEY) || "[]"
        );

        return Array.isArray(requests) ? requests : [];
    } catch (error) {
        console.error("Could not load service requests:", error);
        return [];
    }
}

function saveSavedBookingRequests(requests) {
    try {
        localStorage.setItem(
            SAVED_BOOKING_REQUESTS_KEY,
            JSON.stringify(requests)
        );

        return true;
    } catch (error) {
        console.error("Could not save service requests:", error);
        showToast("Could not save the service request.");
        return false;
    }
}



/* ==================================
   SERVICE RATINGS AND REVIEWS
================================== */

const SERVICE_REVIEWS_KEY = "pawcare-service-reviews";


// Read reviews saved in this browser.
function getServiceReviews() {
    try {
        const reviews = JSON.parse(
            localStorage.getItem(SERVICE_REVIEWS_KEY) || "[]"
        );

        return Array.isArray(reviews) ? reviews : [];

    } catch (error) {
        console.error("Could not load service reviews:", error);
        return [];
    }
}


// Save reviews in this browser.
function saveServiceReviews(reviews) {
    try {
        localStorage.setItem(
            SERVICE_REVIEWS_KEY,
            JSON.stringify(reviews)
        );

        return true;

    } catch (error) {
        console.error("Could not save service reviews:", error);
        showToast("Could not save your review.");
        return false;
    }
}


// Populate the dropdown using saved service requests.
function renderServiceReviewBookingOptions() {
    const select = $("#serviceReviewBooking");
    const status = $("#serviceReviewFormStatus");

    const requests = getSavedBookingRequests();
    const reviews = getServiceReviews();

    const reviewedRequestIds = reviews.map(
        review => review.requestId
    );

    const availableRequests = requests.filter(
        request => !reviewedRequestIds.includes(request.id)
    );

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = availableRequests.length
        ? "Select a service request"
        : "No unrated service requests";
    placeholder.disabled = true;
    placeholder.selected = true;

    select.appendChild(placeholder);

    availableRequests.forEach(request => {
        const option = document.createElement("option");

        option.value = request.id;

        option.textContent =
            request.service + " — " +
            request.petName +
            (request.date
                ? " (" + formatDate(request.date) + ")"
                : "");

        select.appendChild(option);
    });

    if (availableRequests.length === 0) {
        status.textContent = requests.length === 0
            ? "Submit a service request first to rate a service."
            : "All currently saved service requests have been rated.";
    } else {
        status.textContent =
            "You can submit one rating for each saved service request.";
    }
}


// Display the average rating and saved reviews.
function renderServiceReviews() {
    const container = $("#serviceReviewsList");
    const summary = $("#serviceReviewSummary");

    const reviews = getServiceReviews();

    if (reviews.length === 0) {
        summary.textContent = "No ratings yet.";

        container.innerHTML = `
            <p class="muted-text">
                Once you rate a saved service request,
                your review will appear here.
            </p>
        `;

        return;
    }

    const totalStars = reviews.reduce(
        (total, review) => total + Number(review.rating),
        0
    );

    const average = (totalStars / reviews.length).toFixed(1);

    summary.textContent =
        "Average rating: " + average + " / 5 · " +
        reviews.length +
        (reviews.length === 1 ? " review" : " reviews");

    // Show the newest reviews first.
    container.innerHTML = reviews.slice().reverse().map(review => {
        const rating = Number(review.rating);

        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);

        return `
            <article class="service-review-card">

                <span class="service-review-stars"
                      aria-label="${rating} out of 5 stars">
                    ${stars}
                </span>

                <h4>${escapeHTML(review.service)}</h4>

                <p>
                    <strong>Pet:</strong>
                    ${escapeHTML(review.petName)}
                </p>

                ${
                    review.comment
                        ? `<p>${escapeHTML(review.comment)}</p>`
                        : `<p class="muted-text">No written comment.</p>`
                }

                <p class="service-review-meta">
                    Rated on ${escapeHTML(formatDate(review.reviewDate))}
                </p>

            </article>
        `;
    }).join("");
}


// Submit a rating for a saved service request.
$("#serviceReviewForm").addEventListener("submit", event => {
    event.preventDefault();

    const requestId = $("#serviceReviewBooking").value;
    const rating = Number($("#serviceReviewRating").value);
    const comment = $("#serviceReviewComment").value.trim();

    const requests = getSavedBookingRequests();

    const request = requests.find(
        item => item.id === requestId
    );

    if (!request) {
        showToast("Please select a saved service request.");
        return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        showToast("Please select a rating from 1 to 5.");
        return;
    }

    const reviews = getServiceReviews();

    // Prevent duplicate ratings for the same request.
    const alreadyRated = reviews.some(
        review => review.requestId === request.id
    );

    if (alreadyRated) {
        showToast("This request has already been rated.");
        renderServiceReviewBookingOptions();
        return;
    }

    const review = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),

        requestId: request.id,
        service: request.service,
        petName: request.petName,
        rating: rating,
        comment: comment,
        reviewDate: getLocalDate()
    };

    reviews.push(review);

    if (saveServiceReviews(reviews)) {
        $("#serviceReviewForm").reset();

        renderServiceReviewBookingOptions();
        renderServiceReviews();

        showToast("Your service rating has been saved.");
    }
});


// Refresh available ratings after a new booking is saved.
$("#bookingForm").addEventListener("submit", () => {
    renderServiceReviewBookingOptions();
});


// Refresh if a saved request is removed.
const savedRequestsList = $("#savedRequestsList");

if (savedRequestsList) {
    savedRequestsList.addEventListener("click", () => {
        renderServiceReviewBookingOptions();
    });
}

// Display saved reviews whenever the page loads.
renderServiceReviewBookingOptions();
renderServiceReviews();

/* ==================================
   INDIVIDUAL SERVICE RATINGS
================================== */

function renderServiceCardRatings() {
    const reviews = getServiceReviews();

    $$(".service-card").forEach(card => {
        const heading = card.querySelector("h3");

        if (!heading) {
            return;
        }

        const serviceName = heading.textContent.trim();

        // Create a rating area if one doesn't exist.
        let ratingElement = card.querySelector(
            ".service-rating-summary"
        );

        if (!ratingElement) {
            ratingElement = document.createElement("p");
            ratingElement.className = "service-rating-summary";

            const link = card.querySelector("a");

            if (link) {
                card.insertBefore(ratingElement, link);
            } else {
                card.appendChild(ratingElement);
            }
        }

        // Find reviews for this particular service.
        const serviceReviews = reviews.filter(
            review => review.service === serviceName
        );

        if (serviceReviews.length === 0) {
            ratingElement.textContent = "★ No ratings yet";
            return;
        }

        const totalStars = serviceReviews.reduce(
            (total, review) => total + Number(review.rating),
            0
        );

        const average = (
            totalStars / serviceReviews.length
        ).toFixed(1);

        const count = serviceReviews.length;
        const label = count === 1 ? "review" : "reviews";

        ratingElement.textContent =
            `★ ${average} / 5 (${count} ${label})`;
    });
}


// Show existing ratings when the website loads.
renderServiceCardRatings();


// Refresh service cards whenever a review is submitted.
$("#serviceReviewForm").addEventListener("submit", () => {
    renderServiceCardRatings();
});

/* ==================================
   PAWCARE ERROR HANDLING
================================== */

// Handle unexpected JavaScript errors.
window.addEventListener("error", function (event) {
    console.error(
        "PawCare JavaScript error:",
        event.error || event.message
    );

    if (typeof showToast === "function") {
        showToast(
            "Something went wrong. Please refresh the page and try again."
        );
    }
});


// Handle failed background asynchronous operations.
window.addEventListener("unhandledrejection", function (event) {
    console.error(
        "PawCare background operation failed:",
        event.reason
    );

    if (typeof showToast === "function") {
        showToast(
            "An operation could not be completed. Please try again."
        );
    }
});
