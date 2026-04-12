import { query } from "@anthropic-ai/claude-agent-sdk";
import fs from "fs";

const TEST_PLAN = fs.readFileSync("./TEST_FLOWS.md", "utf8");

async function main() {
  console.log("Starting SuperSearch QA browser test...\n");

  for await (const message of query({
    prompt: `You are a QA tester. Open https://supersearch-production.up.railway.app/search and test the flows below.

IMPORTANT INSTRUCTIONS FOR EFFICIENCY:
- Move quickly through each test. Don't over-analyze screenshots.
- Take a screenshot, check the key thing, note PASS/FAIL, move on.
- Start by creating ./BUG_REPORT.md with headers, then APPEND findings as you go.
- If a test passes, just note "PASS" and move on — don't describe everything you see.
- Only write detailed notes for FAILURES.
- Skip flows 17-20 (URL persistence, mobile, edge cases) to save time.

TEST PLAN:
${TEST_PLAN}`,
    options: {
      allowedTools: ["Read", "Write", "Bash"],
      mcpServers: {
        playwright: {
          command: "npx",
          args: ["@playwright/mcp@latest"],
        },
      },
      maxTurns: 500,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    if ("result" in message) {
      console.log("\n=== FINAL RESULT ===\n");
      console.log(message.result);
    }
  }
}

main().catch(console.error);
