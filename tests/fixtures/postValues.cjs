/* eslint-disable @typescript-eslint/no-require-imports */
const { JOB_CATEGORY_OPTIONS, JOB_TYPE_OPTIONS, LOCATION_OPTIONS } = require("../../features/posts/options.ts");

function validJob(overrides = {}) {
  return {
    postType: "job",
    mode: "create",
    title: "服务员",
    summary: "",
    body: "诚聘服务员",
    location_area: LOCATION_OPTIONS[0].value,
    visibility: "public",
    contact: { contact_name: "", phone: "212-555-1234", wechat: "", email: "", preferred_contact_method: "phone" },
    images: [],
    job: {
      job_mode: "hiring",
      job_category: JOB_CATEGORY_OPTIONS[0].value,
      job_type: JOB_TYPE_OPTIONS[0].value,
      work_area: LOCATION_OPTIONS[0].value,
    },
    ...overrides,
  };
}

module.exports = { validJob };
