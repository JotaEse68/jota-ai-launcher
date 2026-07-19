# OpenAI Build Week video script

**Target length:** 2 minutes 40 seconds  
**Language:** English narration  
**Maximum allowed length:** under 3 minutes  
**Format:** public YouTube video with audio

## 0:00–0:18 · The problem

**Screen:** Several project folders, then the Jota AI Launcher home screen.

**Narration:**

> I build many projects with AI. A few weeks later, the hardest part is often not writing code. It is remembering what each project was, which stack it used, where it was deployed, and how to continue. I created Jota AI Launcher to solve that problem locally.

## 0:18–0:42 · One place for coding agents

**Screen:** Launch dashboard, version and account status, active project selector.

**Narration:**

> Jota AI Launcher is a desktop command center for Codex and other optional coding agents. It detects installed tools, versions, accounts, plugins, skills, and MCP servers. Choose a project and the launcher opens a visible terminal in exactly the right folder, using your own account and permissions.

## 0:42–1:22 · Project memory

**Screen:** Projects view. Scroll through cards and focus on README summary, stack, GitHub, and deployment labels.

**Narration:**

> The important feature is project memory. The launcher scans only folders I approve and turns each project into a visual card. It extracts a short description, recognizes the stack, finds the GitHub repository, and identifies services such as Vercel, Netlify, Render, Supabase, or Docker. It also includes WordPress plugins, designs, and local AI-assisted work that has no Git repository.

## 1:22–1:42 · Privacy and trust

**Screen:** Accounts view, then the security section of the README or release assets.

**Narration:**

> Everything is processed locally. The launcher has no proprietary backend, analytics, embedded passwords, or API keys. Every person signs in through the official CLI. Releases include public source, tests, CodeQL, checksums, a software bill of materials, and GitHub provenance.

## 1:42–2:20 · How Codex and GPT-5.6 were used

**Screen:** GitHub commit history, pull requests, tests, then the app again.

**Narration:**

> I built the project during OpenAI Build Week with Codex using GPT-5.6 Sol and high reasoning. I supplied the real problem, product direction, and acceptance decisions. Codex helped transform the idea into a secure Electron and React architecture, implement the six-language interface and project detector, write tests and release automation, and investigate a CodeQL finding. GPT-5.6 was especially valuable when one decision affected product design, operating-system behavior, security, documentation, and distribution at the same time.

## 2:20–2:40 · Result

**Screen:** Select a project and click Codex; show the terminal opening in the correct folder. End on the app logo and project URL.

**Narration:**

> Jota AI Launcher turns a folder full of forgotten experiments into a usable memory of what I have built. Select the project, launch Codex, and continue with context instead of starting from zero. It is open source and available for Windows and macOS.

## Recording checklist

- Keep the final export below 3:00.
- Use 1080p landscape video.
- Record English narration or add an accurate English voiceover.
- Remove loading screens, typing delays, notifications, personal paths, emails, and tokens.
- Do not use copyrighted background music.
- Show GPT-5.6 Sol in Codex briefly without exposing private conversation content.
- Make the YouTube visibility **Public**, not Unlisted, unless the challenge organizers explicitly confirm that Unlisted is accepted.
- Test the final YouTube URL in a private browser window before entering it in Devpost.
