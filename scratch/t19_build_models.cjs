// T19 — Animal Pen furniture + Chicken/Sheep models (ModelBuilder)
const path = require("path");
const {
  ModelBuilder,
  vector2,
  vector3,
} = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

// Placeholder sprites (report if swapped later)
const SPRITE = {
  // pen: wooden fence-ish — reuse chest frame as placeholder
  pen: "22e9f409617b4e4180f9c92fb26b13f7",
  // chicken: slime stand as temp (yellow-ish stand later)
  chicken: "50faf654ee5d479cb2958edce9feaef0",
  // sheep: slime move clip as temp alternate
  sheep: "dc932872543f4a02bf41e977ab79e5ad",
  itemPen: "22e9f409617b4e4180f9c92fb26b13f7",
};

function buildPen() {
  const bed = ModelBuilder.load("RootDesk/MyDesk/Furniture/Models/Furniture_Bed.model");
  bed.renameModel("Furniture_AnimalPen");
  // drop bed-only script if present
  if (bed.hasComponent("script.Furniture_Bed")) bed.removeComponent("script.Furniture_Bed");
  bed
    .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", SPRITE.pen, "string")
    .value("script.PlaceableFurniture", "ItemId", "Animal Pen", "string")
    .value("script.PlaceableFurniture", "BlocksMovement", true, "bool");
  bed.write("RootDesk/MyDesk/Furniture/Models/Furniture_AnimalPen.model");
  console.log("✓ Furniture_AnimalPen.model");
}

function buildItemPen() {
  // Clone Item_Bed as inventory icon model for Animal Pen
  const item = ModelBuilder.load("RootDesk/MyDesk/item/Models/Item_Bed.model");
  item.renameModel("Item_AnimalPen");
  if (item.hasComponent("MOD.Core.SpriteRendererComponent")) {
    item.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", SPRITE.itemPen, "string");
  }
  item.write("RootDesk/MyDesk/item/Models/Item_AnimalPen.model");
  console.log("✓ Item_AnimalPen.model");
}

function buildAnimal(name, spriteRuid, animalId) {
  const b = ModelBuilder.load("RootDesk/MyDesk/Monster/Models/Slime.model");
  b.renameModel(name);
  for (const c of [
    "script.Monster",
    "script.MonsterAI",
    "script.MonsterMeleeAttack",
    "MOD.Core.HitComponent",
    "MOD.Core.DamageSkinSpawnerComponent",
    "MOD.Core.DamageSkinComponent",
    "MOD.Core.StateComponent",
  ]) {
    if (b.hasComponent(c)) b.removeComponent(c);
  }
  b
    .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", spriteRuid, "string")
    .value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer5", "string")
    .value("MOD.Core.MovementComponent", "InputSpeed", 0.9, "float")
    .addComponent("script.Animal")
    .value("script.Animal", "AnimalId", animalId, "string");
  b.write(`RootDesk/MyDesk/MapObjects/Models/${name}.model`);
  console.log(`✓ ${name}.model AnimalId=${animalId}`);
}

buildPen();
buildItemPen();
buildAnimal("Animal_Chicken", SPRITE.chicken, "Chicken");
buildAnimal("Animal_Sheep", SPRITE.sheep, "Sheep");
console.log("T19 models done.");
