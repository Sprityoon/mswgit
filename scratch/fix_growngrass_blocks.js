const fs = require("fs");
const path = "RootDesk/MyDesk/MapObjects/Models/GrownGrass.model";
const j = JSON.parse(fs.readFileSync(path, "utf8"));
const vals = j.ContentProto.Json.Target.Values;
let v = vals.find((x) => x.Name === "BlocksMovement");
if (!v) {
  v = {
    TargetType: "script.ResourceOccupiedArea",
    Name: "BlocksMovement",
    ValueType: {
      $type: "MODNativeType",
      type: "System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
    },
    Value: false,
  };
  vals.push(v);
} else {
  v.Value = false;
  v.ValueType = {
    $type: "MODNativeType",
    type: "System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
  };
  // remove broken empty-key from prior shell escape
  if (v.ValueType[""] !== undefined) delete v.ValueType[""];
}
fs.writeFileSync(path, JSON.stringify(j, null, 2));
const check = JSON.parse(fs.readFileSync(path, "utf8"));
console.log(
  JSON.stringify(
    check.ContentProto.Json.Target.Values.find((x) => x.Name === "BlocksMovement"),
    null,
    2
  )
);
