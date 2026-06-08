import type { PostFormErrors, PostFormValues } from "./formTypes";
import { POST_IMAGE_CONFIG } from "./imageConfig";
import {
  HOUSING_MODE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  JOB_MODE_OPTIONS,
  JOB_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  SECONDHAND_CATEGORY_OPTIONS,
  SECONDHAND_MODE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  isOptionValue,
} from "./options";

const CONTACT_MISSING_MESSAGE = "请至少填写联系电话或微信，方便用户联系你。";

function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

function validatePhone(phone: string) {
  const value = phone.trim();
  if (!value) return undefined;
  if (/[^\d+\s\-()]/.test(value)) return "输入电话号码有误，请输入正确的联系电话。";
  const digits = normalizePhoneDigits(value);
  if (digits.length < 8 || digits.length > 15) return "输入电话号码有误，请输入正确的联系电话。";
  return undefined;
}

function validateWechat(wechat: string) {
  const value = wechat.trim();
  if (!value) return undefined;
  if (value.length < 4 || value.length > 50) return "微信号有误，请填写正确的微信号。";
  return undefined;
}

export function shouldReviewPost(values: PostFormValues) {
  void values;
  return false;
}

export function validatePostForm(values: PostFormValues) {
  const errors: PostFormErrors = {};

  if (!values.body.trim()) {
    errors.body = values.postType === "service" ? "请填写服务介绍。" : "请填写信息内容。";
  }

  const phoneError = validatePhone(values.contact.phone);
  if (phoneError) errors.phone = phoneError;

  const wechatError = validateWechat(values.contact.wechat);
  if (wechatError) errors.wechat = wechatError;

  if (!values.contact.phone.trim() && !values.contact.wechat.trim()) {
    errors.contact = CONTACT_MISSING_MESSAGE;
  }

  if (values.postType !== "job" && values.images.length > POST_IMAGE_CONFIG.maxImages) {
    errors.images = `最多只能上传 ${POST_IMAGE_CONFIG.maxImages} 张图片。`;
  }

  if (values.postType === "job") {
    if (!isOptionValue(JOB_MODE_OPTIONS, values.job?.job_mode)) errors.job_mode = "请选择招聘/求职类型。";
    if (!isOptionValue(JOB_CATEGORY_OPTIONS, values.job?.job_category)) errors.job_category = "请选择职位分类。";
    if (!isOptionValue(JOB_TYPE_OPTIONS, values.job?.job_type)) errors.job_type = "请选择工作类型。";
    if (!isOptionValue(LOCATION_OPTIONS, values.job?.work_area)) errors.work_area = "请选择工作地点。";
  }

  if (values.postType === "housing") {
    if (!isOptionValue(HOUSING_MODE_OPTIONS, values.housing?.housing_mode)) errors.housing_mode = "请选择房屋信息类型。";
    if (!isOptionValue(LOCATION_OPTIONS, values.location_area)) errors.location_area = "请选择地区。";
  }

  if (values.postType === "marketplace") {
    if (!isOptionValue(SECONDHAND_MODE_OPTIONS, values.marketplace?.marketplace_mode)) errors.marketplace_mode = "请选择出售或求购。";
    if (!isOptionValue(LOCATION_OPTIONS, values.marketplace?.trade_area)) errors.trade_area = "请选择所在地区。";
    if (!isOptionValue(SECONDHAND_CATEGORY_OPTIONS, values.marketplace?.category)) errors.category = "请选择商品分类。";
    if (values.marketplace?.marketplace_mode === "selling" && !values.title.trim()) errors.title = "请填写商品标题。";
  }

  if (values.postType === "service") {
    if (!values.title.trim()) errors.title = "请填写服务标题。";
    if (!isOptionValue(SERVICE_CATEGORY_OPTIONS, values.service?.service_category)) errors.service_category = "请选择你的服务分类。";
    if (!isOptionValue(LOCATION_OPTIONS, values.service?.service_area)) errors.service_area = "请选择服务地区。";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
