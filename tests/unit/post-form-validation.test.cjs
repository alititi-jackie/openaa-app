/* eslint-disable @typescript-eslint/no-require-imports */
require("../fixtures/load-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const { emptyPostFormValues } = require("../../features/posts/formMappers.ts");
const { validatePostForm } = require("../../features/posts/validators.ts");
const { LOCATION_OPTIONS, JOB_CATEGORY_OPTIONS, JOB_TYPE_OPTIONS, MARKETPLACE_CATEGORY_OPTIONS, SERVICE_CATEGORY_OPTIONS } = require("../../features/posts/options.ts");

function validValues(type, mode = "create") {
  const values = emptyPostFormValues(type);
  values.mode = mode;
  values.body = "测试信息内容";
  values.contact.phone = "212-555-1234";
  values.location_area = LOCATION_OPTIONS[0].value;
  if (type === "job") Object.assign(values.job, { job_type: JOB_TYPE_OPTIONS[0].value, job_category: JOB_CATEGORY_OPTIONS[0].value, work_area: values.location_area });
  if (type === "housing") { values.housing.housing_mode = "rent"; values.title = "测试房源"; }
  if (type === "marketplace") { values.title = "测试商品"; Object.assign(values.marketplace, { category: MARKETPLACE_CATEGORY_OPTIONS[0].value, trade_area: values.location_area }); }
  if (type === "service") { values.title = "测试服务"; Object.assign(values.service, { service_category: SERVICE_CATEGORY_OPTIONS[0].value, service_area: values.location_area }); }
  return values;
}

for (const mode of ["create", "edit"]) {
  for (const type of ["job", "housing", "marketplace", "service"]) {
    test(`${type} ${mode}: all missing fields are reported together and optional fields stay optional`, () => {
      const empty = emptyPostFormValues(type);
      empty.mode = mode;
      const errors = validatePostForm(empty).errors;
      assert.ok(errors.body);
      assert.ok(errors.contact);
      const keys = {
        job: ["job_type", "job_category", "work_area"],
        housing: ["housing_mode", "title", "location_area"],
        marketplace: ["trade_area", "category", "title"],
        service: ["title", "service_category", "service_area"],
      }[type];
      for (const key of keys) assert.ok(errors[key], key);
      assert.equal(validatePostForm(validValues(type, mode)).valid, true);
    });
  }
}

test("phone and WeChat are alternatives, but populated values must be valid", () => {
  const values = validValues("job");
  values.contact.phone = "";
  values.contact.wechat = "jackie123";
  assert.equal(validatePostForm(values).valid, true);
  values.contact.wechat = "";
  values.contact.email = "jackie@example.com";
  assert.ok(validatePostForm(values).errors.contact);
  values.contact.phone = "bad";
  values.contact.wechat = "jackie123";
  assert.ok(validatePostForm(values).errors.phone);
  values.contact.phone = "212-555-1234";
  values.contact.wechat = "x";
  assert.ok(validatePostForm(values).errors.wechat);
});

test("seeking jobs and buying secondhand items retain optional titles", () => {
  const job = validValues("job");
  job.title = "";
  job.job.job_mode = "seeking";
  assert.equal(validatePostForm(job).valid, true);
  const item = validValues("marketplace");
  item.title = "";
  item.marketplace.marketplace_mode = "buying";
  item.marketplace.price = "$100 - $200";
  assert.equal(validatePostForm(item).valid, true);
});

test("optional amounts preserve native min and step constraints in the shared validator", () => {
  for (const type of ["job", "housing", "marketplace"]) {
    const values = validValues(type);
    const key = type === "job" ? "salary_min" : "price";
    const detail = type === "job" ? values.job : values[type];
    for (const value of ["-1", "NaN", "Infinity", "1.234"]) {
      detail[key] = value;
      assert.ok(validatePostForm(values).errors[key], `${type}: ${value}`);
    }
    for (const value of ["", "0", "100"]) {
      detail[key] = value;
      assert.equal(validatePostForm(values).valid, true, `${type}: ${value}`);
    }
    detail[key] = "19.99";
    assert.equal(validatePostForm(values).valid, type === "marketplace");
  }
  const values = validValues("marketplace");
  values.marketplace.price = "0.29";
  assert.equal(validatePostForm(values).valid, true);
});
