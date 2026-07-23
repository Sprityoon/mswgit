> **[미러]** 원문: [MSW-Git/MSWPackages/ui-resource-casualsurvival-package/README.md](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-casualsurvival-package) @ `1609170` · 미러일 2026-07-23
> 이 파일은 원문 사본입니다 — 직접 수정하지 말 것. 프로젝트 관점 요약·적용 노트는 [INDEX.md](INDEX.md) 참조.

# UIResourcePack

This package is a UI resource pack collected from Durango The Lost Island, an original world.
It provides UI Models (buttons, panels, icons, etc.) and a range of sample UI screens, allowing creators to quickly assemble polished in-game interfaces by referencing or adapting the included assets.

---

## Features

### 1. Core UI Models

Includes Buttons, Panels, Icons, Slots, Sliders, Tints, and so on.

### 2. Sample UI Models

Pre-built sample UI screens covering common game scenarios such as Inventory, Shop, Item Info and more.

---

## Installation

This package can be used immediately after import. No additional setup is required.

---

## Cautions

- Only RUID references are included; the original image resource files are not bundled.
  Since only the RUID is available, Wrap/Filter Mode and Pivot cannot be modified.
- Entities in the models may have different sizes or proportions from the original resources, so please verify before use.

---

## Tip

Change the Type of `SpriteGUIRendererComponent` to `Simple`, then click the **Set Native Size** button to resize the entity to its original resource size.
Setting the `PreserveSprite` property to `NativeSize` lets you check the original size.

---

## License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this project.

However, the software is provided "as is", without warranty of any kind.
For more details, please see the [LICENSE](https://opensource.org/licenses/MIT).

---

Happy Coding!
