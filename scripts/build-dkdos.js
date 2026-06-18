const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets");
const SCREENS_DIR = path.join(ROOT, "screens");
const DATA_DIR = path.join(ROOT, "data");

const W = 1000;
const H = 620;

fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(SCREENS_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  } catch {
    return fallback;
  }
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function line(text, x, y, cls = "text", extra = "") {
  return `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(text)}</text>`;
}

function clip(text, max) {
  const value = String(text ?? "");
  return value.length > max ? `${value.slice(0, Math.max(0, max - 3))}...` : value;
}

function wrap(text, max, lines = 2) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const out = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max) {
      current = next;
      continue;
    }
    if (current) out.push(current);
    current = word;
    if (out.length === lines - 1) break;
  }

  if (current && out.length < lines) out.push(current);
  if (words.join(" ").length > out.join(" ").length) {
    out[out.length - 1] = clip(out[out.length - 1], max);
  }
  return out;
}

function anchor(href, content, label) {
  return `<a href="${esc(href)}" target="_top" aria-label="${esc(label)}">${content}</a>`;
}

function button({ href, label, x, y, width = 190, hidden = false }) {
  const cls = hidden ? "hit hidden-hit" : "hit";
  const text = hidden ? "" : line(`> ${label}`, x + 12, y, "cmd-text");
  return anchor(
    href,
    `<g class="cmd">
      <rect x="${x}" y="${y - 24}" width="${width}" height="32" rx="3" class="${cls}"/>
      ${text}
    </g>`,
    `Open ${label}`,
  );
}

function progress(x, y, label, pct) {
  const width = 240;
  const fill = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return `<g>
    ${line(label, x, y, "muted")}
    <rect x="${x + 150}" y="${y - 15}" width="${width}" height="16" class="bar-bg"/>
    <rect x="${x + 150}" y="${y - 15}" width="${fill}" height="16" class="bar-fill"/>
    ${line(`${pct}%`, x + 404, y, "muted")}
  </g>`;
}

