/* ============================================================
   DJ TAVIK - Booking form validation (front-end only)
   ============================================================ */
(function () {
  "use strict";

  const form = document.getElementById("booking-form");
  if (!form) return;

  const success = form.querySelector(".form-success");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setState(field, ok, msg) {
    field.classList.toggle("invalid", !ok);
    const err = field.querySelector(".error-msg");
    if (err && msg) err.textContent = msg;
    return ok;
  }

  function validateField(input) {
    const field = input.closest(".field");
    const val = input.value.trim();

    if (input.hasAttribute("required") && !val) {
      return setState(field, false, "This field is required.");
    }
    if (input.type === "email" && val && !emailRe.test(val)) {
      return setState(field, false, "Enter a valid email address.");
    }
    if (input.type === "date" && val) {
      const chosen = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        return setState(field, false, "Please choose a future date.");
      }
    }
    return setState(field, true);
  }

  const inputs = Array.prototype.slice.call(
    form.querySelectorAll("input, select, textarea")
  );

  inputs.forEach(function (input) {
    input.addEventListener("blur", function () {
      validateField(input);
    });
    input.addEventListener("input", function () {
      if (input.closest(".field").classList.contains("invalid")) {
        validateField(input);
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    let allValid = true;
    inputs.forEach(function (input) {
      if (!validateField(input)) allValid = false;
    });

    if (!allValid) {
      success.classList.remove("show");
      const firstInvalid = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Front-end only: no backend. Show a confirmation.
    form.reset();
    success.classList.add("show");
    success.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(function () {
      success.classList.remove("show");
    }, 6000);
  });
})();
