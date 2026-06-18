const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STATUS_PATH = path.join(ROOT, "data/status.json");
const README_PATH = path.join(ROOT, "README.md");
const token = process.env.GITHUB_TOKEN;
const login = process.env.PROFILE_USER || process.env.GITHUB_REPOSITORY_OWNER || "DanKaufmanDev";

const query = `
  query ProfileStatus($login: String!) {
    user(login: $login) {
      status {
        indicatesLimitedAvailability
        message
        expiresAt
      }
    }
  }
`;

function mapStatus(githubStatus) {
  if (!githubStatus) return "ONLINE";

  const expired = githubStatus.expiresAt && new Date(githubStatus.expiresAt) <= new Date();
  if (expired) return "ONLINE";
  if (githubStatus.indicatesLimitedAvailability) return "BUSY";
  if (/\boffline\b/i.test(githubStatus.message || "")) return "OFFLINE";
  return "ONLINE";
}

async function main() {
  if (!token) {
    throw new Error("GITHUB_TOKEN is required to read the GitHub profile status");
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "DKDOS-status-updater",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const githubStatus = payload.data?.user?.status || null;
  const next = {
    status: mapStatus(githubStatus),
    message: githubStatus?.message || "",
  };
  const previous = JSON.parse(fs.readFileSync(STATUS_PATH, "utf8"));

  if (JSON.stringify(previous) === JSON.stringify(next)) {
    console.log(`DKDOS status unchanged: ${next.status}`);
    return;
  }

  fs.writeFileSync(STATUS_PATH, `${JSON.stringify(next, null, 2)}\n`);

  const readme = fs.readFileSync(README_PATH, "utf8");
  const cacheKey = Date.now();
  fs.writeFileSync(
    README_PATH,
    readme.replace(/dkdos\.svg\?v=[^\"]+/, `dkdos.svg?v=${cacheKey}`),
  );

  console.log(`DKDOS status updated: ${previous.status} -> ${next.status}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { mapStatus };
