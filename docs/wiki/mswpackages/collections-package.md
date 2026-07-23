> **[미러]** 원문: [MSW-Git/MSWPackages/collections-package/README.md](https://github.com/MSW-Git/MSWPackages/tree/main/collections-package) @ `1609170` · 미러일 2026-07-23
> 이 파일은 원문 사본입니다 — 직접 수정하지 말 것. 프로젝트 관점 요약·적용 노트는 [INDEX.md](INDEX.md) 참조.

# Collections

This package provides collections.

---

## Features

This package offers 5 distinct collection types:

- **Queue**
- **Stack**
- **PriorityQueue**
- **Set**
- **LinkedList** (Doubly linked list)

---

## Installation

You can start using it immediately after importing the package.

---

## Usage

You can obtain and use your desired collection from `CollectionFactoryLogic` by calling its `Get` function.

Both the collections are implemented using metatables.
Structs should be used purely as annotations. You should not create them using their constructors.
Collections cannot use Property Sync functionality and cannot be passed to other spaces via Client/Server functions.

You'll find collection test scripts in the `TestScript` folder.
Feel free to use them as a reference or remove them if they're not needed.

---

## License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this project.

However, the software is provided "as is", without warranty of any kind.
For more details, please see the [LICENSE](https://opensource.org/licenses/MIT).

---

Happy Coding! 🎉
