// app.js
// Plain global JS, no modules.

// -------------------
// Data generator
// -------------------
const TAGS = [
  "Coffee","Hiking","Movies","Live Music","Board Games","Cats","Dogs","Traveler",
  "Foodie","Tech","Art","Runner","Climbing","Books","Yoga","Photography"
];
const FIRST_NAMES = [
  "Alex","Sam","Jordan","Taylor","Casey","Avery","Riley","Morgan","Quinn","Cameron",
  "Jamie","Drew","Parker","Reese","Emerson","Rowan","Shawn","Harper","Skyler","Devon"
];
const CITIES = [
  "Brooklyn","Manhattan","Queens","Jersey City","Hoboken","Astoria",
  "Williamsburg","Bushwick","Harlem","Lower East Side"
];
const JOBS = [
  "Product Designer","Software Engineer","Data Analyst","Barista","Teacher",
  "Photographer","Architect","Chef","Nurse","Marketing Manager","UX Researcher"
];
const BIOS = [
  "Weekend hikes and weekday lattes.",
  "Dog parent. Amateur chef. Karaoke enthusiast.",
  "Trying every taco in the city — for science.",
  "Bookstore browser and movie quote machine.",
  "Gym sometimes, Netflix always.",
  "Looking for the best slice in town.",
  "Will beat you at Mario Kart.",
  "Currently planning the next trip."
];

const UNSPLASH_SEEDS = [
  "1515462277126-2b47b9fa09e6",
  "1520975916090-3105956dac38",
  "1519340241574-2cec6aef0c01",
  "1554151228-14d9def656e4",
  "1548142813-c348350df52b",
  "1517841905240-472988babdf9",
  "1535713875002-d1d0cf377fde",
  "1545996124-0501ebae84d0",
  "1524504388940-b1c1722653e1",
  "1531123897727-8f129e1688ce",
];

function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickTags() { return Array.from(new Set(Array.from({length:4}, ()=>sample(TAGS)))); }
function imgFor(seed) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;
}

// Generate multiple random images for a profile (3-6 photos)
function generateImages() {
  const count = 3 + Math.floor(Math.random() * 4); // 3 to 6 photos
  const shuffled = [...UNSPLASH_SEEDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(imgFor);
}

function generateProfiles(count = 12) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const images = generateImages();
    profiles.push({
      id: `p_${i}_${Date.now().toString(36)}`,
      name: sample(FIRST_NAMES),
      age: 18 + Math.floor(Math.random() * 22),
      city: sample(CITIES),
      title: sample(JOBS),
      bio: sample(BIOS),
      tags: pickTags(),
      images: images,           // Array of photos
      img: images[0],           // Keep for backward compatibility
      currentPhotoIndex: 0,     // Track active photo
    });
  }
  return profiles;
}

// -------------------
// Photo Gallery State
// -------------------

// Track photo index for the top card
function getCurrentPhotoIndex() {
  if (profiles.length === 0) return 0;
  return profiles[0].currentPhotoIndex || 0;
}

function setCurrentPhotoIndex(index) {
  if (profiles.length === 0) return;
  const profile = profiles[0];
  const maxIndex = profile.images.length - 1;
  profile.currentPhotoIndex = Math.max(0, Math.min(index, maxIndex));
  updateCardPhoto();
}

function cycleToNextPhoto() {
  if (profiles.length === 0) return;
  const profile = profiles[0];
  const nextIndex = (profile.currentPhotoIndex + 1) % profile.images.length;
  setCurrentPhotoIndex(nextIndex);
}

function cycleToPrevPhoto() {
  if (profiles.length === 0) return;
  const profile = profiles[0];
  const prevIndex = profile.currentPhotoIndex - 1;
  setCurrentPhotoIndex(prevIndex < 0 ? profile.images.length - 1 : prevIndex);
}

function updateCardPhoto() {
  const topCard = deckEl.querySelector(".card:first-child");
  if (!topCard || profiles.length === 0) return;
  
  const profile = profiles[0];
  const imgEl = topCard.querySelector(".card__media");
  const indicators = topCard.querySelectorAll(".photo-indicator");
  
  if (imgEl) {
    imgEl.src = profile.images[profile.currentPhotoIndex];
  }
  
  // Update photo indicators
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle("active", i === profile.currentPhotoIndex);
  });
}

// -------------------
// Double-Tap Detection
// -------------------
let lastTapTime = 0;
let lastTapX = 0;
let tapTimeout = null;
const DOUBLE_TAP_DELAY = 300; // ms - max time between taps
const TAP_DISTANCE_THRESHOLD = 30; // px - max distance between taps

