const fs = require("fs");
const path = require("path");

const output = path.resolve(__dirname, "../assets/dkdos.svg");
const languageDataPath = path.resolve(__dirname, "../data/language.json");
const languageData = JSON.parse(fs.readFileSync(languageDataPath, "utf8"));
const languages = languageData.languages.slice(0, 6).map((language) => `> ${language}`);

const statusDataPath = path.resolve(__dirname, "../data/status.json");
const statusData = JSON.parse(fs.readFileSync(statusDataPath, "utf8"));

const bootDataPath = path.resolve(__dirname, "../data/boot.json")
const bootData = JSON.parse(fs.readFileSync(bootDataPath, "utf-8"))
const bootLines = bootData.bootLines.map((bootLines) => `${bootLines}`)

const sysDataPath = path.resolve(__dirname, "../data/system.json")
const sysData = JSON.parse(fs.readFileSync(sysDataPath, "utf-8"))
const systemLines = sysData.systemLines.map((systemLines) => `${systemLines}`)

const loadDataPath = path.resolve(__dirname, "../data/loading.json")
const loadData = JSON.parse(fs.readFileSync(loadDataPath, "utf-8"))
const loadingLines = loadData.loadingLines.map((loadingLines) => `${loadingLines}`)

const profileStatus = ["ONLINE", "BUSY", "OFFLINE"].includes(statusData.status)
  ? statusData.status
  : "ONLINE";

