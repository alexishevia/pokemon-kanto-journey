// Each milestone has a trainerIndex matching position in trainers-spritesheet.png (64x64 each)
// Spritesheet order: brock, misty, ltsurge, erika, koga, sabrina, blaine, giovanni, lorelei, bruno, agatha, lance, blue
const TRAINER_SPRITE_SIZE = 80;

const MILESTONES = [
  { id: "brock", label: "Brock", subtitle: "Pewter Gym", trainerIndex: 0, maxPokemon: 6 },
  { id: "misty", label: "Misty", subtitle: "Cerulean Gym", trainerIndex: 1, maxPokemon: 6 },
  { id: "surge", label: "Lt. Surge", subtitle: "Vermilion Gym", trainerIndex: 2, maxPokemon: 6 },
  { id: "erika", label: "Erika", subtitle: "Celadon Gym", trainerIndex: 3, maxPokemon: 6 },
  { id: "koga", label: "Koga", subtitle: "Fuchsia Gym", trainerIndex: 4, maxPokemon: 6 },
  { id: "sabrina", label: "Sabrina", subtitle: "Saffron Gym", trainerIndex: 5, maxPokemon: 6 },
  { id: "blaine", label: "Blaine", subtitle: "Cinnabar Gym", trainerIndex: 6, maxPokemon: 6 },
  { id: "giovanni", label: "Giovanni", subtitle: "Viridian Gym", trainerIndex: 7, maxPokemon: 6 },
  { id: "elite4", label: "Elite Four", subtitle: "& Champion", trainerIndex: [8, 9, 10, 11, 12], maxPokemon: 6 },
];