function handleTap(e) {
  // Don't process taps during drag (only if actual movement occurred)
  if (isDragging || hasMoved) return;
  
  const now = Date.now();
  const touch = e.touches ? e.changedTouches[0] : e;
  const tapX = touch.clientX;
  const tapY = touch.clientY;
  
  // Check if this could be a double-tap
  const timeDiff = now - lastTapTime;
  const distDiff = Math.abs(tapX - lastTapX);
  
  if (timeDiff < DOUBLE_TAP_DELAY && distDiff < TAP_DISTANCE_THRESHOLD) {
    // Double tap detected!
    clearTimeout(tapTimeout);
    handleDoubleTap(tapX);
    lastTapTime = 0;
    lastTapX = 0;
  } else {
    // Single tap - wait to see if it becomes double
    lastTapTime = now;
    lastTapX = tapX;
    
    // Clear any pending single-tap action
    clearTimeout(tapTimeout);
    tapTimeout = setTimeout(() => {
      // Single tap confirmed after delay - could add single-tap behavior here
      lastTapTime = 0;
    }, DOUBLE_TAP_DELAY);
  }
}

function handleDoubleTap(tapX) {
  const topCard = deckEl.querySelector(".card:first-child");
  if (!topCard) return;
  
  const cardRect = topCard.getBoundingClientRect();
  const cardCenter = cardRect.left + cardRect.width / 2;
  
  // Tap on left half = previous photo, right half = next photo
  if (tapX < cardCenter) {
    cycleToPrevPhoto();
  } else {
    cycleToNextPhoto();
  }
  
  // Visual feedback
  topCard.classList.add("photo-changed");
  setTimeout(() => topCard.classList.remove("photo-changed"), 150);
}

// -------------------
// Rewind History Stack
// -------------------
let actionHistory = []; // Stores swiped profiles for rewind
const MAX_HISTORY = 10;

function saveToHistory(profile, action) {
  actionHistory.push({ profile: { ...profile }, action });
  if (actionHistory.length > MAX_HISTORY) {
    actionHistory.shift();
  }
}

function rewindLastAction() {
  if (actionHistory.length === 0) {
    console.log("No actions to rewind");
    showToast("Nothing to rewind!");
    return;
  }
  
  // Block rewind while animation is in progress
  if (isAnimating) {
    showToast("Please wait...");
    return;
  }
  
  const lastAction = actionHistory.pop();
  lastAction.profile.currentPhotoIndex = 0; // Reset to first photo
  profiles.unshift(lastAction.profile);
  renderDeck();
  
  showToast(`Rewound: ${lastAction.profile.name}`);
  console.log(`Rewound ${lastAction.action} on ${lastAction.profile.name}`);
}

// -------------------
// Boost Feature
// -------------------
let boostActive = false;
let boostTimeout = null;

function activateBoost() {
  if (boostActive) {
    showToast("Boost already active!");
    return;
  }
  
  boostActive = true;
  const topCard = deckEl.querySelector(".card:first-child");
  if (topCard) {
    topCard.classList.add("boosted");
  }
  
  showToast("⚡ BOOST ACTIVATED! ⚡");
  
  // Boost lasts for visual effect duration
  boostTimeout = setTimeout(() => {
    boostActive = false;
    const card = deckEl.querySelector(".card:first-child");
    if (card) card.classList.remove("boosted");
  }, 3000);
}

// -------------------
// Toast Notifications
// -------------------
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add("show"));
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// -------------------
// UI rendering
// -------------------
const deckEl = document.getElementById("deck");
const shuffleBtn = document.getElementById("shuffleBtn");
const likeBtn = document.getElementById("likeBtn");
const nopeBtn = document.getElementById("nopeBtn");
const superLikeBtn = document.getElementById("superLikeBtn");
const rewindBtn = document.getElementById("rewindBtn");
const boostBtn = document.getElementById("boostBtn");

let profiles = [];

