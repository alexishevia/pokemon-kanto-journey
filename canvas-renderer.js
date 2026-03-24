// Canvas renderer - vertical columns layout
// Each milestone is a column: trainer sprite on top, pokemon below
// Rows are assigned dynamically by evolution family

const CANVAS_PADDING = 40;
const COL_WIDTH = 140;
const COL_GAP = 20;
const TRAINER_DRAW_SIZE = 64;
const SPRITE_DRAW_SIZE = 64;
const SPRITE_GAP = 8;
const LABEL_HEIGHT = 48;
const TRAINER_POKEMON_GAP = 12;
const E4_TRAINER_SIZE = 56;
const E4_TRAINER_GAP = 2;

let spritesheetImg = null;
let spritesheetLoaded = false;
const trainerImages = {};
let trainerImagesLoaded = false;

function loadSpritesheet() {
  return new Promise((resolve, reject) => {
    if (spritesheetLoaded) {
      resolve(spritesheetImg);
      return;
    }
    spritesheetImg = new Image();
    spritesheetImg.onload = () => {
      spritesheetLoaded = true;
      resolve(spritesheetImg);
    };
    spritesheetImg.onerror = reject;
    spritesheetImg.src = "assets/pokemon-spritesheet.png";
  });
}

function loadTrainerImages() {
  if (trainerImagesLoaded) return Promise.resolve(trainerImages);
  const promises = TRAINER_SPRITES.map((name) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        trainerImages[name] = img;
        resolve();
      };
      img.onerror = reject;
      img.src = `assets/trainers/${name}.png`;
    });
  });
  return Promise.all(promises).then(() => {
    trainerImagesLoaded = true;
    return trainerImages;
  });
}

// Compute the list of evolution family rows used across all milestones.
// Returns an ordered array of familyIds, in order of first appearance.
function computeFamilyRows(journeyState) {
  const seen = new Set();
  const rows = [];
  const orderedMilestones = milestoneOrder.map((id) => getMilestoneById(id));
  for (const m of orderedMilestones) {
    const team = journeyState[m.id] || [];
    for (const pokemonId of team) {
      if (pokemonId === null) continue;
      const familyId = EVOLUTION_FAMILY[pokemonId];
      if (!seen.has(familyId)) {
        seen.add(familyId);
        rows.push(familyId);
      }
    }
  }
  return rows;
}

// For a given milestone's team and family rows, build a map: familyId -> pokemonId
function buildFamilyMap(team) {
  const map = {};
  for (const pokemonId of team) {
    if (pokemonId === null) continue;
    const familyId = EVOLUTION_FAMILY[pokemonId];
    map[familyId] = pokemonId;
  }
  return map;
}

function renderJourney(canvas, journeyState) {
  if (!spritesheetLoaded || !trainerImagesLoaded) return;

  const ctx = canvas.getContext("2d");

  // Only render milestones that have at least one pokemon, in user's order
  const activeMilestones = milestoneOrder
    .map((id) => getMilestoneById(id))
    .filter((m) => journeyState[m.id]?.some((p) => p !== null)
  );

  if (activeMilestones.length === 0) {
    canvas.width = 600;
    canvas.height = 150;
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#999";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Add Pokemon to your milestones to see the journey!",
      canvas.width / 2,
      canvas.height / 2
    );
    return;
  }

  // Compute family-based rows
  const familyRows = computeFamilyRows(journeyState);
  const numRows = familyRows.length;

  // Calculate trainer area height (E4 column needs more space for stacked trainers)
  const trainerAreaHeight = TRAINER_DRAW_SIZE;

  // Calculate canvas size
  const totalCols = activeMilestones.length;
  const canvasWidth = CANVAS_PADDING * 2 + totalCols * COL_WIDTH + (totalCols - 1) * COL_GAP;
  const canvasHeight =
    CANVAS_PADDING * 2 +
    LABEL_HEIGHT +
    trainerAreaHeight +
    TRAINER_POKEMON_GAP +
    numRows * (SPRITE_DRAW_SIZE + SPRITE_GAP);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Disable smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each milestone as a column
  activeMilestones.forEach((milestone, colIndex) => {
    const x = CANVAS_PADDING + colIndex * (COL_WIDTH + COL_GAP);
    let y = CANVAS_PADDING;

    // Label
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(milestone.label, x + COL_WIDTH / 2, y);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText(milestone.subtitle, x + COL_WIDTH / 2, y + 20);
    y += LABEL_HEIGHT;

    // Trainer sprite(s)
    if (Array.isArray(milestone.trainerSprite)) {
      // Elite Four: 2-row team photo layout
      // Back row (3 trainers, smaller), front row (2 trainers, slightly larger)
      const backRow = milestone.trainerSprite.slice(0, 3);
      const frontRow = milestone.trainerSprite.slice(3);
      const backSize = 44;
      const frontSize = 52;
      const backGap = 2;
      const frontGap = 4;

      // Back row - centered
      const backTotalW = backRow.length * backSize + (backRow.length - 1) * backGap;
      const backStartX = x + (COL_WIDTH - backTotalW) / 2;
      const backY = y + (TRAINER_DRAW_SIZE - backSize - frontSize) / 2;
      backRow.forEach((name, i) => {
        const tImg = trainerImages[name];
        if (tImg) {
          ctx.drawImage(
            tImg,
            0, 0, tImg.width, tImg.height,
            backStartX + i * (backSize + backGap), backY,
            backSize, backSize
          );
        }
      });

      // Front row - centered, slightly overlapping back row
      const frontTotalW = frontRow.length * frontSize + (frontRow.length - 1) * frontGap;
      const frontStartX = x + (COL_WIDTH - frontTotalW) / 2;
      const frontY = backY + backSize - 8;
      frontRow.forEach((name, i) => {
        const tImg = trainerImages[name];
        if (tImg) {
          ctx.drawImage(
            tImg,
            0, 0, tImg.width, tImg.height,
            frontStartX + i * (frontSize + frontGap), frontY,
            frontSize, frontSize
          );
        }
      });
    } else {
      const tImg = trainerImages[milestone.trainerSprite];
      if (tImg) {
        const trainerX = x + (COL_WIDTH - TRAINER_DRAW_SIZE) / 2;
        ctx.drawImage(
          tImg,
          0, 0, tImg.width, tImg.height,
          trainerX, y,
          TRAINER_DRAW_SIZE, TRAINER_DRAW_SIZE
        );
      }
    }
    y += trainerAreaHeight + TRAINER_POKEMON_GAP;

    // Pokemon sprites (family-based rows with gaps)
    const familyMap = buildFamilyMap(journeyState[milestone.id] || []);
    familyRows.forEach((familyId) => {
      const pokemonId = familyMap[familyId];
      if (pokemonId) {
        const coords = getSpriteCoords(pokemonId);
        const spriteX = x + (COL_WIDTH - SPRITE_DRAW_SIZE) / 2;
        ctx.drawImage(
          spritesheetImg,
          coords.x, coords.y,
          SPRITE_SIZE, SPRITE_SIZE,
          spriteX, y,
          SPRITE_DRAW_SIZE, SPRITE_DRAW_SIZE
        );
      }
      y += SPRITE_DRAW_SIZE + SPRITE_GAP;
    });
  });
}

function downloadCanvas(canvas) {
  const link = document.createElement("a");
  link.download = "my-kanto-journey.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
