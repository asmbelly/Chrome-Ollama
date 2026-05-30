# Chrome Ollama

A terminal-style Chrome sidebar extension for chatting with local Ollama models. No cloud. No API key. No cost.

---

## What It Does

Opens a sidebar in Chrome that lets you talk to any model you have installed in Ollama. The interface looks and feels like a terminal — monospace font, green on black, slash commands, streaming responses.

---

## Requirements

- [Ollama](https://ollama.com) installed and at least one model pulled
- Google Chrome (or any Chromium-based browser with extension support)
- PowerShell (Windows)

---

## Installation

### 1. Load the Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** in the top right
3. Click **Load unpacked**
4. Select the `OLLAMA-EXTENSION` folder (the one containing `manifest.json`)

### 2. Start Ollama

Before using the extension, run the included startup script. It handles killing any existing Ollama process, freeing port 11434 if it is stuck, and relaunching Ollama with the correct CORS settings the extension needs.

Right-click `Start-ollama.ps1` and select **Run with PowerShell**, or from a terminal:

```powershell
.\Start-ollama.ps1
```

If PowerShell blocks execution, run this once first:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 3. Open the Sidebar

Click the Ollama Terminal icon in your Chrome toolbar. The sidebar opens and connects automatically.

---

## Usage

Type a message and hit Enter or click SEND to chat with the active model.

Type `/` to open the command palette.

| Command   | Description                        |
|-----------|------------------------------------|
| /model    | Switch the active Ollama model     |
| /models   | List all installed models          |
| /clear    | Clear the terminal output          |
| /new      | Start a new conversation           |
| /help     | Show available commands            |

Navigate the command palette with arrow keys, select with Enter, close with Escape.

Use the Up and Down arrow keys in the input to cycle through your message history.

Click the model badge in the top right to quickly open the model picker.

---

## File Structure

```
OLLAMA-EXTENSION/
├── manifest.json       Chrome extension manifest (MV3)
├── background.js       Opens the side panel on toolbar click
├── sidebar.html        Terminal UI layout and styles
├── sidebar.js          Chat logic, streaming, command palette
└── Start-ollama.ps1    Startup script to launch Ollama correctly
```

---

## Notes

- Responses will be slow if you have no GPU. Ollama runs on CPU by default if no compatible GPU is detected.
- Your selected model is saved between sessions.
- Conversation context is kept within a session. Use `/new` to reset it.
- The startup script must be rerun after every system restart.

---

## Troubleshooting

**Extension shows "cannot reach ollama"**
Run `Start-ollama.ps1`. Ollama is either not running or was started without the required CORS setting.

**Port 11434 already in use**
The startup script handles this automatically. Just run it and it will clear the port before relaunching.

**Slow responses**
Normal on CPU. If you have an Nvidia GPU, make sure the CUDA drivers are installed — Ollama will pick it up automatically.
