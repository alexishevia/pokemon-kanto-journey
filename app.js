// Journey state: { milestoneId: [pokemonId | null, ...] }
const journeyState = {};

// Ordered list of milestone IDs (can be reordered by user)
let milestoneOrder = MILESTONES.map((m) => m.id);

function getMilestoneById(id) {
  return MILESTONES.find((m) => m.id === id);
}

function initState() {
  MILESTONES.forEach((m) => {
    journeyState[m.id] = new Array(m.maxPokemon).fill(null);
  });
}

function moveMilestone(milestoneId, direction) {
  const idx = milestoneOrder.indexOf(milestoneId);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= milestoneOrder.length) return;
  [milestoneOrder[idx], milestoneOrder[newIdx]] = [milestoneOrder[newIdx], milestoneOrder[idx]];
  buildUI();
  renderJourney(document.getElementById("journey-canvas"), journeyState);
}

// Get Pokemon already selected in a given milestone (to prevent duplicates within same team)
function getSelectedInMilestone(milestoneId, excludeSlot) {
  const selected = new Set();
  journeyState[milestoneId].forEach((id, i) => {
    if (id !== null && i !== excludeSlot) selected.add(id);
  });
  return selected;
}

function buildUI() {
  const panel = document.getElementById("input-panel");
  panel.innerHTML = "";

  milestoneOrder.forEach((milestoneId, orderIdx) => {
    const milestone = getMilestoneById(milestoneId);
    const div = document.createElement("div");
    div.className = "milestone";

    const header = document.createElement("div");
    header.className = "milestone-header";

    const arrows = document.createElement("div");
    arrows.className = "milestone-arrows";

    const upBtn = document.createElement("button");
    upBtn.className = "arrow-btn";
    upBtn.textContent = "▲";
    upBtn.disabled = orderIdx === 0;
    upBtn.addEventListener("click", () => moveMilestone(milestoneId, -1));

    const downBtn = document.createElement("button");
    downBtn.className = "arrow-btn";
    downBtn.textContent = "▼";
    downBtn.disabled = orderIdx === milestoneOrder.length - 1;
    downBtn.addEventListener("click", () => moveMilestone(milestoneId, 1));

    arrows.appendChild(upBtn);
    arrows.appendChild(downBtn);

    const label = document.createElement("div");
    label.className = "milestone-label";
    label.textContent = `${milestone.label} — ${milestone.subtitle}`;

    header.appendChild(arrows);
    header.appendChild(label);
    div.appendChild(header);

    const slotsDiv = document.createElement("div");
    slotsDiv.className = "pokemon-slots";

    for (let i = 0; i < milestone.maxPokemon; i++) {
      slotsDiv.appendChild(createSlot(milestone.id, i));
    }

    div.appendChild(slotsDiv);
    panel.appendChild(div);
  });
}

