import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.VELIKY_QA_URL || "http://127.0.0.1:5173";
const output = process.env.VELIKY_QA_OUTPUT || "/tmp/veliky-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
const requests = [];
const checks = [];
const accessibility = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("data:") &&
    !r.url().startsWith("blob:")
  )
    requests.push(r.url());
});
const go = async (view) => {
  await page.goto(`${base}/?view=${view}`);
  await page.locator("main").first().waitFor();
};
const check = async (name, fn) => {
  await fn();
  checks.push(name);
  console.log(`PASS ${name}`);
};
try {
  await check(
    "All eight routes: desktop rendering, accessibility and no overflow",
    async () => {
      for (const view of [
        "overview",
        "workspace",
        "knowledge",
        "assets",
        "approvals",
        "deliverables",
        "activity",
        "settings",
      ]) {
        await go(view);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `${view} overflows`,
        );
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        accessibility.push({ view, violations: results.violations });
        await page.screenshot({
          path: `${output}/${view}-desktop.png`,
          fullPage: true,
        });
      }
    },
  );
  await check(
    "Goal validation, persisted draft, custom task and browser history",
    async () => {
      await go("overview");
      await page
        .getByRole("button", { name: "Start a task", exact: true })
        .click();
      await page
        .getByText("Describe your goal in at least 12 characters.")
        .waitFor();
      await page
        .getByRole("textbox", { name: "Describe your goal", exact: true })
        .fill("Prepare a safe custom engineering document review");
      await page.reload();
      assert.equal(
        await page
          .getByRole("textbox", { name: "Describe your goal", exact: true })
          .inputValue(),
        "Prepare a safe custom engineering document review",
      );
      await page
        .getByRole("button", { name: "Start a task", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "Prepare a safe custom engineering document review",
          exact: true,
        })
        .waitFor();
      await page
        .getByText("This draft has not been executed.", { exact: false })
        .waitFor();
      await page.goBack();
      await page
        .getByRole("heading", { name: "Let's get to work, Alex." })
        .waitFor();
      await page.goForward();
      await page
        .getByRole("heading", {
          name: "Prepare a safe custom engineering document review",
          exact: true,
        })
        .waitFor();
    },
  );
  await check("Draft edit, source attachment and deletion", async () => {
    await go("workspace");
    await page
      .getByRole("button")
      .filter({ hasText: "Prepare a safe custom engineering document review" })
      .click();
    await page.getByRole("button", { name: "Edit draft", exact: true }).click();
    await page
      .getByLabel("Task objective", { exact: true })
      .fill("Review the revised inspection report with attached sources");
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByRole("heading", {
        name: "Review the revised inspection report with attached sources",
        exact: true,
      })
      .waitFor();
    await page.reload();
    assert.equal(await page.locator("aside .source-list button").count(), 1);
    await page
      .getByRole("button", { name: "Delete draft", exact: true })
      .click();
    await page.getByRole("button", { name: "Keep draft", exact: true }).click();
    await page
      .getByRole("button", { name: "Delete draft", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete draft", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Search tasks", exact: true })
      .fill("revised inspection");
    await page
      .getByRole("heading", { name: "No results found", exact: true })
      .waitFor();
  });
  await check(
    "Cancelable sample workflow, approval decision and real file download",
    async () => {
      await go("workspace");
      await page.getByRole("button", { name: "Try the P-204 sample" }).click();
      await page
        .getByRole("button", { name: "Run sample walkthrough" })
        .click();
      await page.getByRole("button", { name: "Cancel walkthrough" }).click();
      await page
        .getByRole("button", { name: "Run sample walkthrough" })
        .click();
      await page
        .getByRole("button", { name: "Review approval note", exact: true })
        .waitFor({ timeout: 12000 });
      await page
        .getByRole("button", { name: "Review approval note", exact: true })
        .click();
      await page.getByRole("dialog").waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Close dialog" })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page
        .getByRole("button", { name: "Approve sample note", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Back to review", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Approve sample note", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Record demo approval", exact: true })
        .click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await go("deliverables");
      const downloaded = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download", exact: true })
        .first()
        .click();
      const file = await downloaded;
      assert.match(file.suggestedFilename(), /\.md$/);
      await file.saveAs(`${output}/sample-deliverable.md`);
      await go("activity");
      await page
        .getByRole("heading", { name: "Demo approval recorded", exact: true })
        .waitFor();
    },
  );
  await check(
    "Upload validation, local file preview, remove cancel and confirm",
    async () => {
      await go("knowledge");
      const upload = page.getByLabel("Choose local documents");
      await upload.setInputFiles({
        name: "unsupported.exe",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("invalid"),
      });
      await page
        .getByRole("alert")
        .filter({ hasText: "unsupported file type" })
        .waitFor();
      await upload.setInputFiles({
        name: "review-notes.md",
        mimeType: "text/markdown",
        buffer: Buffer.from(
          "# Local review notes\n\nThe pump requires an engineering review.",
        ),
      });
      await page
        .getByRole("textbox", { name: "Search documents", exact: true })
        .fill("review-notes");
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await page
        .getByRole("heading", { name: "Local review notes", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Remove from library" }).click();
      await page.getByRole("button", { name: "Keep document" }).click();
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await page.getByRole("button", { name: "Remove from library" }).click();
      await page
        .getByRole("button", { name: "Remove document", exact: true })
        .click();
      await page.getByRole("heading", { name: "No results found" }).waitFor();
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.getByRole("button", { name: "Next page" }).click();
      await page.getByText("Page 2 of 3", { exact: true }).waitFor();
    },
  );
  await check("Global search assets, Escape and modal focus trap", async () => {
    await page.keyboard.press("Control+k");
    await page
      .getByRole("textbox", { name: "Search tasks, documents, and assets" })
      .fill("P-204");
    const dialog = page.getByRole("dialog");
    const modalAudit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    accessibility.push({
      view: "search-modal",
      violations: modalAudit.violations,
    });
    assert.ok((await dialog.getByRole("button").count()) > 2);
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => !!document.activeElement?.closest("dialog")),
        true,
      );
    }
    await dialog
      .getByRole("button")
      .filter({ hasText: "Asset register" })
      .first()
      .click();
    await page
      .getByRole("dialog")
      .getByText("Sample vibration", { exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  });
  await check(
    "Settings save, validation and unsaved navigation recovery",
    async () => {
      await go("settings");
      await page.getByLabel("Display name", { exact: true }).fill("");
      await page.getByRole("button", { name: "Save preferences" }).click();
      await page.getByText("Enter a display name.", { exact: true }).waitFor();
      await page
        .getByLabel("Display name", { exact: true })
        .fill("Priya Sharma");
      await page.getByRole("button", { name: "Save preferences" }).click();
      await page.reload();
      assert.equal(
        await page.getByLabel("Display name", { exact: true }).inputValue(),
        "Priya Sharma",
      );
      await page
        .getByLabel("Display name", { exact: true })
        .fill("Unsaved analyst");
      await page.getByRole("link", { name: "Overview", exact: true }).click();
      await page
        .getByRole("dialog", { name: "Discard unsaved preferences?" })
        .waitFor();
      await page.getByRole("button", { name: "Keep editing" }).click();
      assert.equal(
        await page.getByLabel("Display name", { exact: true }).inputValue(),
        "Unsaved analyst",
      );
      await page.getByRole("link", { name: "Overview", exact: true }).click();
      await page
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Let's get to work, Priya." })
        .waitFor();
    },
  );
  await check(
    "Mobile routes at 390px: no page overflow, accessible navigation",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (const view of [
        "overview",
        "workspace",
        "knowledge",
        "assets",
        "approvals",
        "deliverables",
        "activity",
        "settings",
      ]) {
        await go(view);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `mobile ${view} overflows`,
        );
        await page.screenshot({
          path: `${output}/${view}-mobile.png`,
          fullPage: true,
        });
      }
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "Knowledge library", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Knowledge library", exact: true })
        .waitFor();
    },
  );
  await check("Offline and unknown route recovery", async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await page
      .getByText(
        "You're offline. Sample workflows and local files are still available.",
        { exact: true },
      )
      .waitFor();
    await context.setOffline(false);
    await go("missing-page");
    await page
      .getByRole("heading", { name: "This page doesn't exist" })
      .waitFor();
    await page.getByRole("button", { name: "Go to overview" }).click();
  });
  await check("320px and 720px responsive reflow", async () => {
    for (const width of [320, 720]) {
      await page.setViewportSize({ width, height: 900 });
      await go("overview");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
  });
  assert.deepEqual(errors, [], "Browser exceptions");
  assert.deepEqual(requests, [], "External network calls");
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ checks, accessibility, errors, requests }, null, 2),
  );
  const violations = accessibility.flatMap((r) =>
    r.violations.map((v) => ({
      view: r.view,
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  );
  console.log(
    JSON.stringify(
      { checks: checks.length, accessibilityViolations: violations },
      null,
      2,
    ),
  );
  assert.equal(
    violations.length,
    0,
    "Accessibility violations must be resolved",
  );
} finally {
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ checks, accessibility, errors, requests }, null, 2),
  );
  await browser.close();
}
