import type { PostFormErrors, PostFormValues } from "./formTypes";

export function shouldReviewPost(values: PostFormValues) {
  void values;
  return false;
}

export function validatePostForm(values: PostFormValues) {
  const errors: PostFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "请填写标题。";
  }

  if (!values.body.trim()) {
    errors.body = "请填写详细描述。";
  }

  if (!values.contact.phone.trim() && !values.contact.wechat.trim() && !values.contact.email.trim()) {
    errors.contact = "请至少填写联系电话、微信或邮箱，方便用户联系你。";
  }

  if (values.postType !== "job" && values.images.length > 6) {
    errors.images = "每帖最多上传 6 张图片。";
  }

  if (values.postType === "job") {
    if (!values.job?.job_mode) errors.job_mode = "请选择招聘/求职类型。";
    if (!values.job?.work_area.trim()) errors.work_area = "请填写工作区域。";
  }

  if (values.postType === "housing") {
    if (!values.housing?.housing_mode) errors.housing_mode = "请选择房屋信息类型。";
    if (!values.housing?.room_type.trim()) errors.room_type = "请填写房型。";
  }

  if (values.postType === "marketplace") {
    if (!values.marketplace?.marketplace_mode) errors.marketplace_mode = "请选择出售或求购。";
    if (!values.marketplace?.category.trim()) errors.category = "请填写分类。";
  }

  if (values.postType === "service") {
    if (!values.service?.service_category.trim()) errors.service_category = "请填写服务分类。";
    if (!values.service?.service_area.trim()) errors.service_area = "请填写服务区域。";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
