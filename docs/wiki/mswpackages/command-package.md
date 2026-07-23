> **[미러]** 원문: [MSW-Git/MSWPackages/command-package/README.md](https://github.com/MSW-Git/MSWPackages/tree/main/command-package) @ `1609170` · 미러일 2026-07-23
> 이 파일은 원문 사본입니다 — 직접 수정하지 말 것. 프로젝트 관점 요약·적용 노트는 [INDEX.md](INDEX.md) 참조.

# Command

This package provides an environment where you can execute the functions you have written, both in the maker and release environments.

---

## Features

After importing the package, press the **`\`** key during world play to open the command window.
Once the command window is open, the following functions can be performed:

| Key / Action | Description |
|---|---|
| **Enter** / Execute button | Executes the currently entered command. |
| **ESC** | Closes the command window. |
| **`[`** | Retrieves the command previously executed before the current one. |
| **`]`** | Retrieves the next command of the currently retrieved command. |
| **Tab** | Autocompletes the currently entered keyword with the first candidate displayed below. |
| Click a candidate | Adds the candidate as the last keyword of the command. |
| Complex commands | If multiple commands are entered separated by `\n`, they will be executed in the order they were entered. |

This package can also be used on **mobile devices**.
On mobile, a "Command" button will appear in the top center, and pressing it will open the command window.
Once the command window is opened, two buttons will appear to the left of the Command button:

- **Prev Command** button: Retrieves the command previously executed before the current one.
- **Post Command** button: Retrieves the next command of the currently retrieved command.

---

## Installation

**1. Permission Check**

This functionality requires permission checks.
You must fill in the conditions for the empty method `AdminLogic:IsAdmin` according to the world's permissions.

**2. UI Path Configuration**

You need to input the UI path to be created in `UICommandLogic.UIPath`.
By default, it is set to `"/ui/DefaultGroup"`.

---

## How to Add Commands

Commands are divided into two types:

- **Client-side commands** — listed in `ClientCommandLogic`
- **Server-side commands** — listed in `ServerCommandLogic`

The last parameter of the server command function is the user ID of the person who executed the command.

The package includes test commands. You can refer to these to add your own commands.
Be careful to avoid overlapping client-side and server-side commands when adding new ones.

> Example: Client: `"test hello"`, Server: `"test hello"` ← avoid this overlap

Reserved keywords like `func`, `desc`, `num`, and `string` are used, so they cannot be used as command keywords.

---

Happy Coding! 🎉
