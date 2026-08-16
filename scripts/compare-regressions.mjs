import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sol = JSON.parse(await readFile(resolve("work/regression/gpt-5.6-sol.json"), "utf8"));
const terra = JSON.parse(await readFile(resolve("work/regression/gpt-5.6-terra.json"), "utf8"));
if (sol.status !== "completed" || terra.status !== "completed") {
  console.error("Both regression runs must complete before model quality can be compared.");
  process.exit(2);
}
const solCases = new Map(sol.cases.map((item) => [item.caseId, item]));

const comparison = terra.cases.map((item) => {
  const baseline = solCases.get(item.caseId);
  return {
    caseId: item.caseId,
    name: item.name,
    sol: Boolean(baseline?.evaluation?.pass),
    terra: Boolean(item.evaluation?.pass),
    regression: Boolean(baseline?.evaluation?.pass) && !item.evaluation?.pass,
  };
});

const report = {
  solPassed: Boolean(sol.passed),
  terraPassed: Boolean(terra.passed),
  terraHasRegression: comparison.some((item) => item.regression),
  cases: comparison,
};
console.log(JSON.stringify(report, null, 2));
if (report.terraHasRegression) process.exitCode = 1;
