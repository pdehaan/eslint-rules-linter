import fs from "node:fs/promises";
import path from "node:path";

const config = await readJson("./.eslintrc.json");

const errors = await lintRules(config.rules);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit();
}

async function readJson(file) {
  return fs.readFile(file).then(JSON.parse);
}

async function lintRules(configRules = {}, eslintRules) {
  if (!eslintRules) {
    const eslintRulesPath = path.join(process.cwd(), "eslint.rules.json");
    eslintRules = await readJson(eslintRulesPath);
  }
  const hasRule = (name) => name in eslintRules;
  const isDeprecated = (name) => eslintRules[name]?.deprecated;
  const isRemoved = (name) => eslintRules[name]?.removed;
  const isScopedRule = (name) => name.includes("/");
  const errors = [];

  for (let [rule, rest] of Object.entries(configRules)) {
    if (!Array.isArray(rest)) {
      // If `rest` is not an array, it's likely a lone off|warn|error string, wrap in an array.
      rest = [rest];
    }
    // Destructure rest parameter into severity and config array.
    const [severity, ...config] = rest;
    const data = {
      rule,
      severity: ruleSeverity(severity),
      severityCode: Number.isInteger(severity) ? severity : undefined,
      config: config.length ? config : undefined,
    };
    const deprecated =  isDeprecated(rule);
    const removed = isRemoved(rule);

    if (deprecated || removed) {
      errors.push({
        ...data,
        status: deprecated ? "DEPRECATED" : removed ? "REMOVED" : "???",
        message: eslintRules[rule]?.excerpt,
      });
      process.exitCode = 1;
    } else if (!isScopedRule(rule) && !hasRule(rule)) {
      errors.push({
        ...data,
        status: "ERROR",
        message: `Definition for rule '${rule}' was not found`,
      });
      process.exitCode = 1;
    }
  }
  return errors;
}

function ruleSeverity(severity) {
  const labels = ["off", "warn", "error"];
  // If the severity is an old [0|1|2]-style value, convert it to an [off|warn|error]-style value.
  if (Number.isInteger(severity)) {
    return labels[severity];
  }
  return severity;
}
