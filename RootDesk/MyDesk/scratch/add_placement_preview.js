const fs = require('fs');
const path = require('path');

const mapPath = path.join('map/map01.map');

fs.readFile(mapPath, 'utf8', (err, data) => {
    if (err) throw err;
    let mapJson = JSON.parse(data);

    let mapEntity = mapJson.ContentProto.Entities.find(e => e.jsonString.name === "map01");
    if (!mapEntity) throw new Error("map01 not found");

    // Check if PlacementPreview already exists
    let existing = mapJson.ContentProto.Entities.find(e => e.jsonString.name === "PlacementPreview");
    if (existing) {
        console.log("PlacementPreview already exists in map01");
        return;
    }

    let previewEntity = {
        "id": "739a8261-0000-4000-8000-000000000001",
        "path": "/maps/map01/PlacementPreview",
        "componentNames": "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent",
        "jsonString": {
            "name": "PlacementPreview",
            "path": "/maps/map01/PlacementPreview",
            "nameEditable": true,
            "enable": false,
            "visible": true,
            "localize": true,
            "displayOrder": 0,
            "@components": [
                {
                    "@type": "MOD.Core.TransformComponent",
                    "Position": { "x": 0.0, "y": 0.0, "z": 0.0 },
                    "Scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
                    "Enable": true
                },
                {
                    "@type": "MOD.Core.SpriteRendererComponent",
                    "Color": { "r": 0.2, "g": 1.0, "b": 0.2, "a": 0.6 },
                    "IgnoreMapLayerCheck": true,
                    "SortingLayer": "MapLayer2",
                    "SpriteRUID": "",
                    "Enable": true
                }
            ],
            "@version": 1
        }
    };

    mapJson.ContentProto.Entities.push(previewEntity);

    fs.writeFile(mapPath, JSON.stringify(mapJson, null, 2), 'utf8', (err) => {
        if (err) throw err;
        console.log("PlacementPreview added to map01 successfully.");
    });
});
