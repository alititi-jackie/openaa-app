/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseNewsBodyLinks } = require("../../features/news/bodyLinks.ts");

test("news body supports labeled links and existing plain URLs", () => {
  assert.deepEqual(parseNewsBodyLinks("进入[OpenAA DMV](https://dmv.openaa.com/)；访问 https://toolku.com/。"), [
    { text: "进入" },
    { text: "OpenAA DMV", href: "https://dmv.openaa.com/" },
    { text: "；访问 " },
    { text: "https://toolku.com/", href: "https://toolku.com/" },
    { text: "。" },
  ]);
});

test("news body does not turn unsafe or invalid links into anchors", () => {
  assert.deepEqual(parseNewsBodyLinks("[打开](javascript:alert(1)) https://invalid/ <script>"), [
    { text: "[打开](javascript:alert(1)) " },
    { text: "https://invalid/" },
    { text: " <script>" },
  ]);
});