function createSlot(milestoneId, slotIndex) {
  const slot = document.createElement("div");
  slot.className = "pokemon-slot";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Pokemon ${slotIndex + 1}`;
  input.autocomplete = "off";

  // Restore existing state
  const existingPokemonId = journeyState[milestoneId]?.[slotIndex];
  if (existingPokemonId !== null && existingPokemonId !== undefined) {
    const pokemon = POKEMON.find((p) => p.id === existingPokemonId);
    if (pokemon) {
      input.value = pokemon.name;
      input.classList.add("has-selection");
    }
  }

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  const spritePreview = document.createElement("canvas");
  spritePreview.className = "slot-sprite";
  spritePreview.width = 24;
  spritePreview.height = 24;
  spritePreview.style.display = "none";

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-btn";
  clearBtn.textContent = "×";
  clearBtn.title = "Clear";

  let highlightedIndex = -1;
  let filteredList = [];

  function createDropdownItem(pokemon) {
    const item = document.createElement("div");
    item.className = "dropdown-item";

    const miniCanvas = document.createElement("canvas");
    miniCanvas.width = 24;
    miniCanvas.height = 24;
    const coords = getSpriteCoords(pokemon.id);
    if (spritesheetLoaded) {
      const mctx = miniCanvas.getContext("2d");
      mctx.imageSmoothingEnabled = false;
      mctx.drawImage(
        spritesheetImg,
        coords.x, coords.y, SPRITE_SIZE, SPRITE_SIZE,
        0, 0, 24, 24
      );
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = pokemon.name;

    item.appendChild(miniCanvas);
    item.appendChild(nameSpan);
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      selectPokemon(pokemon);
    });
    return item;
  }

  function getPrevMilestonePokemon() {
    const milestoneIdx = milestoneOrder.indexOf(milestoneId);
    for (let i = milestoneIdx - 1; i >= 0; i--) {
      const prevId = journeyState[milestoneOrder[i]]?.[slotIndex];
      if (prevId !== null && prevId !== undefined) return prevId;
    }
    return null;
  }

  function showDropdown(filter) {
    const selected = getSelectedInMilestone(milestoneId, slotIndex);
    const available = POKEMON.filter((p) => !selected.has(p.id));
    const query = filter.toLowerCase().trim();

    let filtered = query
      ? available.filter((p) => p.name.toLowerCase().includes(query))
      : available;

    // Build suggested section: previous pokemon + its evolutions
    const prevPokemonId = getPrevMilestonePokemon();
    let suggested = [];
    if (prevPokemonId !== null) {
      const familyIds = new Set(getFamilyMembers(prevPokemonId));
      const prevPokemon = filtered.find((p) => p.id === prevPokemonId);
      const evolutions = filtered.filter((p) => familyIds.has(p.id) && p.id !== prevPokemonId);
      if (prevPokemon) suggested.push(prevPokemon);
      suggested.push(...evolutions);
    }

    filteredList = [...suggested, ...filtered];

    highlightedIndex = -1;
    dropdown.innerHTML = "";

    // Render suggested section
    if (suggested.length > 0 && !query) {
      suggested.forEach((pokemon) => {
        dropdown.appendChild(createDropdownItem(pokemon));
      });
      const divider = document.createElement("div");
      divider.className = "dropdown-divider";
      dropdown.appendChild(divider);
    }

    // Render full list
    filtered.forEach((pokemon) => {
      dropdown.appendChild(createDropdownItem(pokemon));
    });

    dropdown.classList.add("open");
  }

  function hideDropdown() {
    dropdown.classList.remove("open");
    highlightedIndex = -1;
  }

  function selectPokemon(pokemon) {
    journeyState[milestoneId][slotIndex] = pokemon.id;
    input.value = pokemon.name;
    input.classList.add("has-selection");
    hideDropdown();
    updateSpritePreview(pokemon.id);
    renderJourney(document.getElementById("journey-canvas"), journeyState);
  }

  function clearSlot() {
    journeyState[milestoneId][slotIndex] = null;
    input.value = "";
    input.classList.remove("has-selection");
    spritePreview.style.display = "none";
    renderJourney(document.getElementById("journey-canvas"), journeyState);
  }

  function updateSpritePreview(pokemonId) {
    if (!spritesheetLoaded) return;
    const coords = getSpriteCoords(pokemonId);
    const ctx = spritePreview.getContext("2d");
    ctx.clearRect(0, 0, 24, 24);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      spritesheetImg,
      coords.x, coords.y, SPRITE_SIZE, SPRITE_SIZE,
      0, 0, 24, 24
    );
    spritePreview.style.display = "block";
  }

  function highlightItem(index) {
    const items = dropdown.querySelectorAll(".dropdown-item");
    items.forEach((item, i) => {
      item.classList.toggle("highlighted", i === index);
    });
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  }

  input.addEventListener("focus", () => {
    if (!input.classList.contains("has-selection")) {
      showDropdown(input.value);
    }
  });

  input.addEventListener("input", () => {
    if (input.classList.contains("has-selection")) {
      journeyState[milestoneId][slotIndex] = null;
      input.classList.remove("has-selection");
      spritePreview.style.display = "none";
      renderJourney(document.getElementById("journey-canvas"), journeyState);
    }
    showDropdown(input.value);
  });

  input.addEventListener("blur", () => {
    hideDropdown();
  });

  input.addEventListener("keydown", (e) => {
    if (!dropdown.classList.contains("open")) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedIndex = Math.min(highlightedIndex + 1, filteredList.length - 1);
      highlightItem(highlightedIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      highlightItem(highlightedIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredList[highlightedIndex]) {
        selectPokemon(filteredList[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      hideDropdown();
      input.blur();
    }
  });

  clearBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    clearSlot();
    input.focus();
  });

  slot.appendChild(input);
  slot.appendChild(dropdown);
  slot.appendChild(spritePreview);
  slot.appendChild(clearBtn);

  // Restore sprite preview for existing selection
  if (existingPokemonId !== null && existingPokemonId !== undefined) {
    updateSpritePreview(existingPokemonId);
  }

  return slot;
}

// Initialize
async function init() {
  initState();
  await Promise.all([loadSpritesheet(), loadTrainerSheet()]);
  buildUI();
  renderJourney(document.getElementById("journey-canvas"), journeyState);

  document.getElementById("download-btn").addEventListener("click", () => {
    downloadCanvas(document.getElementById("journey-canvas"));
  });
}

init();
