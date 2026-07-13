/* ============================================================
   DJ TAVIK - Booking details modal -> WhatsApp
   ============================================================ */
(function () {
  "use strict";

  const openBtn = document.getElementById("open-booking-modal");
  const modal = document.getElementById("booking-modal");
  if (!openBtn || !modal) return;

  const form = document.getElementById("bm-form");
  const phone = "917259262657";

  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const first = form.querySelector("input, select, textarea");
    if (first) first.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openModal);

  modal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* live duration slider value */
  const durEl = document.getElementById("bm-duration");
  const durVal = document.getElementById("bm-duration-val");

  function formatHours(n) {
    return n + (n === "1" ? " hour" : " hours");
  }

  if (durEl && durVal) {
    const updateDur = function () {
      durVal.textContent = formatHours(durEl.value);
    };
    durEl.addEventListener("input", updateDur);
    updateDur();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const val = function (id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    const lines = ["Hey DJ Tavik, we are looking to book a DJ for our event.", ""];

    const fields = [
      ["Client Name", "bm-name"],
      ["Contact Number", "bm-phone"],
      ["Type of Party/Event", "bm-type"],
      ["Age Group of Attendants", "bm-age"],
      ["Date", "bm-date"],
      ["Venue", "bm-venue"],
      ["Duration of Event", "bm-duration"],
      ["Sounds & Light Equipments", "bm-equipment"],
    ];

    fields.forEach(function (f) {
      let value = val(f[1]);
      if (!value) return;
      if (f[1] === "bm-duration") value = formatHours(value);
      lines.push(f[0] + ": " + value);
    });

    const text = encodeURIComponent(lines.join("\n"));
    window.open("https://wa.me/" + phone + "?text=" + text, "_blank", "noopener");
    closeModal();
  });
})();