const logo = [
  "╔══════════════════════════════════════════════════════╗",
  "║                                                      ║",
  "║      ██████╗ ██╗  ██╗██████╗  ██████╗ ███████╗       ║",
  "║      ██╔══██╗██║ ██╔╝██╔══██╗██╔═══██╗██╔════╝       ║",
  "║      ██║  ██║█████╔╝ ██║  ██║██║   ██║███████╗       ║",
  "║      ██║  ██║██╔═██╗ ██║  ██║██║   ██║╚════██║       ║",
  "║      ██████╔╝██║  ██╗██████╔╝╚██████╔╝███████║       ║",
  "║      ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝       ║",
  "║                                                      ║",
  "║           DanKaufmanDev Operating System             ║",
  "║                                                      ║",
  "╚══════════════════════════════════════════════════════╝",
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textLines(lines, x, startY, gap, className, delayStart = null, delayStep = 0) {
  return lines.map((line, index) => {
    const delayClass = delayStart === null ? "" : ` timed t${index + 1}`;
    const style = delayStart === null
      ? ""
      : ` style="animation-delay:${(delayStart + index * delayStep).toFixed(2)}s"`;
    return `<text x="${x}" y="${startY + index * gap}" class="${className}${delayClass}"${style}>${escapeXml(line)}</text>`;
  }).join("\n      ");
}

function typedTextLines(lines, x, startY, gap, lineDelay, characterDelay, lineStep = 0.55, className = "terminal") {
  return lines.map((line, lineIndex) => {
    const characters = [...line].map((character, characterIndex) => {
      const delay = lineDelay + lineIndex * lineStep + characterIndex * characterDelay;
      return `<tspan class="typed-char" style="animation-delay:${delay.toFixed(3)}s">${escapeXml(character)}</tspan>`;
    }).join("");
    return `<text x="${x}" y="${startY + lineIndex * gap}" class="${className} typed-line" xml:space="preserve">${characters}</text>`;
  }).join("\n      ");
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title description">
  <title id="title">DKDOS - Daniel Kaufman Developer Operating System</title>
  <desc id="description">An animated boot sequence that resolves into the DKDOS terminal splash screen.</desc>
  <defs>
    <filter id="glow" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#8cff91" opacity="0.055"/>
    </pattern>
    <pattern id="noise" width="17" height="17" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="3" r="0.55" fill="#7dff85" opacity="0.16"/>
      <circle cx="12" cy="8" r="0.45" fill="#7dff85" opacity="0.12"/>
      <circle cx="6" cy="15" r="0.4" fill="#7dff85" opacity="0.1"/>
    </pattern>
    <style>
      text {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        letter-spacing: 0;
      }
      .frame { fill: #01030240; stroke: #176b36; stroke-width: 2; }
      .screen { fill: #000b0520; stroke: #0c4224; stroke-width: 1; }
      .terminal { fill: #92ff96; font-size: 21px; }
      .ok { fill: #b6ffb8; font-size: 22px; }
      .dim { fill: #4c9a5c; font-size: 15px; }
      .status { fill: #6fdc78; font-size: 16px; }
      .logo { fill: #95ff99; font-size: 16px; font-weight: 700; filter: url(#glow); }
      .section { fill: #4c9a5c; font-size: 13px; font-weight: 700; }
      .profile { fill: #83e98a; font-size: 15px; }
      .service { fill: #73d97c; font-size: 14px; }
      .ready { fill: #b8ffba; font-size: 21px; filter: url(#glow); }
      .boot-screen { animation: boot-out 0.4s ease 3.35s forwards; }
      .splash-screen { opacity: 0; animation: splash-in 0.55s ease 3.65s forwards; }
      .timed { opacity: 1; animation: reveal 0.18s steps(1, end) backwards; }
      .typed-char { opacity: 1; animation: type-char 0.01s steps(1, end) backwards; }
      .boot-targets { animation: target-out 0.45s ease 7.35s forwards; }
      .flicker { animation: flicker 6.5s linear infinite; }
      .cursor { fill: #aaffad; animation: blink 1s steps(2, start) infinite; filter: url(#glow); }
      .scan-pass { animation: scan 8s linear infinite; }
      .noise { animation: noise-shift 0.24s steps(2, end) infinite; }
      @keyframes reveal { from { opacity: 0; } to { opacity: 1; } }
      @keyframes type-char { from { opacity: 0; } to { opacity: 1; } }
      @keyframes target-out { to { opacity: 0; transform: translateY(-4px); } }
      @keyframes boot-out { to { opacity: 0; } }
      @keyframes splash-in { to { opacity: 1; } }
      @keyframes blink { 50% { opacity: 0; } }
      @keyframes flicker {
        0%, 18%, 22%, 62%, 64%, 100% { opacity: 1; }
        20%, 63% { opacity: 0.94; }
      }
      @keyframes scan { from { transform: translateY(30px); } to { transform: translateY(600px); } }
      @keyframes noise-shift { 0% { transform: translate(0, 0); opacity: 0.13; } 100% { transform: translate(3px, -2px); opacity: 0.2; } }
    </style>
  </defs>

  <rect x="18" y="18" width="1164" height="639" rx="12" class="frame"/>
  <rect x="34" y="34" width="1132" height="607" rx="6" class="screen"/>

  <g class="boot-screen">
    <text x="72" y="82" class="dim">DKDOS BOOT MANAGER // kernel 1.0</text>
    ${typedTextLines(bootLines, 92, 154, 50, 0.25, 0.01, 0.40, "ok")}
    ${typedTextLines(["Starting terminal session..."], 92, 548, 50, 2.95, 0.01)}
    <g class="timed" style="animation-delay:3.24s">
      <rect x="462" y="530" width="12" height="22" class="cursor"/>
    </g>
  </g>

  <g class="splash-screen">
    <g class="flicker">
      <text x="62" y="72" class="status">| DKDOS v1.0 | STATUS: ${profileStatus} |</text>
      <text xml:space="preserve" class="logo">
        ${logo.map((line, index) => `<tspan x="322" y="${108 + index * 25}">${escapeXml(line)}</tspan>`).join("\n        ")}
      </text>
      <text x="180" y="414" class="service timed" style="animation-delay:4.05s">[ RUNNING ] creativity.service</text>
      <text x="475" y="414" class="service timed" style="animation-delay:4.18s">[ RUNNING ] opensource.service</text>
      <text x="785" y="414" class="service timed" style="animation-delay:4.31s">[ RUNNING ] experiments.service</text>
      <text x="180" y="445" class="section timed" style="animation-delay:4.25s">SYSTEM PROFILE</text>
      ${typedTextLines(systemLines, 180, 470, 22, 4.35, 0.025, 0.55, "profile")}
      <g class="boot-targets">
        <text x="690" y="445" class="section timed" style="animation-delay:4.25s">LOADING</text>
        ${typedTextLines(loadingLines, 690, 470, 22, 4.35, 0.025)}
      </g>
      <g class="languages">
        <text x="690" y="445" class="section timed" style="animation-delay:7.90s">LANGUAGES</text>
        ${typedTextLines(languages, 690, 470, 22, 8.00, 0.035)}
      </g>
      <text x="180" y="590" class="ready timed" style="animation-delay:5.95s">System Ready.</text>
      <text x="180" y="620" class="terminal timed" style="animation-delay:6.25s">daniel@dkdos:~$</text>
      <g class="timed" style="animation-delay:6.25s">
        <rect x="378" y="602" width="13" height="22" class="cursor"/>
      </g>
    </g>
  </g>

  <rect x="34" y="34" width="1132" height="607" rx="6" fill="url(#scanlines)" pointer-events="none"/>
  <rect x="34" y="34" width="1132" height="607" rx="6" fill="url(#noise)" class="noise" pointer-events="none"/>
  <rect x="34" y="0" width="1132" height="38" fill="#72ff7c" opacity="0.025" class="scan-pass" pointer-events="none"/>
</svg>
`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg);
console.log(`Generated ${path.relative(process.cwd(), output)}`);
