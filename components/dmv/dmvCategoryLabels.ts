export const dmvCategoryLabels: Record<string, string> = {
  "traffic-signs": "交通标志",
  "road-signs-general": "交通标志基础",
  "traffic-control": "交通信号与控制",
  "right-of-way": "让路规则",
  turns: "转弯",
  "passing-lanes": "超车与车道",
  parking: "停车",
  "speed-weather": "速度与天气",
  highway: "高速公路",
  "alcohol-drugs": "酒精与药物",
  law: "交通法规",
  safety: "安全驾驶",
  "sharing-road": "共享道路",
};

export function getDmvCategoryLabel(category: string) {
  return dmvCategoryLabels[category] ?? category;
}
