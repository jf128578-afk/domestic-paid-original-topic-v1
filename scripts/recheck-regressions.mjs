import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateRegression } from "../lib/regression-evaluation.mjs";
import { regressionCases } from "../lib/regression-cases.mjs";

const casesById = new Map(regressionCases.map((item) => [item.id, item]));
for (const model of process.argv.slice(2)) {
  const outputPath = resolve("work/regression", `${model}.json`);
  const report = JSON.parse(await readFile(outputPath, "utf8"));
  report.cases = report.cases.map((item) => {
    if (!item.result || !casesById.has(item.caseId)) return item;
    return {
      ...item,
      evaluation: evaluateRegression(casesById.get(item.caseId), item.result),
    };
  });
  const completed = report.cases.every((item) => item.status !== "infrastructure_error");
  report.status = completed ? "completed" : "infrastructure_error";
  report.passed = completed ? report.cases.every((item) => item.evaluation.pass) : null;
  await writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ model, passed: report.passed }));
}
