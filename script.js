/* ===== FreshFoldX Laundromat — shared script ===== */

/* ---------- EDIT THESE SETTINGS ---------- */
const CONFIG = {
  businessName: "FreshFoldX Laundromat",
  whatsappNumber: "254742890211", // international format, no + or spaces
  shopLocation: "Next to The Williis Hotel, Bomet",

  // Pickup & delivery areas around Bomet — add/remove freely
  areas: [
    "Bomet Town (CBD)",
    "Silibwet",
    "Sotik",
    "Longisa",
    "Mogogosiek",
    "Ndanai",
    "Sigor",
    "Chebunyo",
    "Kapsimotwo",
    "Mulot",
    "Tenwek",
  ],

  // Time slots for pickup / delivery / drop-off
  timeSlots: [
    "8:00 AM – 10:00 AM",
    "10:00 AM – 12:00 PM",
    "12:00 PM – 2:00 PM",
    "2:00 PM – 4:00 PM",
    "4:00 PM – 6:00 PM",
  ],
};
/* ----------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu
  const toggle = document.getElementById("menuToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  // Booking page only
  if (document.getElementById("bookingForm")) initBooking();
});

function initBooking() {
  const $ = (id) => document.getElementById(id);
  const form = $("bookingForm");

  /* ---- Fill dropdowns and sidebar tags ---- */
  const areaOptions =
    `<option value="">Select area…</option>` +
    CONFIG.areas.map((a) => `<option>${a}</option>`).join("") +
    `<option>Other (write it in the place field)</option>`;
  const slotOptions =
    `<option value="">Select time…</option>` +
    CONFIG.timeSlots.map((s) => `<option>${s}</option>`).join("");

  ["pickupArea", "deliveryArea"].forEach((id) => ($(id).innerHTML = areaOptions));
  ["pickupTime", "deliveryTime", "visitTime"].forEach((id) => ($(id).innerHTML = slotOptions));
  $("areaTags").innerHTML = CONFIG.areas.map((a) => `<span class="tag">${a}</span>`).join("");
  $("slotTags").innerHTML = CONFIG.timeSlots.map((s) => `<span class="tag">${s}</span>`).join("");

  /* ---- Dates: no past dates ---- */
  const today = new Date();
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const todayIso = iso(today);
  ["pickupDate", "deliveryDate", "visitDate"].forEach((id) => ($(id).min = todayIso));
  $("pickupDate").addEventListener("change", () => {
    $("deliveryDate").min = $("pickupDate").value || todayIso;
  });

  /* ---- Toggle: pickup & delivery vs drop-off ---- */
  const modeRadios = form.querySelectorAll('input[name="mode"]');
  const getMode = () => form.querySelector('input[name="mode"]:checked').value;
  const applyMode = () => {
    const pickup = getMode() === "pickup";
    $("pickupBlock").classList.toggle("hidden", !pickup);
    $("dropoffBlock").classList.toggle("hidden", pickup);
    $("summary").classList.remove("show");
  };
  modeRadios.forEach((r) => r.addEventListener("change", applyMode));

  /* ---- Toggle: same place for delivery ---- */
  $("sameAsPickup").addEventListener("change", () => {
    $("deliveryFields").classList.toggle("hidden", $("sameAsPickup").checked);
  });

  /* ---- Validation helpers ---- */
  const setInvalid = (el, bad) => {
    const field = el.closest(".field");
    if (field) field.classList.toggle("invalid", bad);
    return bad;
  };
  const validPhone = (v) => /^(?:\+?254|0)?(7|1)\d{8}$/.test(v.replace(/[\s-]/g, ""));
  const normalisePhone = (v) => {
    const d = v.replace(/[\s-]/g, "").replace(/^\+/, "");
    if (d.startsWith("254")) return "+" + d;
    return "+254" + d.replace(/^0/, "");
  };

  function validate() {
    let bad = false;
    const mode = getMode();

    bad = setInvalid($("name"), $("name").value.trim().length < 2) || bad;
    bad = setInvalid($("phone"), !validPhone($("phone").value)) || bad;

    const services = form.querySelectorAll('input[name="service"]:checked');
    const noService = services.length === 0;
    $("serviceField").classList.toggle("invalid", noService);
    bad = noService || bad;

    if (mode === "pickup") {
      bad = setInvalid($("pickupArea"), !$("pickupArea").value) || bad;
      bad = setInvalid($("pickupPlace"), $("pickupPlace").value.trim().length < 3) || bad;
      bad = setInvalid($("pickupDate"), !$("pickupDate").value || $("pickupDate").value < todayIso) || bad;
      bad = setInvalid($("pickupTime"), !$("pickupTime").value) || bad;

      if (!$("sameAsPickup").checked) {
        bad = setInvalid($("deliveryArea"), !$("deliveryArea").value) || bad;
        bad = setInvalid($("deliveryPlace"), $("deliveryPlace").value.trim().length < 3) || bad;
      }
      bad =
        setInvalid(
          $("deliveryDate"),
          !$("deliveryDate").value || $("deliveryDate").value < ($("pickupDate").value || todayIso)
        ) || bad;
      bad = setInvalid($("deliveryTime"), !$("deliveryTime").value) || bad;
    } else {
      bad = setInvalid($("visitDate"), !$("visitDate").value || $("visitDate").value < todayIso) || bad;
      bad = setInvalid($("visitTime"), !$("visitTime").value) || bad;
    }
    return !bad;
  }

  const prettyDate = (v) =>
    new Date(v + "T00:00:00").toLocaleDateString("en-KE", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });

  /* ---- Build booking message ---- */
  function buildMessage() {
    const mode = getMode();
    const services = [...form.querySelectorAll('input[name="service"]:checked')].map((c) => c.value);
    const lines = [
      `*New booking — ${CONFIG.businessName}*`,
      ``,
      `Name: ${$("name").value.trim()}`,
      `Phone: ${normalisePhone($("phone").value)}`,
      `Services: ${services.join(", ")}`,
    ];

    if (mode === "pickup") {
      const same = $("sameAsPickup").checked;
      const delArea = same ? $("pickupArea").value : $("deliveryArea").value;
      const delPlace = same ? $("pickupPlace").value.trim() : $("deliveryPlace").value.trim();
      lines.push(
        `Type: Pickup & delivery`,
        ``,
        `PICKUP`,
        `Area: ${$("pickupArea").value}`,
        `Place: ${$("pickupPlace").value.trim()}`,
        `Date: ${prettyDate($("pickupDate").value)}`,
        `Time: ${$("pickupTime").value}`,
        ``,
        `DELIVERY`,
        `Area: ${delArea}`,
        `Place: ${delPlace}`,
        `Date: ${prettyDate($("deliveryDate").value)}`,
        `Time: ${$("deliveryTime").value}`
      );
    } else {
      lines.push(
        `Type: Customer drop-off at shop (${CONFIG.shopLocation})`,
        `Date: ${prettyDate($("visitDate").value)}`,
        `Time: ${$("visitTime").value}`
      );
    }
    const notes = $("notes").value.trim();
    if (notes) lines.push(``, `Notes: ${notes}`);
    return lines.join("\n");
  }

  /* ---- Submit ---- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstBad = form.querySelector(".invalid");
      if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      $("summary").classList.remove("show");
      return;
    }
    const msg = buildMessage();
    $("summaryText").textContent = msg.replace(/\*/g, "");
    $("whatsappBtn").href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    $("summary").classList.add("show");
    $("summary").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* ---- Copy details ---- */
  $("copyBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("summaryText").textContent);
      $("copyBtn").textContent = "Copied ✓";
    } catch {
      $("copyBtn").textContent = "Copy failed — select the text manually";
    }
    setTimeout(() => ($("copyBtn").textContent = "Copy details"), 2000);
  });

  /* Clear error state as the user edits */
  form.addEventListener("input", (e) => {
    const f = e.target.closest && e.target.closest(".field");
    if (f) f.classList.remove("invalid");
    if (e.target.name === "service") $("serviceField").classList.remove("invalid");
  });
}