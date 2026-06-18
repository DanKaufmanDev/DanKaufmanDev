const fs = require("fs");
const https = require("https");
const path = require("path");

const user = process.env.PROFILE_USER || "DanKaufmanDev";
const token = process.env.GITHUB_TOKEN;
const outFile = path.resolve(__dirname, "..", "data", "stats.json");

function requestGraphql(query, variables) {
  if (!token) {
    return Promise.reject(new Error("GITHUB_TOKEN is not available"));
  }

  const body = JSON.stringify({ query, variables });
  const reqOptions = {
    hostname: "api.github.com",
    path: "/graphql",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "User-Agent": "DKDOS-profile-updater",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors) {
            reject(new Error(parsed.errors.map((err) => err.message).join("; ")));
            return;
          }
          resolve(parsed.data);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function currentStreak(calendar) {
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].contributionCount > 0) {
      streak += 1;
      continue;
    }
    if (streak > 0) break;
  }
  return streak;
}

async function main() {
  const query = `
    query DkdosStats($login: String!) {
      user(login: $login) {
        repositories(ownerAffiliations: OWNER, privacy: PUBLIC) {
          totalCount
          nodes {
            name
            updatedAt
          }
        }
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
          commitContributionsByRepository(maxRepositories: 5) {
            repository {
              name
              updatedAt
            }
            contributions(first: 1) {
              nodes {
                occurredAt
                commitCount
              }
            }
          }
        }
      }
    }
  `;

  const data = await requestGraphql(query, { login: user });
  const profile = data.user;
  const repos = profile.repositories.nodes
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const calendar = profile.contributionsCollection.contributionCalendar;
  const recentContribution = profile.contributionsCollection.commitContributionsByRepository[0];
  const latestCommit = recentContribution
    ? `${recentContribution.repository.name}: ${recentContribution.contributions.nodes[0]?.commitCount || 0} commits`
    : "No recent public commit data";

  const stats = {
    updatedAt: new Date().toISOString(),
    repositoryCount: profile.repositories.totalCount,
    totalContributions: calendar.totalContributions,
    contributionStreak: currentStreak(calendar),
    latestCommit,
    latestRepository: repos[0]?.name || user,
    activeRepositories: repos.slice(0, 5).map((repo) => repo.name),
    recentWork: repos.slice(0, 4).map((repo) => `Working in ${repo.name}`),
  };

  fs.writeFileSync(outFile, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`Updated DKDOS stats for ${user}`);
}

main().catch((error) => {
  console.warn(`Unable to update live stats: ${error.message}`);
  if (!fs.existsSync(outFile)) {
    fs.writeFileSync(outFile, `${JSON.stringify({
      updatedAt: "unavailable",
      repositoryCount: 0,
      totalContributions: 0,
      contributionStreak: 0,
      latestCommit: "Stats sync unavailable",
      latestRepository: user,
      activeRepositories: [],
      recentWork: ["Stats sync unavailable"],
    }, null, 2)}\n`);
  }
});
