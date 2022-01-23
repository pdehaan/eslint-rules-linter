#!/usr/bin/env node

import downloadRules from "./lib.mjs";

const rules = await downloadRules();

console.log(JSON.stringify(rules));
