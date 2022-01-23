// import {inspect} from "node:util";

import axios from "axios";
import cheerio from "cheerio";
import yaml from "js-yaml";

const ESLINT_RULES_URL = "https://raw.githubusercontent.com/eslint/website/master/_data/rules.yml";

const docsUrl = (name = "") => `https://eslint.org/docs/rules/${name}`;

async function downloadRules(yamlUrl = ESLINT_RULES_URL) {
  const res = await axios.get(yamlUrl);
  const $rules = yaml.load(res.data);
  
  const ruleMap = new Map();
  
  // Deprecated rules...
  for (const { name, ...rest } of $rules.deprecated.rules) {
    const excerpt = await getRuleExcerpt(name);
    ruleMap.set(name, {
      name,
      ...rest,
      deprecated: true,
      docs: docsUrl(name),
      excerpt
    });
  }
  
  // Removed rules...
  for (const { removed: name, ...rest } of $rules.removed.rules) {
    const excerpt = await getRuleExcerpt(name);
    ruleMap.set(name, {
      name,
      ...rest,
      removed: true,
      docs: docsUrl(name),
      excerpt
    });
  }
  
  // "Active" rules...
  for (const type of $rules.types) {
    for (const { name, ...rest } of type.rules) {
      ruleMap.set(name, {
        name,
        ...rest,
        type: type.name,
        docs: docsUrl(name),
        // Skip excerpt for active rules.
      });
    }
  }
  
  return Object.fromEntries(ruleMap);
}

async function getRuleExcerpt(name = "") {
  const $url = docsUrl(name);
  const {data: html} = await axios.get($url);
  const $ = cheerio.load(html);
  const excerpt = $(`h1 ~ p`).first();
  return excerpt.text();
}

export default downloadRules;
export { ESLINT_RULES_URL, docsUrl, getRuleExcerpt };