function renderDeck() {
  deckEl.setAttribute("aria-busy", "true");
  deckEl.innerHTML = "";

  profiles.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.profileId = p.id;

    // Photo indicators (dots showing which photo is active)
    if (p.images && p.images.length > 1) {
      const indicatorContainer = document.createElement("div");
      indicatorContainer.className = "photo-indicators";
      
      p.images.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = `photo-indicator${i === p.currentPhotoIndex ? " active" : ""}`;
        indicatorContainer.appendChild(dot);
      });
      
      card.appendChild(indicatorContainer);
    }

    // Tap zones for photo navigation (left/right areas)
    const tapZoneLeft = document.createElement("div");
    tapZoneLeft.className = "tap-zone tap-zone--left";
    const tapZoneRight = document.createElement("div");
    tapZoneRight.className = "tap-zone tap-zone--right";
    card.appendChild(tapZoneLeft);
    card.appendChild(tapZoneRight);

    const img = document.createElement("img");
    img.className = "card__media";
    const photoIndex = p.currentPhotoIndex || 0;
    img.src = p.images ? p.images[photoIndex] : p.img;
    img.alt = `${p.name} — profile photo ${photoIndex + 1} of ${p.images ? p.images.length : 1}`;

    const body = document.createElement("div");
    body.className = "card__body";

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    titleRow.innerHTML = `
      <h2 class="card__title">${p.name}</h2>
      <span class="card__age">${p.age}</span>
    `;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.textContent = `${p.title} • ${p.city}`;

    const chips = document.createElement("div");
    chips.className = "card__chips";
    p.tags.forEach((t) => {
      const c = document.createElement("span");
      c.className = "chip";
      c.textContent = t;
      chips.appendChild(c);
    });

    body.appendChild(titleRow);
    body.appendChild(meta);
    body.appendChild(chips);

    card.appendChild(img);
    card.appendChild(body);

    deckEl.appendChild(card);
  });

  deckEl.removeAttribute("aria-busy");
  attachDoubleTapListeners();
}

// Attach double-tap listeners to top card
function attachDoubleTapListeners() {
  const topCard = deckEl.querySelector(".card:first-child");
  if (!topCard) return;
  
  // Touch events for mobile
  topCard.addEventListener("touchend", handleTap, { passive: true });
  
  // Click events for desktop (double-click)
  topCard.addEventListener("dblclick", (e) => {
    handleDoubleTap(e.clientX);
  });
}

function resetDeck() {
  profiles = generateProfiles(12);
  actionHistory = []; // Clear history on shuffle
  renderDeck();
}

// Controls - Map all buttons to their actions
likeBtn.addEventListener("click", () => {
  likeTopCard();
});
nopeBtn.addEventListener("click", () => {
  rejectTopCard();
});
superLikeBtn.addEventListener("click", () => {
  superLikeTopCard();
});
shuffleBtn.addEventListener("click", resetDeck);

// Rewind button - undo last action
if (rewindBtn) {
  rewindBtn.addEventListener("click", () => {
    rewindLastAction();
  });
}

// Boost button - highlight current profile
if (boostBtn) {
  boostBtn.addEventListener("click", () => {
    activateBoost();
  });
}

// -------------------
// Swipe Actions
// -------------------

// Swipe left - Reject/Nope
function rejectTopCard() {
  const topCard = deckEl.querySelector(".card:first-child");
  if (!topCard || profiles.length === 0 || isAnimating) return;

  // Save to history and shift state immediately to prevent race conditions
  saveToHistory(profiles[0], "nope");
  profiles.shift();
  isAnimating = true;

  // Remove swiping class to enable transitions
  topCard.classList.remove("swiping");
  
  // Animate card off screen using inline style
  topCard.style.transition = "transform 300ms ease, opacity 300ms ease";
  topCard.style.transform = "translateX(-150%) rotate(-30deg)";
  topCard.style.opacity = "0";
  
  topCard.addEventListener("transitionend", () => {
    topCard.remove();
    isAnimating = false;
    attachDoubleTapListeners(); // Reattach listeners to new top card
    console.log("Card rejected.");
    showToast("Nope! 👎");
  }, { once: true });
}

// Swipe right - Like
function likeTopCard() {
  const topCard = deckEl.querySelector(".card:first-child");
  if (!topCard || profiles.length === 0 || isAnimating) return;

  // Save to history and shift state immediately to prevent race conditions
  saveToHistory(profiles[0], "like");
  profiles.shift();
  isAnimating = true;

  // Remove swiping class to enable transitions
  topCard.classList.remove("swiping");
  
  // Animate card off screen to the right
  topCard.style.transition = "transform 300ms ease, opacity 300ms ease";
  topCard.style.transform = "translateX(150%) rotate(30deg)";
  topCard.style.opacity = "0";
  
  topCard.addEventListener("transitionend", () => {
    topCard.remove();
    isAnimating = false;
    attachDoubleTapListeners(); // Reattach listeners to new top card
    console.log("Card liked!");
    showToast("It's a Like! 💚");
  }, { once: true });
}

