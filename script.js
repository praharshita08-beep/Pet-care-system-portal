const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Fill the booking form when a service link is selected.
document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("service").value = link.dataset.service;
  });
});

// Prevent users from choosing a date in the past.
const bookingDate = document.getElementById("bookingDate");
const today = new Date();
const localToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

bookingDate.min = localToday;

// Demonstration form: this does not send or save real bookings.
document.getElementById("bookingForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const ownerName = document.getElementById("ownerName").value.trim();
  const petType = document.getElementById("petType").value;
  const service = document.getElementById("service").value;
  const date = bookingDate.value;
  const message = document.getElementById("formMessage");

  if (!ownerName || !petType || !service || !date) {
    message.textContent = "Please complete all fields.";
    return;
  }

  const selectedDate = new Date(`${date}T00:00:00`);
  const currentDate = new Date(`${localToday}T00:00:00`);

  if (selectedDate < currentDate) {
    message.textContent = "Please select today or a future date.";
    return;
  }

  message.textContent =
    `Thank you, ${ownerName}! Your demo request for ${petType} care ` +
    `(${service}) on ${date} has been prepared. No appointment has been sent or confirmed.`;

  event.target.reset();
  bookingDate.min = localToday;
});

document.getElementById("year").textContent = new Date().getFullYear();