function shellFrame(title, body, options = {}) {
  const back = options.back !== false
    ? anchor("../assets/dkdos.svg", line("[home]", 770, 94, "nav"), "Return to DKDOS desktop")
    : "";
  const hiddenLinks = options.hiddenLinks === false
    ? ""
    : [
        button({ href: "../screens/help.svg", label: "help", x: 28, y: 590, width: 96, hidden: true }),
        button({ href: "../screens/sudo.svg", label: "sudo", x: 130, y: 590, width: 96, hidden: true }),
        button({ href: "../screens/coffee.svg", label: "coffee", x: 232, y: 590, width: 122, hidden: true }),
        button({ href: "../screens/matrix.svg", label: "matrix", x: 360, y: 590, width: 122, hidden: true }),
      ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">DKDOS - ${esc(title)}</title>
  <desc id="desc">Dan Kaufman Dev Operating System terminal screen.</desc>
  <defs>${style()}</defs>
  ${crtBackground()}
  <rect x="24" y="24" width="952" height="572" rx="8" class="terminal"/>
  <rect x="24" y="24" width="952" height="44" rx="8" class="titlebar"/>
  <circle cx="52" cy="46" r="6" fill="#173f2a"/>
  <circle cx="74" cy="46" r="6" fill="#2f5f33"/>
  <circle cx="96" cy="46" r="6" fill="#7cff6b"/>
  ${line("DKDOS", 124, 52, "brand")}
  ${line(title, 462, 52, "title", 'text-anchor="middle"')}
  ${back}
  <rect x="50" y="88" width="900" height="476" rx="4" class="panel"/>
  ${body}
  ${hiddenLinks}
</svg>`;
}

function style() {
  return `<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="2.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="1" fill="#7cff6b" opacity="0.06"/>
  </pattern>
  <style>
    .mono, text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; letter-spacing: 0; }
    .terminal { fill: #020403; stroke: #1d8f4d; stroke-width: 2; }
    .titlebar { fill: #06150c; stroke: #1d8f4d; stroke-width: 1; }
    .panel { fill: #010201; stroke: #124f2e; stroke-width: 1; }
    .brand { fill: #7cff6b; font-size: 18px; font-weight: 700; filter: url(#glow); }
    .title { fill: #aaff9d; font-size: 17px; }
    .text { fill: #b7ffad; font-size: 18px; }
    .small { fill: #8fe883; font-size: 14px; }
    .muted { fill: #5da865; font-size: 15px; }
    .dim { fill: #356c41; font-size: 14px; }
    .prompt { fill: #7cff6b; font-size: 18px; filter: url(#glow); }
    .cmd-text { fill: #b7ffad; font-size: 18px; }
    .nav { fill: #7cff6b; font-size: 16px; text-decoration: underline; }
    .hit { fill: #082514; stroke: #1d8f4d; stroke-width: 1; opacity: 0.82; }
    .hidden-hit { opacity: 0.01; stroke: transparent; }
    .cmd:hover .hit { fill: #113d22; stroke: #7cff6b; opacity: 1; }
    .cmd:hover .cmd-text { fill: #ffffff; }
    .bar-bg { fill: #051108; stroke: #1d8f4d; stroke-width: 1; }
    .bar-fill { fill: #7cff6b; filter: url(#glow); }
    .status { fill: #7cff6b; animation: pulse 1.4s ease-in-out infinite; filter: url(#glow); }
    .cursor { fill: #7cff6b; animation: blink 1s steps(2, start) infinite; }
    .boot { animation: boot 0.45s ease; }
    .scan { animation: scan 5s linear infinite; }
    .rain { fill: #7cff6b; font-size: 13px; opacity: 0.42; animation: rain 3.2s linear infinite; }
    @keyframes boot { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
    @keyframes scan { from { transform: translateY(-80px); } to { transform: translateY(640px); } }
    @keyframes rain { from { transform: translateY(-80px); } to { transform: translateY(620px); } }
  </style>`;
}

function crtBackground() {
  return `<rect width="${W}" height="${H}" fill="#000"/>
  <rect width="${W}" height="${H}" fill="url(#scanlines)"/>
  <rect class="scan" x="0" y="0" width="${W}" height="80" fill="#7cff6b" opacity="0.035"/>`;
}

function desktop(now, stats) {
  const boot = [
    "Initializing Kernel...",
    "Loading Projects...",
    "Loading Open Source...",
    "Loading Experiments...",
    "Loading Developer Tools...",
    "Loading Terminal...",
    "System Ready.",
  ];
  const bootLines = boot
    .map((text, i) => {
      const cls = i === boot.length - 1 ? "prompt" : "text";
      const groupClass = i === 0 ? "" : ' class="boot"';
      const delay = i === 0 ? "" : ` style="animation-delay:${(i * 0.42).toFixed(2)}s"`;
      return `<g${groupClass}${delay}>${line(text, 80, 130 + i * 26, cls)}</g>`;
    })
    .join("\n");
  const commands = [
    ["projects", "../screens/projects.svg", 80, 438],
    ["opensource", "../screens/opensource.svg", 280, 438],
    ["experiments", "../screens/experiments.svg", 510, 438],
    ["resume", "../screens/resume.svg", 80, 486],
    ["contact", "../screens/contact.svg", 280, 486],
  ];
  const commandButtons = commands.map(([label, href, x, y]) => button({ href, label, x, y })).join("\n");
  const hiddenButtons = [
    button({ href: "../screens/help.svg", label: "help", x: 510, y: 486, width: 150, hidden: true }),
    button({ href: "../screens/sudo.svg", label: "sudo", x: 670, y: 486, width: 130, hidden: true }),
    button({ href: "../screens/coffee.svg", label: "coffee", x: 810, y: 486, width: 130, hidden: true }),
    button({ href: "../screens/matrix.svg", label: "matrix", x: 810, y: 438, width: 130, hidden: true }),
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">DKDOS - Dan Kaufman Dev Operating System</title>
  <desc id="desc">Interactive retro terminal profile with clickable commands.</desc>
  <defs>${style()}</defs>
  ${crtBackground()}
  <rect x="24" y="24" width="952" height="572" rx="8" class="terminal"/>
  <rect x="24" y="24" width="952" height="44" rx="8" class="titlebar"/>
  <circle cx="52" cy="46" r="6" fill="#173f2a"/>
  <circle cx="74" cy="46" r="6" fill="#2f5f33"/>
  <circle cx="96" cy="46" r="6" fill="#7cff6b"/>
  ${line("DKDOS", 124, 52, "brand")}
  ${line("Dan Kaufman Dev Operating System", 512, 52, "title", 'text-anchor="middle"')}
  <rect x="50" y="88" width="900" height="476" rx="4" class="panel"/>
  ${bootLines}
  <g class="boot" style="animation-delay:3.25s">
    ${line("DKDOS v" + now.version, 540, 130, "brand")}
    ${line("User: Dan Kaufman", 540, 170, "small")}
    <circle cx="606" cy="198" r="6" class="status"/>
    ${line("Status: " + now.status, 540, 204, "small")}
    ${line("Role: " + now.role, 540, 238, "small")}
    ${line("Focus: " + clip(now.focus, 22), 540, 272, "small")}
    ${line("Repos: " + stats.repositoryCount, 540, 306, "small")}
    ${line("Contributions: " + stats.totalContributions, 540, 332, "small")}
    ${line("Latest: " + clip(stats.latestCommit, 22), 540, 358, "small")}
  </g>
  <g class="boot" style="animation-delay:3.65s">
    ${line("C:\\\\DKDOS> dir /commands", 80, 392, "prompt")}
    ${commandButtons}
    ${line("Tip: try hidden commands: help, sudo, coffee, matrix", 80, 540, "dim")}
    <rect class="cursor" x="420" y="376" width="10" height="20"/>
  </g>
  ${hiddenButtons}
</svg>`;
}

function projectsScreen(projectData) {
  const rows = projectData.projects.slice(0, 4).map((project, i) => {
    const y = 168 + i * 82;
    const description = wrap(project.description, 34, 2);
    return anchor(
      project.link,
      `<g class="cmd">
        <rect x="82" y="${y - 42}" width="820" height="70" rx="3" class="hit"/>
        ${line(clip(project.name, 18), 104, y - 16, "prompt")}
        ${line(description[0] || "", 330, y - 18, "small")}
        ${line(description[1] || "", 330, y + 8, "small")}
        ${line("[open]", 760, y + 8, "nav")}
      </g>`,
      `Open ${project.name}`,
    );
  }).join("\n");
  return shellFrame("PROJECTS", `${line("C:\\\\DKDOS> projects", 82, 126, "prompt")}${rows}`);
}

function opensourceScreen(stats) {
  const repos = stats.activeRepositories.slice(0, 5).map((repo, i) => line("- " + repo, 104, 232 + i * 26, "text")).join("\n");
  const body = `
    ${line("C:\\\\DKDOS> opensource", 82, 126, "prompt")}
    ${line("Active repositories", 104, 178, "brand")}
    ${repos}
    ${line("Contribution information", 544, 178, "brand")}
    ${line("Repositories: " + stats.repositoryCount, 566, 232)}
    ${line("Total contributions: " + stats.totalContributions, 566, 264)}
    ${line("Current streak: " + stats.contributionStreak + " days", 566, 296)}
    ${line("Latest repo: " + stats.latestRepository, 566, 328)}
    ${line("Philosophy", 104, 408, "brand")}
    ${line("Build useful things. Keep tools sharp. Share experiments while they are alive.", 104, 450, "text")}
  `;
  return shellFrame("OPEN SOURCE", body);
}

function experimentsScreen(stats) {
  const recent = stats.recentWork.slice(0, 4).map((item, i) => line("> " + item, 104, 236 + i * 32, "text")).join("\n");
  const body = `
    ${line("C:\\\\DKDOS> experiments", 82, 126, "prompt")}
    ${line("Current ideas", 104, 178, "brand")}
    ${recent}
    ${line("Labs", 558, 178, "brand")}
    ${progress(558, 236, "Interface OS", 84)}
    ${progress(558, 276, "Prompt tooling", 68)}
    ${progress(558, 316, "Icon systems", 57)}
    ${line("Research projects", 104, 412, "brand")}
    ${line("Terminal-native profiles, SVG-only interaction, and developer workstations.", 104, 456, "text")}
  `;
  return shellFrame("EXPERIMENTS", body);
}

function resumeScreen() {
  const body = `
    ${line("C:\\\\DKDOS> resume", 82, 126, "prompt")}
    ${line("Skills", 104, 178, "brand")}
    ${progress(104, 236, "UI/UX", 92)}
    ${progress(104, 276, "Front-end", 90)}
    ${progress(104, 316, "Creative tools", 84)}
    ${progress(104, 356, "Collaboration", 88)}
    ${line("Technologies", 558, 178, "brand")}
    ${line("HTML  CSS  JavaScript  TypeScript", 580, 232)}
    ${line("React  Vue  Tailwind  Node", 580, 264)}
    ${line("Python  Java  Git  npm", 580, 296)}
    ${line("Learning: Rust  Go", 580, 328)}
    ${line("Background", 104, 448, "brand")}
    ${line("Software developer with an art background and a focus on polished interfaces.", 104, 490, "text")}
  `;
  return shellFrame("RESUME", body);
}

function contactScreen() {
  const links = [
    ["Website", "https://danielkaufman.dev"],
    ["GitHub", "https://github.com/DanKaufmanDev"],
  ];
  const rows = links.map(([label, href], i) => anchor(
    href,
    `<g class="cmd">
      <rect x="104" y="${182 + i * 58}" width="560" height="36" rx="3" class="hit"/>
      ${line(label, 126, 206 + i * 58, "prompt")}
      ${line(href, 286, 206 + i * 58, "small")}
    </g>`,
    `Open ${label}`,
  )).join("\n");
  const body = `
    ${line("C:\\\\DKDOS> contact", 82, 126, "prompt")}
    ${rows}
    ${line("Signal policy: clear notes, useful ideas, and good software energy.", 104, 470, "text")}
  `;
  return shellFrame("CONTACT", body);
}

function messageScreen(title, command, messages) {
  const lines = messages.map((msg, i) => line(msg, 104, 206 + i * 34, i === 0 ? "prompt" : "text")).join("\n");
  return shellFrame(title, `${line("C:\\\\DKDOS> " + command, 82, 126, "prompt")}${lines}`);
}

function matrixScreen() {
  const columns = Array.from({ length: 38 }, (_, i) => {
    const x = 78 + i * 24;
    const delay = (i % 9) * 0.18;
    const text = "010110 DKDOS 101001";
    return `<text x="${x}" y="${80 - (i % 6) * 28}" class="rain" style="animation-delay:${delay}s">${esc(text)}</text>`;
  }).join("\n");
  return shellFrame("MATRIX", `
    ${columns}
    ${line("C:\\\\DKDOS> matrix", 82, 126, "prompt")}
    ${line("Wake up, Daniel...", 104, 492, "brand")}
    ${line("The profile has you.", 104, 526, "text")}
  `);
}

function write(file, svg) {
  fs.writeFileSync(path.join(ROOT, file), svg);
}

const projects = readJson("projects.json", { projects: [] });
const now = readJson("now.json", { focus: "Building Developer Tools", status: "ONLINE", role: "Developer", version: "1.0" });
const stats = readJson("stats.json", {
  repositoryCount: 0,
  totalContributions: 0,
  contributionStreak: 0,
  latestCommit: "Waiting for GitHub Actions sync",
  latestRepository: "DanKaufmanDev",
  activeRepositories: [],
  recentWork: [],
});

write("assets/dkdos.svg", desktop(now, stats));
write("assets/desktop.svg", desktop(now, stats));
write("screens/projects.svg", projectsScreen(projects));
write("screens/opensource.svg", opensourceScreen(stats));
write("screens/experiments.svg", experimentsScreen(stats));
write("screens/resume.svg", resumeScreen());
write("screens/contact.svg", contactScreen());
write("screens/help.svg", messageScreen("HELP", "help", [
  "Available commands:",
  "projects  opensource  experiments  resume  contact",
  "Hidden commands:",
  "sudo  coffee  matrix",
]));
write("screens/sudo.svg", messageScreen("SUDO", "sudo", [
  "ACCESS DENIED",
  "nice try",
]));
write("screens/coffee.svg", messageScreen("COFFEE", "coffee", [
  "Brewing...",
  "[##########]",
  "Ready: coffee online",
]));
write("screens/matrix.svg", matrixScreen());

console.log("Built DKDOS SVG interface");
