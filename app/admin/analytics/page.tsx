import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ANALYTICS_SITES } from "@/features/analytics/shared";
import {
  analyticsFilters,
  getUnifiedAnalytics,
} from "@/features/analytics/unifiedQueries";

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "流量中心",
  description: "OpenAA 各站点访问统计",
  path: "/admin/analytics",
  noIndex: true,
});
const panel = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const number = (value: number) => value.toLocaleString("en-US");

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; period?: string }>;
}) {
  const params = await searchParams;
  const { site, period } = analyticsFilters(params.site, params.period);
  return (
    <AdminAuthGate>
      {async () => {
        const { data, error } = await getUnifiedAnalytics(site, period);
        const maxViews = Math.max(
          1,
          ...(data?.daily.map((day) => day.views) ?? []),
        );
        return (
          <div className="space-y-4">
            <AdminTopActions />
            <div>
              <h1 className="text-2xl font-black">OpenAA 流量中心</h1>
              <p className="mt-1 text-sm text-slate-600">
                按纽约时间统计 · America/New_York
              </p>
            </div>
            <form
              className={`${panel} flex flex-wrap items-end gap-3`}
              action="/admin/analytics"
            >
              <label className="grid gap-1 text-sm font-semibold">
                站点
                <select
                  name="site"
                  defaultValue={site ?? ""}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">全部站点</option>
                  {Object.entries(ANALYTICS_SITES).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                时间
                <select
                  name="period"
                  defaultValue={period}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="today">今日</option>
                  <option value="yesterday">昨日</option>
                  <option value="7">最近 7 天</option>
                  <option value="30">最近 30 天</option>
                </select>
              </label>
              <button className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 font-bold text-blue-700">
                查看统计
              </button>
            </form>
            {error ? (
              <p role="alert" className={panel}>
                {error}
              </p>
            ) : data ? (
              <>
                <p className="text-sm text-slate-600">
                  {data.startDate} 至 {data.endDate}（今日数据截至当前）
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["页面浏览量 PV", data.views],
                    ["独立访客 UV（估算）", data.visitors],
                  ].map(([label, value]) => (
                    <section key={label} className={panel}>
                      <h2 className="text-sm text-slate-600">{label}</h2>
                      <p className="mt-2 text-3xl font-black text-blue-700">
                        {number(Number(value))}
                      </p>
                    </section>
                  ))}
                </div>
                {data.views === 0 && (
                  <p className={panel}>
                    所选范围暂无访问记录。新接入站点从采集上线后开始记录。
                  </p>
                )}
                <section className={panel}>
                  <h2 className="mb-4 font-bold">每日趋势</h2>
                  <div className="flex h-36 items-end gap-1" aria-hidden="true">
                    {data.daily.map((day) => (
                      <div
                        key={day.day}
                        title={`${day.day}: ${day.views} PV / ${day.visitors} UV`}
                        className="flex h-full min-w-0 flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t bg-blue-400"
                          style={{ height: `${(day.views / maxViews) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{data.startDate}</span>
                    <span>{data.endDate}</span>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                      查看每日 PV / UV 明细
                    </summary>
                    <div className="mt-2 max-h-80 overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th>日期</th>
                            <th>PV</th>
                            <th>UV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.daily.map((day) => (
                            <tr
                              key={day.day}
                              className="border-t border-slate-100"
                            >
                              <td className="py-2">{day.day}</td>
                              <td>{number(day.views)}</td>
                              <td>{number(day.visitors)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </section>
                <section className={panel}>
                  <h2 className="mb-3 font-bold">各站点对比</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr>
                          <th>站点</th>
                          <th>PV</th>
                          <th>UV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(ANALYTICS_SITES)
                          .filter(([key]) => !site || site === key)
                          .map(([key, item]) => {
                            const row = data.sites.find(
                              (entry) => entry.label === key,
                            );
                            return (
                              <tr
                                key={key}
                                className="border-t border-slate-100"
                              >
                                <td className="py-2">{item.name}</td>
                                <td>{number(row?.views ?? 0)}</td>
                                <td>{number(row?.visitors ?? 0)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className={panel}>
                  <details open>
                    <summary className="cursor-pointer font-bold">
                      热门页面 Top 50
                    </summary>
                    <p className="my-2 text-xs text-slate-500">
                      按页面浏览量排序；相同路径在不同站点分别统计。
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th>页面</th>
                            <th className="px-3">PV</th>
                            <th>UV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.pages.map((page) => (
                            <tr
                              key={`${page.site}:${page.path}`}
                              className="border-t border-slate-100"
                            >
                              <td className="py-3">
                                <a
                                  className="break-all text-blue-700"
                                  href={
                                    ANALYTICS_SITES[page.site].origin +
                                    page.path
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {ANALYTICS_SITES[page.site].name} ·{" "}
                                  {page.path}
                                </a>
                                {page.title && (
                                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                    {page.title}
                                  </p>
                                )}
                              </td>
                              <td className="px-3">{number(page.views)}</td>
                              <td>{number(page.visitors)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </section>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["sources", "访问来源"],
                    ["devices", "设备类型"],
                    ["countries", "国家"],
                    ["regions", "地区"],
                    ["browsers", "浏览器"],
                    ["systems", "操作系统"],
                  ].map(([key, label]) => (
                    <section key={key} className={panel}>
                      <h2 className="mb-3 font-bold">
                        {label}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          PV · 最多 20 项
                        </span>
                      </h2>
                      {data.dimensions[key]?.length ? (
                        <ul className="space-y-2 text-sm">
                          {data.dimensions[key].map((row) => (
                            <li
                              key={row.label}
                              className="flex justify-between gap-3"
                            >
                              <span className="break-all">
                                {(
                                  {
                                    mobile: "手机",
                                    desktop: "电脑",
                                    tablet: "平板",
                                  } as Record<string, string>
                                )[row.label] ?? row.label}
                              </span>
                              <span>{number(row.views)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">暂无数据</p>
                      )}
                    </section>
                  ))}
                </div>
              </>
            ) : null}
            <p className="text-xs leading-6 text-slate-500">
              PV 是页面打开次数，不是按钮点击次数。UV
              按各站浏览器标识去重，全部站点 UV
              为各站去重人数之和，同一个人跨站或换设备可能重复计算。旧记录沿用已有标识，升级前后
              UV
              可能不连续。已过滤常见机器人，但不能保证全部是真人；拦截脚本的访问可能漏计。来源为空显示“直接访问
              / 未知”；地区缺失不作推断。
            </p>
            <Link
              href="/admin/dashboard"
              className="inline-block text-sm font-bold text-blue-700"
            >
              ← 返回后台
            </Link>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}
