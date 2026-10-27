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
    "Guinea Pig",
    "Mouse",
    "Rat",
    "Ferret",
    "Reptile",
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
    const query = $("#productSearch").value.trim().toLowerCase();

    return products.filter(product => {
        const categoryMatches =
            currentCategory === "All" ||
            product.category === currentCategory;

        const searchMatches =
            `${product.name} ${product.category} ${product.description}`
                .toLowerCase()
                .includes(query);

        return categoryMatches && searchMatches;
    });
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
    "Guinea Pig": "🐹",
    Mouse: "🐭",
    Rat: "🐭",
    Ferret: "🦦",
    Reptile: "🦎",
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
