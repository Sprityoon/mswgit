const path = require('path');
const { MapBuilder } = require('../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');

const mapPath = path.join(__dirname, '..', 'map', 'town.map');
const modelPath = path.join(__dirname, '..', 'RootDesk', 'MyDesk', 'Furniture', 'Models', 'Furniture_Portal.model');

console.log('Loading town.map...');
const map = MapBuilder.read(mapPath);

console.log('Placing static portal in town map...');
map.placeModel('PortalToHome', modelPath, {
  pos: [5, 0, 0],
  componentOverrides: {
    'script.PortalGate': {
      TargetMapName: 'Home',
      TargetPosition: { x: -3, y: 0 }
    }
  }
});

// Since the portal in town map is indestructible, and the user requested we make it indestructible,
// we also want to set it in the map layer MapLayer2 and OrderInLayer correctly so it matches.
// placeModel already does standard sprite layers if specified, but let's make sure it has SpriteRendererComponent settings
map.patchComponent('PortalToHome', 'MOD.Core.SpriteRendererComponent', {
  IgnoreMapLayerCheck: true,
  SortingLayer: 'MapLayer2',
  OrderInLayer: 7500 // math.floor((MapRadius - y) * 100) -> (75 - 0) * 100 = 7500
});

console.log('Saving town.map...');
map.write(mapPath);
console.log('Static portal successfully placed in town.map!');
