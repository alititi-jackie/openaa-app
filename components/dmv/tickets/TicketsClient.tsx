'use client'

import { useRef, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Share2,
  Shield,
} from 'lucide-react'

import { DetailBackButton } from '@/components/common/DetailBackButton'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { PageShareButton } from '@/components/common/PageShareButton'
import { DmvDisclaimerCard, DmvFaqSection, DmvInfoSection } from '@/components/dmv/DmvBottomSections'
import { DmvHorizontalNav } from '@/components/dmv/DmvHorizontalNav'
import { ChannelHero } from '@/components/posts/ChannelHero'
import {
  ALL_STATES,
  COMMON_STATES,
  FAQ,
  POPULAR_STATES,
  PREPARE_DOCS,
  TICKET_TYPE_LABELS,
  getRecommendedEntries,
  stateDataMap,
  type Entry,
  type StateData,
  type TicketType,
} from '@/features/dmv/tickets'

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ExternalEntryButton({ entry }: { entry: Entry }) {
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition-colors active:bg-zinc-100"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900">{entry.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{entry.description}</p>
      </div>
      <ExternalLink size={14} className="mt-0.5 shrink-0 text-blue-500" />
    </a>
  )
}

function StateCard({ stateData }: { stateData: StateData }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
          {stateData.state}
        </span>
        <div>
          <p className="text-sm font-bold text-zinc-900">{stateData.stateNameZh}</p>
          <p className="text-xs text-zinc-500">{stateData.stateNameEn}</p>
        </div>
      </div>
      <div className="space-y-2">
        {stateData.entries.map((entry) => (
          <ExternalEntryButton key={entry.url} entry={entry} />
        ))}
        {stateData.entries.length === 0 && stateData.fallbackUrl && (
          <a
            href={stateData.fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-blue-600"
          >
            前往官方入口 <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  )
}

function AllStatesGrid() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="mt-6">
      <h2 className="text-base font-bold text-zinc-900 mb-1">全美 50 州 + DC 官方入口</h2>
      <p className="text-xs text-zinc-500 mb-3">点击各州查看官方查询入口</p>

      {/* Always-visible compact grid */}
      <div className="grid grid-cols-2 gap-2">
        {(expanded ? ALL_STATES : ALL_STATES.slice(0, 10)).map((abbr) => {
          const s = stateDataMap[abbr]
          if (!s) return null
          return (
            <a
              key={abbr}
              href={s.fallbackUrl || s.entries[0]?.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 shadow-sm transition-colors active:bg-zinc-50"
            >
              <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">
                {abbr}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-800">{s.stateNameZh}</p>
                <p className="truncate text-[10px] text-zinc-400">{s.stateNameEn}</p>
              </div>
              <ExternalLink size={11} className="ml-auto shrink-0 text-zinc-300" />
            </a>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-600 shadow-sm transition-colors active:bg-zinc-50"
      >
        {expanded ? (
          <>收起 <ChevronUp size={15} /></>
        ) : (
          <>查看全部 {ALL_STATES.length} 州入口 <ChevronDown size={15} /></>
        )}
      </button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export default function TicketsClient() {
  const [plate, setPlate] = useState('')
  const [state, setState] = useState('')
  const [ticketType, setTicketType] = useState<TicketType | ''>('')
  const [stateError, setStateError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [result, setResult] = useState<{ state: string; ticketType: TicketType; plate: string } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let hasError = false
    if (!state) {
      setStateError('请选择所属州')
      hasError = true
    } else {
      setStateError('')
    }
    if (!ticketType) {
      setTypeError('请选择罚单类型')
      hasError = true
    } else {
      setTypeError('')
    }
    if (hasError) return

    setResult({ state, ticketType: ticketType as TicketType, plate: plate.trim() })
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const recommendedEntries = result ? getRecommendedEntries(result.state, result.ticketType) : []
  const resultStateData = result ? stateDataMap[result.state] : null
  const primaryEntry = recommendedEntries[0]
  const faqItems = FAQ.map((item) => ({ question: item.q, answer: item.a }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <DetailBackButton fallbackHref="/dmv" />
        <div className="flex items-center gap-2">
          <FavoriteButton
            target={{ type: "unsupported", message: "DMV 页面收藏暂未接入收藏表，当前不会写入收藏。" }}
            returnTo="/dmv/tickets"
          />
          <PageShareButton
            path="/dmv/tickets"
            title="罚单查询指南"
            text="停车罚单、红灯摄像头、超速拍照、交通罚单和过路费官方入口导航。"
            label={
              <span className="inline-flex items-center gap-1.5">
                <Share2 size={15} aria-hidden="true" />
                分享
              </span>
            }
          />
        </div>
      </div>
      <ChannelHero
        title="罚单查询指南"
        description="停车罚单、红灯摄像头、超速拍照、交通罚单和过路费官方入口导航。"
      />
      <DmvHorizontalNav activeValue="tickets" />

      {/* Query form */}
      <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm mb-4">
        <h2 className="text-base font-bold text-zinc-900 mb-3">查询入口</h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {/* Plate */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="plate">
              车牌号 <span className="text-xs font-normal text-zinc-400">（可选）</span>
            </label>
            <input
              id="plate"
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="可选，输入车牌号仅用于页面提示"
              autoComplete="off"
              maxLength={20}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="state">
              所属州 <span className="text-red-500">*</span>
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => { setState(e.target.value); setStateError('') }}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">请选择州</option>
              <optgroup label="常用州">
                {COMMON_STATES.map((abbr) => {
                  const s = stateDataMap[abbr]
                  return (
                    <option key={abbr} value={abbr}>
                      {abbr} — {s?.stateNameZh} ({s?.stateNameEn})
                    </option>
                  )
                })}
              </optgroup>
              <optgroup label="其他州">
                {ALL_STATES.filter((a) => !COMMON_STATES.includes(a)).map((abbr) => {
                  const s = stateDataMap[abbr]
                  return (
                    <option key={abbr} value={abbr}>
                      {abbr} — {s?.stateNameZh} ({s?.stateNameEn})
                    </option>
                  )
                })}
              </optgroup>
            </select>
            {stateError && <p className="mt-1 text-xs text-red-500">{stateError}</p>}
          </div>

          {/* Ticket type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="ticketType">
              罚单类型 <span className="text-red-500">*</span>
            </label>
            <select
              id="ticketType"
              value={ticketType}
              onChange={(e) => { setTicketType(e.target.value as TicketType | ''); setTypeError('') }}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">请选择罚单类型</option>
              {(Object.keys(TICKET_TYPE_LABELS) as TicketType[]).map((type) => (
                <option key={type} value={type}>{TICKET_TYPE_LABELS[type]}</option>
              ))}
            </select>
            {typeError && <p className="mt-1 text-xs text-red-500">{typeError}</p>}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors active:bg-blue-700"
          >
            查找官方入口
          </button>
        </form>
      </section>

      {/* Result card */}
      {result && (
        <div ref={resultRef} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm mb-4 scroll-mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="shrink-0 text-blue-600" />
            <h2 className="text-base font-bold text-zinc-900">推荐官方入口</h2>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-white border border-blue-100 p-3 mb-3 space-y-1">
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-700">所属州：</span>
              {result.state} — {stateDataMap[result.state]?.stateNameZh}
            </p>
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-700">罚单类型：</span>
              {TICKET_TYPE_LABELS[result.ticketType]}
            </p>
            {result.plate && (
              <div>
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">车牌号：</span>
                  {result.plate}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed">
                  ⚠️ 车牌号仅在本页面显示，OpenAA 不保存、不上传、不传递给任何官方网站或第三方。
                </p>
              </div>
            )}
          </div>

          {/* Recommended entries */}
          {recommendedEntries.length > 0 ? (
            <div className="space-y-2 mb-3">
              {recommendedEntries.map((entry) => (
                <ExternalEntryButton key={entry.url} entry={entry} />
              ))}
            </div>
          ) : (
            resultStateData?.fallbackUrl && (
              <a
                href={resultStateData.fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-blue-600 mb-3"
              >
                前往 {result.state} 官方入口 <ExternalLink size={13} />
              </a>
            )
          )}

          {/* Prepare docs */}
          <div className="rounded-xl bg-white border border-zinc-100 p-3 mb-3">
            <p className="text-xs font-semibold text-zinc-700 mb-2">可能需要准备的资料</p>
            <ul className="space-y-1">
              {PREPARE_DOCS[result.ticketType].map((doc) => (
                <li key={doc} className="flex items-start gap-1.5 text-xs text-zinc-600">
                  <span className="mt-0.5 text-blue-400">•</span>
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          {/* Primary CTA */}
          {primaryEntry && (
            <a
              href={primaryEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm mb-3"
            >
              前往官方查询网站
              <ArrowRight size={15} />
            </a>
          )}

          {/* Safety reminder */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <Shield size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-900">
              OpenAA 不直接查询或保存罚单数据。请在打开的政府、法院或官方机构网站上完成查询、缴费或申诉。
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">美国罚单查询入口</h2>
        <p className="mt-2 text-sm font-medium text-blue-700">U.S. Traffic & Parking Ticket Official Portals</p>
        <p className="mt-2 text-sm text-zinc-600">
          本页整理纽约停车罚单、超速罚单、红灯摄像头罚单、交通罚单和过路费查询路径，帮助你找到对应的官方入口。
        </p>
        <p className="mt-1 text-xs text-zinc-400">OpenAA 不保存车牌号，也不直接查询罚单数据。</p>
      </section>

      {/* NY common portals */}
      <section className="mt-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900 mb-1">纽约常用入口</h2>
        <p className="text-xs text-zinc-500 mb-3">New York — 最常用的罚单查询入口</p>
        <div className="space-y-2">
          {stateDataMap['NY'].entries.map((entry) => (
            <ExternalEntryButton key={entry.url} entry={entry} />
          ))}
        </div>
      </section>

      {/* Popular states */}
      <section className="mt-4">
        <h2 className="text-base font-bold text-zinc-900 mb-3">热门州入口</h2>
        <div className="space-y-3">
          {POPULAR_STATES.filter((s) => s !== 'NY').map((abbr) => {
            const s = stateDataMap[abbr]
            if (!s) return null
            return <StateCard key={abbr} stateData={s} />
          })}
        </div>
      </section>

      {/* All states grid */}
      <AllStatesGrid />

      <DmvFaqSection items={faqItems} />

      <DmvDisclaimerCard>
        <p>
          OpenAA 不提供法律意见，也不直接查询或保存罚单数据。本页面仅整理官方查询入口和中文说明。具体罚单金额、期限、申诉和缴费结果，请以政府、法院或官方机构网站为准。
        </p>
        <p className="font-medium text-amber-800">安全提醒：</p>
        <ul className="space-y-1">
          <li>• 不要在非官方网站输入信用卡或个人敏感信息</li>
          <li>• 核对网址是否为 .gov 或官方机构域名</li>
          <li>• 如罚单已逾期，请尽快到官方系统处理</li>
          <li>• 如需申诉，请按官方页面说明在规定期限内提交</li>
        </ul>
      </DmvDisclaimerCard>

      <DmvInfoSection>
        <p>OpenAA 提供停车罚单、红灯摄像头、超速拍照、交通罚单和过路费的官方入口导航。</p>
        <p>OpenAA 不保存车牌信息，也不直接查询罚单数据；金额、状态和截止日期请以官方系统为准。</p>
        <p>本页整理纽约常用入口和全美州级入口，方便纽约华人快速找到正确查询路径。</p>
      </DmvInfoSection>
    </div>
  )
}
