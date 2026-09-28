/* eslint-disable @typescript-eslint/no-require-imports */
require("../fixtures/load-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const { validateNickname } = require("../../features/auth/nicknameValidation.ts");
const { validatePasswordPolicy } = require("../../lib/auth/password-policy.ts");
const { normalizeWebsiteUrl } = require("../../lib/validation/url.ts");
const { validJob } = require("../fixtures/postValues.cjs");
const { validatePostForm } = require("../../features/posts/validators.ts");
const { getAdminPostOperationOptions } = require("../../features/posts/adminOperations.ts");
const { mapPostRecordToCard, mapPostRecordToDetail } = require("../../features/posts/mappers.ts");
const { emptyPostFormValues, formValuesFromDetail } = require("../../features/posts/formMappers.ts");

test("nickname rules accept ordinary names and reject impersonation", () => {
  assert.deepEqual(validateNickname("  Jackie  "), { ok: true, nickname: "Jackie" });
  assert.equal(validateNickname("abc").ok, false);
  assert.equal(validateNickname("OpenAA官方客服").ok, false);
});

test("password rules reject weak values and an email-prefix match", () => {
  assert.equal(validatePasswordPolicy("12345678").ok, false);
  assert.equal(validatePasswordPolicy("00000000").ok, false);
  assert.equal(validatePasswordPolicy("jackie", { email: "jackie@example.com" }).ok, false);
  assert.equal(validatePasswordPolicy("Sailboat92", { email: "jackie@example.com" }).ok, true);
});

test("website URLs block unsafe schemes and protocol-relative paths", () => {
  assert.equal(normalizeWebsiteUrl("javascript:alert(1)").ok, false);
  assert.equal(normalizeWebsiteUrl("//evil.example", { allowInternalPath: true }).ok, false);
  assert.deepEqual(normalizeWebsiteUrl("/jobs", { allowInternalPath: true }), { ok: true, value: "/jobs" });
  assert.deepEqual(normalizeWebsiteUrl("example.com"), { ok: true, value: "https://example.com" });
});

test("post form validation keeps contact and required job fields mandatory", () => {
  assert.equal(validatePostForm(validJob()).valid, true);
  const missing = validatePostForm(validJob({ body: " ", contact: { phone: "", wechat: "" }, job: {} }));
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.contact);
  assert.ok(missing.errors.body);
  assert.ok(missing.errors.job_mode);
  assert.ok(missing.errors.work_area);
});

test("post mapping displays the author's nickname on job cards", () => {
  const post = {
    id: "job-1",
    post_type: "job",
    author_id: "user-1",
    is_anonymous: false,
    title: "招聘服务员",
    summary: "纽约餐厅招聘",
    body: "详细内容",
    category: null,
    subcategory: null,
    status: "published",
    visibility: "public",
    price_amount: null,
    currency: null,
    metadata: {},
    published_at: "2026-09-27T12:00:00Z",
    expires_at: null,
    created_at: "2026-09-27T12:00:00Z",
    updated_at: "2026-09-27T12:00:00Z",
  };
  const authors = { "user-1": { id: "user-1", nickname: "Jackie", avatar_url: null } };
  const card = mapPostRecordToCard(post, authors);
  assert.equal(card.authorName, "Jackie");
  assert.equal(card.href, "/jobs/job-1");
  assert.equal(card.description, "纽约餐厅招聘");

  const anonymous = { ...post, is_anonymous: true };
  const anonymousCard = mapPostRecordToCard(anonymous, authors);
  const anonymousDetail = mapPostRecordToDetail(anonymous, authors);
  assert.equal(anonymousCard.authorName, "匿名发布");
  assert.equal(anonymousCard.listingMetaFields.find((field) => field.key === "author").value, "匿名发布");
  assert.equal(anonymousDetail.detailMetaFields.find((field) => field.key === "author").value, "匿名发布");
  assert.equal(anonymousDetail.sourceRecord.author_id, "user-1");
  assert.equal(emptyPostFormValues("job").isAnonymous, false);
  assert.equal(formValuesFromDetail(anonymousDetail).isAnonymous, true);
});

test("published posts offer hide but pending posts offer approve", () => {
  const published = getAdminPostOperationOptions("published").map(({ operation }) => operation);
  const pending = getAdminPostOperationOptions("pending_review").map(({ operation }) => operation);
  assert.ok(published.includes("hide"));
  assert.ok(!published.includes("approve"));
  assert.ok(pending.includes("approve"));
  assert.ok(!pending.includes("hide"));
});