// Swipe up - Super Like
function superLikeTopCard() {
  const topCard = deckEl.querySelector(".card:first-child");
  if (!topCard || profiles.length === 0 || isAnimating) return;

  // Save to history and shift state immediately to prevent race conditions
  saveToHistory(profiles[0], "superlike");
  profiles.shift();
  isAnimating = true;

  // Remove swiping class to enable transitions
  topCard.classList.remove("swiping");
  
  // Animate card off screen upward
  topCard.style.transition = "transform 300ms ease, opacity 300ms ease";
  topCard.style.transform = "translateY(-150%) scale(1.1)";
  topCard.style.opacity = "0";
  
  topCard.addEventListener("transitionend", () => {
    topCard.remove();
    isAnimating = false;
    attachDoubleTapListeners(); // Reattach listeners to new top card
    console.log("Card super liked!");
    showToast("SUPER LIKE! ⭐");
  }, { once: true });
}

// Swipe detection
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let hasMoved = false; // Track if actual drag movement occurred
let isAnimating = false; // Block actions while swipe animation is running
const SWIPE_THRESHOLD = 50;
const SWIPE_UP_THRESHOLD = 80; // Higher threshold for vertical swipes
const DRAG_MULTIPLIER = 1.5;
const MOVE_THRESHOLD = 5; // Minimum movement to count as a drag

function getTopCard() {
  return deckEl.querySelector(".card:first-child");
}

function handleDragStart(e) {
  const topCard = getTopCard();
  if (!topCard || isAnimating) return;
  
  isDragging = true;
  hasMoved = false;
  startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
  // Initialize current coordinates to start position
  currentX = startX;
  currentY = startY;
  topCard.classList.add("swiping");
}

function handleDragMove(e) {
  if (!isDragging) return;
  
  const topCard = getTopCard();
  if (!topCard) return;
  
  currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
  currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
  
  const deltaX = (currentX - startX) * DRAG_MULTIPLIER;
  const deltaY = (currentY - startY) * DRAG_MULTIPLIER;
  
  // Mark as moved only if movement exceeds threshold
  if (!hasMoved && (Math.abs(currentX - startX) > MOVE_THRESHOLD || Math.abs(currentY - startY) > MOVE_THRESHOLD)) {
    hasMoved = true;
  }
  const rotation = deltaX * 0.1;
  
  // Determine primary direction based on which axis has more movement
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  if (absY > absX && deltaY < 0) {
    // Moving up - potential super like
    topCard.style.transform = `translateY(${deltaY}px) scale(${1 + Math.abs(deltaY) * 0.001})`;
  } else {
    // Moving horizontally - like or nope
    topCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
  }
}

function handleDragEnd() {
  if (!isDragging) return;
  
  const topCard = getTopCard();
  if (!topCard) return;
  
  isDragging = false;
  
  const deltaX = (currentX - startX) * DRAG_MULTIPLIER;
  const deltaY = (currentY - startY) * DRAG_MULTIPLIER;
  
  // Only process as swipe if actual movement occurred
  if (hasMoved) {
    // Determine primary swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absY > absX && deltaY < -SWIPE_UP_THRESHOLD) {
      // Swipe up - super like
      superLikeTopCard();
    } else if (deltaX < -SWIPE_THRESHOLD) {
      // Swipe left - reject/nope
      rejectTopCard();
    } else if (deltaX > SWIPE_THRESHOLD) {
      // Swipe right - like
      likeTopCard();
    } else {
      // Reset card position (swipe not decisive enough)
      topCard.classList.remove("swiping");
      topCard.style.transform = "";
    }
  } else {
    // No movement - just reset the swiping state
    topCard.classList.remove("swiping");
    topCard.style.transform = "";
  }
  
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;
  // Reset hasMoved after a short delay to allow tap handler to check it
  setTimeout(() => { hasMoved = false; }, 0);
}

// Mouse events
deckEl.addEventListener("mousedown", handleDragStart);
document.addEventListener("mousemove", handleDragMove);
document.addEventListener("mouseup", handleDragEnd);

// Touch events
deckEl.addEventListener("touchstart", handleDragStart, { passive: true });
document.addEventListener("touchmove", handleDragMove, { passive: true });
document.addEventListener("touchend", handleDragEnd);

// Boot
resetDeck();
