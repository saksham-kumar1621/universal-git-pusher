# 🚀 Universal GitHub Pusher

> **Push any project to GitHub in seconds — with a beautiful web GUI. No terminal needed.**

A locally-hosted web application that makes pushing code to GitHub as easy as drag & drop. Built with Node.js, Express, and a stunning glassmorphism dark-theme UI.

[![GitHub Push Tool](https://img.shields.io/badge/GitHub-Push_Tool-8b5cf6?style=for-the-badge&logo=github)](https://github.com/saksham-kumar1621/universal-git-pusher)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🎯 What is this?

**Universal GitHub Pusher** is a developer tool that replaces the hassle of `git init`, `git add`, `git commit`, and `git push` with a **one-click web interface**. Perfect for:

- 🆕 **Beginners** who aren't comfortable with the terminal
- ⚡ **Developers** who want to quickly push new projects to GitHub
- 📦 **Anyone** who has a project folder and wants it on GitHub — fast

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **Beautiful UI** | Premium dark glassmorphism design with animated particle backgrounds |
| 📂 **Drag & Drop** | Drag a project folder from File Explorer directly into the app |
| 🔍 **Smart Detection** | Auto-detects project type — Node.js, Python, Java, Go, Rust, C#, Flutter, and more |
| 📝 **Gitignore Templates** | 10+ pre-built `.gitignore` templates, auto-selected for your project |
| 🧙 **Step-by-Step Wizard** | Guided 5-step flow: Select → Configure → Gitignore → Commit → Push |
| 🔄 **Existing Repos** | Push to existing GitHub repos or create new ones — handles both |
| 📋 **Push History** | Track your recent pushes with timestamps |
| 🔐 **Secure** | Your GitHub token stays local — never sent anywhere except GitHub's API |
| 🖥️ **Works Everywhere** | Runs on Windows, macOS, and Linux |

## 🖼️ Screenshots

> The app features a premium dark theme with glassmorphism effects, animated particles, and a step-by-step push wizard.

## 🚀 Quick Start

### Prerequisites

- **[Node.js](https://nodejs.org)** 18+ installed
- **[Git](https://git-scm.com/downloads)** installed and in PATH
- A **[GitHub Personal Access Token (Classic)](https://github.com/settings/tokens/new?scopes=repo,read:user&description=Universal%20GitHub%20Pusher)** with `repo` and `read:user` scopes

### Installation

```bash
# Clone the repository
git clone https://github.com/saksham-kumar1621/universal-git-pusher.git
cd universal-git-pusher

# Install dependencies
npm install

# Start the server
npm run dev
```

Open your browser at **http://localhost:3000** and paste your GitHub token to get started!

### Creating a GitHub Token

1. Go to [GitHub → Settings → Tokens → New (Classic)](https://github.com/settings/tokens/new?scopes=repo,read:user&description=Universal%20GitHub%20Pusher)
2. Check scopes: **`repo`** and **`read:user`**
3. Click **Generate token** → Copy it
4. Paste it into the app's connect screen

## 🧙 How It Works

```
1️⃣  Select Folder    →  Browse or drag & drop any project folder
2️⃣  Configure Repo   →  Set name, description, public/private
3️⃣  Gitignore         →  Pick a template (auto-detected for you)
4️⃣  Commit            →  Write a commit message, choose branch
5️⃣  Push!             →  Watch it go live on GitHub 🎉
```

## 📁 Project Structure

```
universal-git-pusher/
├── server/
│   ├── index.js                  # Express server entry point
│   ├── routes/
│   │   ├── auth.js               # GitHub authentication routes
│   │   ├── git.js                # Git operations (init, add, commit, push)
│   │   ├── github.js             # GitHub API (create repo, check name)
│   │   └── filesystem.js         # File browsing & folder scanning
│   ├── services/
│   │   ├── gitService.js         # simple-git wrapper with token auth
│   │   ├── githubService.js      # Octokit wrapper for GitHub API
│   │   └── fileService.js        # File system operations
│   └── utils/
│       ├── gitignoreTemplates.js  # 10+ .gitignore templates
│       └── detectProject.js       # Auto-detect project type
├── public/
│   ├── index.html                 # Single-page app shell
│   ├── css/style.css              # Glassmorphism dark theme (1400+ lines)
│   └── js/
│       ├── app.js                 # Main controller + particle animation
│       ├── api.js                 # HTTP API client
│       └── components/
│           ├── auth.js            # GitHub PAT authentication
│           ├── dashboard.js       # Profile card + push history
│           ├── wizard.js          # 5-step push wizard + drag & drop
│           └── toast.js           # Toast notifications
├── .env.example                   # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Server** | [Express.js](https://expressjs.com) | HTTP API server |
| **Git** | [simple-git](https://github.com/steveukx/git-js) | Git CLI wrapper |
| **GitHub API** | [Octokit](https://github.com/octokit/octokit.js) | Repository management |
| **Frontend** | Vanilla JS | No build step, fast loading |
| **Styling** | Vanilla CSS | Glassmorphism + animations |

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License — use it however you like!

---

**Made with ❤️ by [One Saksham](https://github.com/saksham-kumar1621)**
