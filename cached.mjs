#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const localRules = path.join(process.cwd(), "eslint.rules.json");
const rules = await fs.readFile(localRules).then(JSON.parse);

console.log(JSON.stringify(rules));
