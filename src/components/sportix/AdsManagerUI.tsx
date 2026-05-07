'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Eye, MousePointerClick, DollarSign, Target,
  Download, Calendar, Plus, Search,
  ChevronDown, ChevronLeft, ChevronRight,
  Edit3, MoreHorizontal, Megaphone,
  ArrowUpRight, ArrowDownRight, Copy,
  Rocket, FileText, Layout, X, CloudUpload,
  type LucideIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface AdItem {
  id: string
  name: string
  type: 'Video' | 'Banner'
  placement: string
  status: 'Active' | 'Paused'
  impressions: number
  clicks: number
  ctr: number
  revenue: number
}

type PerfMetric = 'revenue' | 'impressions' | 'clicks' | 'ctr' | 'cpc'

interface TopAd {
  rank: number
  name: string
  type: string
  placement: string
  revenue: string
  clicks: number
  color: string
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
const MOCK_ADS: AdItem[] = [
  { id: '1', name: 'Summer Sale Video', type: 'Video', placement: 'Homepage', status: 'Active', impressions: 24500, clicks: 735, ctr: 11.94, revenue: 26.68 },
  { id: '2', name: 'Gaming Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 18320, clicks: 612, ctr: 11.25, revenue: 15.42 },
  { id: '3', name: 'Tech Promo Video', type: 'Video', placement: 'Sidebar', status: 'Paused', impressions: 12450, clicks: 498, ctr: 10.12, revenue: 9.80 },
  { id: '4', name: 'App Install Banner', type: 'Banner', placement: 'Footer', status: 'Active', impressions: 9850, clicks: 321, ctr: 8.91, revenue: 7.25 },
  { id: '5', name: 'New Collection Video', type: 'Video', placement: 'Homepage', status: 'Active', impressions: 7120, clicks: 178, ctr: 7.61, revenue: 5.60 },
  { id: '6', name: 'Premium Plan Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 16800, clicks: 580, ctr: 10.82, revenue: 12.90 },
  { id: '7', name: 'Sports Highlight Video', type: 'Video', placement: 'Sidebar', status: 'Active', impressions: 11200, clicks: 412, ctr: 9.46, revenue: 8.75 },
  { id: '8', name: 'Food Delivery Banner', type: 'Banner', placement: 'Footer', status: 'Paused', impressions: 8900, clicks: 295, ctr: 8.42, revenue: 6.30 },
  { id: '9', name: 'Fitness App Video', type: 'Video', placement: 'Homepage', status: 'Active', impressions: 13500, clicks: 520, ctr: 11.14, revenue: 11.20 },
  { id: '10', name: 'Travel Deals Banner', type: 'Banner', placement: 'Sidebar', status: 'Active', impressions: 10200, clicks: 380, ctr: 9.58, revenue: 7.85 },
  { id: '11', name: 'Education Promo Video', type: 'Video', placement: 'Homepage', status: 'Active', impressions: 14200, clicks: 490, ctr: 9.72, revenue: 10.50 },
  { id: '12', name: 'Fashion Week Banner', type: 'Banner', placement: 'Footer', status: 'Active', impressions: 7800, clicks: 260, ctr: 8.46, revenue: 5.95 },
  { id: '13', name: 'Auto Show Video', type: 'Video', placement: 'Sidebar', status: 'Paused', impressions: 9100, clicks: 310, ctr: 8.57, revenue: 6.80 },
  { id: '14', name: 'Cloud Storage Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 15600, clicks: 540, ctr: 10.44, revenue: 11.75 },
  { id: '15', name: 'Movie Premiere Video', type: 'Video', placement: 'Homepage', status: 'Active', impressions: 19800, clicks: 680, ctr: 11.62, revenue: 14.30 },
  { id: '16', name: 'Dating App Video', type: 'Video', placement: 'Footer', status: 'Active', impressions: 6400, clicks: 195, ctr: 7.66, revenue: 4.50 },
  { id: '17', name: 'Insurance Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 12500, clicks: 420, ctr: 8.96, revenue: 8.20 },
  { id: '18', name: 'Pet Care Video', type: 'Video', placement: 'Sidebar', status: 'Active', impressions: 5800, clicks: 175, ctr: 7.59, revenue: 3.90 },
  { id: '19', name: 'Smart Home Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 14700, clicks: 510, ctr: 10.61, revenue: 10.10 },
  { id: '20', name: 'Crypto Trading Video', type: 'Video', placement: 'Homepage', status: 'Paused', impressions: 11800, clicks: 390, ctr: 8.47, revenue: 7.60 },
  { id: '21', name: 'Job Portal Banner', type: 'Banner', placement: 'Footer', status: 'Active', impressions: 8200, clicks: 270, ctr: 8.54, revenue: 5.40 },
  { id: '22', name: 'Social Media Video', type: 'Video', placement: 'Sidebar', status: 'Active', impressions: 10500, clicks: 360, ctr: 8.57, revenue: 7.10 },
  { id: '23', name: 'Real Estate Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 13200, clicks: 460, ctr: 10.76, revenue: 9.45 },
  { id: '24', name: 'Gaming Console Banner', type: 'Banner', placement: 'Homepage', status: 'Active', impressions: 17100, clicks: 590, ctr: 10.88, revenue: 13.20 },
  { id: '25', name: 'Music Stream Ad', type: 'Banner', placement: 'Footer', status: 'Active', impressions: 7500, clicks: 240, ctr: 7.80, revenue: 4.85 },
]

const PERF_DATA = [
  { date: 'May 3', revenue: 18.72, impressions: 3200, clicks: 380, ctr: 11.8, cpc: 2.48 },
  { date: 'May 4', revenue: 22.45, impressions: 3800, clicks: 450, ctr: 11.8, cpc: 2.42 },
  { date: 'May 5', revenue: 19.80, impressions: 3500, clicks: 420, ctr: 12.0, cpc: 2.50 },
  { date: 'May 6', revenue: 26.68, impressions: 4200, clicks: 510, ctr: 12.1, cpc: 2.40 },
  { date: 'May 7', revenue: 24.30, impressions: 3900, clicks: 470, ctr: 12.0, cpc: 2.45 },
  { date: 'May 8', revenue: 21.15, impressions: 3600, clicks: 430, ctr: 11.9, cpc: 2.43 },
  { date: 'May 9', revenue: 28.90, impressions: 4500, clicks: 538, ctr: 12.0, cpc: 2.38 },
]

const TOP_ADS: TopAd[] = [
  { rank: 1, name: 'Summer Sale Video', type: 'Video', placement: 'Homepage', revenue: '₹26.68', clicks: 8, color: '#FF3B30' },
  { rank: 2, name: 'Gaming Banner', type: 'Banner', placement: 'Homepage', revenue: '₹15.42', clicks: 6, color: '#8B5CF6' },
  { rank: 3, name: 'Tech Promo Video', type: 'Video', placement: 'Sidebar', revenue: '₹9.80', clicks: 4, color: '#F59E0B' },
  { rank: 4, name: 'App Install Banner', type: 'Banner', placement: 'Footer', revenue: '₹7.25', clicks: 3, color: '#3B82F6' },
  { rank: 5, name: 'New Collection Video', type: 'Video', placement: 'Homepage', revenue: '₹5.60', clicks: 2, color: '#10B981' },
]

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function fmtNum(n: number): string {
  return n.toLocaleString('en-IN')
}

function fmtCur(n: number): string {
  return '₹' + n.toFixed(2)
}

/* ═══════════════════════════════════════════════════════════════
   SPARKLINE — pure line, no gradient fill
   ═══════════════════════════════════════════════════════════════ */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="flex-shrink-0" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHART TOOLTIP — dark bg, colored text
   ═══════════════════════════════════════════════════════════════ */
function ChartTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
  metric: PerfMetric
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const color = payload[0].color
  let formatted = ''
  switch (metric) {
    case 'revenue':
      formatted = `₹${val.toFixed(2)}`
      break
    case 'impressions':
      formatted = fmtNum(val)
      break
    case 'clicks':
      formatted = fmtNum(val)
      break
    case 'ctr':
      formatted = `${val.toFixed(1)}%`
      break
    case 'cpc':
      formatted = `₹${val.toFixed(2)}`
      break
  }
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{ background: '#000', border: '1px solid #2A2A2A' }}
    >
      <p className="text-[#6B7280] mb-1">{label}</p>
      <p style={{ color }} className="font-semibold">
        {formatted}
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FLAT CARD WRAPPER
   ═══════════════════════════════════════════════════════════════ */
function Card({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl bg-[#1F1F1F] border border-[#2A2A2A] ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CREATE NEW AD MODAL
   ═══════════════════════════════════════════════════════════════ */
function CreateAdModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [adName, setAdName] = useState('')
  const [adType, setAdType] = useState('Video')
  const [adPlacement, setAdPlacement] = useState('Homepage')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{ background: '#1F1F1F', border: '1px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Create New Ad</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/5"
            style={{ color: '#9CA3AF' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 text-[#6B7280]">
              Ad Name
            </label>
            <input
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF3B30]/40"
              placeholder="Enter ad name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 text-[#6B7280]">
                Type
              </label>
              <select
                value={adType}
                onChange={(e) => setAdType(e.target.value)}
                className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF3B30]/40"
              >
                <option>Video</option>
                <option>Banner</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 text-[#6B7280]">
                Placement
              </label>
              <select
                value={adPlacement}
                onChange={(e) => setAdPlacement(e.target.value)}
                className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF3B30]/40"
              >
                <option>Homepage</option>
                <option>Sidebar</option>
                <option>Footer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 text-[#6B7280]">
              Ad File
            </label>
            <div className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-[#FF3B30]/40 transition-colors">
              <CloudUpload className="h-6 w-6 text-[#FF3B30]" />
              <p className="text-xs text-[#9CA3AF]">Click to upload</p>
              <p className="text-[10px] text-[#6B7280]">
                MP4, MOV, JPG, PNG (max 10MB)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-medium text-[#9CA3AF] border border-[#2A2A2A] hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-[#FF3B30] px-5 py-2.5 text-xs font-semibold text-white hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Ad
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════════ */
function KpiCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  iconColor,
  iconBg,
  spark,
}: {
  label: string
  value: string
  change: string
  positive: boolean
  icon: LucideIcon
  iconColor: string
  iconBg: string
  spark: number[]
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
      </div>
      <p className="text-[10px] text-[#9CA3AF] mb-0.5">{label}</p>
      <p className="text-xl font-bold text-white leading-tight">{value}</p>
      <div className="flex items-center gap-1 mt-2">
        {positive ? (
          <ArrowUpRight className="h-3 w-3 text-[#10B981]" />
        ) : (
          <ArrowDownRight className="h-3 w-3 text-[#FF3B30]" />
        )}
        <span
          className="text-[10px] font-medium"
          style={{ color: positive ? '#10B981' : '#FF3B30' }}
        >
          {change} vs last 7 days
        </span>
      </div>
      <div className="mt-2">
        <Sparkline data={spark} color={iconColor} />
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AdsManagerUI() {
  const [search, setSearch] = useState('')
  const [perfMetric, setPerfMetric] = useState<PerfMetric>('revenue')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [showCreateModal, setShowCreateModal] = useState(false)

  /* ── KPI data ── */
  const kpis = [
    {
      label: 'Total Revenue',
      value: '₹26.68',
      change: '+12.5%',
      positive: true,
      icon: DollarSign,
      iconColor: '#FF3B30',
      iconBg: 'rgba(255,59,48,0.12)',
      spark: [18, 22, 20, 28, 24, 30, 28],
    },
    {
      label: 'Impressions',
      value: '24,500',
      change: '+8.3%',
      positive: true,
      icon: Eye,
      iconColor: '#8B5CF6',
      iconBg: 'rgba(139,92,246,0.12)',
      spark: [30, 35, 32, 40, 38, 42, 45],
    },
    {
      label: 'Clicks',
      value: '735',
      change: '+14.3%',
      positive: true,
      icon: MousePointerClick,
      iconColor: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.12)',
      spark: [12, 15, 14, 18, 16, 20, 22],
    },
    {
      label: 'CTR',
      value: '11.94%',
      change: '+6.7%',
      positive: true,
      icon: Target,
      iconColor: '#EC4899',
      iconBg: 'rgba(236,72,153,0.12)',
      spark: [5, 6, 5.5, 7, 6.5, 7.5, 7],
    },
    {
      label: 'Avg. CPC',
      value: '₹2.45',
      change: '-4.2%',
      positive: false,
      icon: DollarSign,
      iconColor: '#FBBF24',
      iconBg: 'rgba(251,191,36,0.12)',
      spark: [2.6, 2.5, 2.55, 2.4, 2.48, 2.42, 2.38],
    },
  ]

  /* ── Budget data ── */
  const budget = 10000
  const spent = 7500
  const budgetPct = (spent / budget) * 100

  /* ── Metric tab config ── */
  const metricConfig: Record<
    PerfMetric,
    { color: string; yDomain: [number, number]; label: string }
  > = {
    revenue: { color: '#FF3B30', yDomain: [0, 30], label: 'revenue' },
    impressions: { color: '#8B5CF6', yDomain: [0, 5000], label: 'impressions' },
    clicks: { color: '#F59E0B', yDomain: [0, 600], label: 'clicks' },
    ctr: { color: '#EC4899', yDomain: [10, 13], label: 'ctr' },
    cpc: { color: '#FBBF24', yDomain: [2.2, 2.6], label: 'cpc' },
  }

  const activeMetric = metricConfig[perfMetric]

  /* ── Filter & paginate ads table ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_ADS
    const q = search.toLowerCase()
    return MOCK_ADS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.placement.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    )
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  /* ── Pagination reset on search ── */
  function handleSearch(val: string) {
    setSearch(val)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-5 min-w-0">
      {/* ═══════════════════════════════════════════════════════
          ROW 1: HEADER
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#FF3B30]">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              AdManager
            </h1>
            <p className="text-xs text-gray-400">
              Track, manage and optimize your ad campaigns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button className="flex items-center gap-2 rounded-xl border border-[#2A2A2A] px-3.5 py-2 text-xs font-medium text-[#9CA3AF] hover:bg-white/5 transition-colors">
            <Calendar className="h-3.5 w-3.5" />
            May 3, 2026 - May 9, 2026
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#FF3B30] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> Create New Ad
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          ROW 2: KPI CARDS
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          ROW 3: MAIN CONTENT GRID (2/3 + 1/3)
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── LEFT COLUMN: Performance Overview ── */}
        <Card className="lg:col-span-2 p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                Performance Overview
              </h3>
              <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-bold bg-[#FF3B30]/15 text-[#FF3B30]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
                Live
              </span>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-[10px] font-medium text-[#9CA3AF] hover:bg-white/5 transition-colors">
              7 Days
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Metric Tabs */}
          <div className="flex items-center gap-1 px-5 pb-3">
            {(['revenue', 'impressions', 'clicks', 'ctr', 'cpc'] as const).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setPerfMetric(m)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all"
                  style={{
                    background:
                      perfMetric === m
                        ? `${metricConfig[m].color}18`
                        : 'transparent',
                    color:
                      perfMetric === m ? metricConfig[m].color : '#6B7280',
                    border: `1px solid ${
                      perfMetric === m
                        ? `${metricConfig[m].color}30`
                        : 'transparent'
                    }`,
                  }}
                >
                  {m}
                </button>
              )
            )}
          </div>

          {/* Chart */}
          <div className="px-3 pb-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={PERF_DATA}
                margin={{ top: 5, right: 10, left: -5, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="perfGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={activeMetric.color}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor={activeMetric.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2A2A2A"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={activeMetric.yDomain}
                  tickFormatter={(v: number) =>
                    perfMetric === 'revenue' || perfMetric === 'cpc'
                      ? `₹${v}`
                      : perfMetric === 'ctr'
                        ? `${v}%`
                        : fmtNum(v)
                  }
                />
                <Tooltip
                  content={
                    <ChartTooltip metric={perfMetric} />
                  }
                />
                <Area
                  type="monotone"
                  dataKey={perfMetric}
                  stroke={activeMetric.color}
                  fill="url(#perfGradient)"
                  strokeWidth={2}
                  name={activeMetric.label}
                  dot={{
                    fill: activeMetric.color,
                    r: 3,
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 5,
                    fill: activeMetric.color,
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">
          {/* Card: Top Performing Ads */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Top Performing Ads
              </h3>
              <button className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {TOP_ADS.map((ad) => (
                <div
                  key={ad.rank}
                  className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.03] transition-colors"
                >
                  <span
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background:
                        ad.rank === 1
                          ? 'rgba(251,191,36,0.15)'
                          : 'rgba(255,255,255,0.05)',
                      color: ad.rank === 1 ? '#FBBF24' : '#6B7280',
                    }}
                  >
                    #{ad.rank}
                  </span>
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ad.color}15` }}
                  >
                    {ad.type === 'Video' ? (
                      <Eye className="h-3.5 w-3.5" style={{ color: ad.color }} />
                    ) : (
                      <Layout
                        className="h-3.5 w-3.5"
                        style={{ color: ad.color }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {ad.name}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      {ad.type} &bull; {ad.placement}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-[#FF3B30]">
                      {ad.revenue}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">{ad.clicks} clicks</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card: Campaign Budget */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-white mb-4">
              Campaign Budget
            </h3>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: spent, name: 'Spent' },
                        { value: budget - spent, name: 'Remaining' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                    >
                      <Cell fill="#FF3B30" />
                      <Cell fill="#2A2A2A" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-white">
                    {Math.round(budgetPct)}%
                  </span>
                  <span className="text-[9px] text-[#6B7280]">
                    of ₹{budget.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280]">Spent</span>
                <span className="text-xs font-bold text-[#FF3B30]">
                  ₹{spent.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280]">Remaining</span>
                <span className="text-xs font-bold text-white">
                  ₹{(budget - spent).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[#2A2A2A]">
                <div
                  className="h-full rounded-full bg-[#FF3B30] transition-all duration-700"
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Card: Quick Actions */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: 'Create New Ad',
                  icon: Plus,
                  color: '#FF3B30',
                  bg: 'rgba(255,59,48,0.1)',
                },
                {
                  label: 'Duplicate Ad',
                  icon: Copy,
                  color: '#8B5CF6',
                  bg: 'rgba(139,92,246,0.1)',
                },
                {
                  label: 'Edit Ad',
                  icon: Edit3,
                  color: '#F59E0B',
                  bg: 'rgba(245,158,11,0.1)',
                },
                {
                  label: 'View Reports',
                  icon: FileText,
                  color: '#3B82F6',
                  bg: 'rgba(59,130,246,0.1)',
                },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-[#2A2A2A] p-3 text-center hover:bg-white/[0.03] transition-colors"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: action.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: action.color }} />
                    </div>
                    <p className="text-[10px] font-medium text-white">
                      {action.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Card: Recommendations */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Recommendations
              </h3>
              <button className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors">
                View All
              </button>
            </div>
            <div
              className="flex items-start gap-3 rounded-xl p-3"
              style={{
                background: 'rgba(255,59,48,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,59,48,0.15)' }}
              >
                <Rocket className="h-4 w-4 text-[#FF3B30]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white">
                  Increase budget for top ads
                </p>
                <p className="text-[10px] mt-0.5 text-[#6B7280]">
                  Top performing ads are getting more engagement. Consider
                  allocating more budget.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          ROW 4: ALL ADS TABLE
          ═══════════════════════════════════════════════════════ */}
      <Card className="p-0 overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">All Ads</h3>
            <span className="rounded-md bg-[#FF3B30]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF3B30]">
              {MOCK_ADS.length} Total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-[10px] font-medium text-[#9CA3AF] hover:bg-white/5 transition-colors">
              Columns <ChevronDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-[10px] font-medium text-[#9CA3AF] hover:bg-white/5 transition-colors">
              Export <Download className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-[#2A2A2A] px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search ads..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-28 bg-transparent text-[10px] text-white placeholder:text-[#4B5563] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#1A1A1A]">
                {[
                  'AD INFO',
                  'TYPE/SLOT',
                  'STATUS',
                  'IMPRESSIONS',
                  'CLICKS',
                  'CTR',
                  'REVENUE',
                  'ACTIONS',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-[#6B7280]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((ad) => (
                <tr
                  key={ad.id}
                  className="border-t border-[#2A2A2A] hover:bg-white/[0.015] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-9 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            ad.type === 'Video'
                              ? 'rgba(255,59,48,0.1)'
                              : 'rgba(59,130,246,0.1)',
                        }}
                      >
                        {ad.type === 'Video' ? (
                          <Eye
                            className="h-3.5 w-3.5"
                            style={{
                              color:
                                ad.type === 'Video' ? '#FF3B30' : '#3B82F6',
                            }}
                          />
                        ) : (
                          <Layout
                            className="h-3.5 w-3.5"
                            style={{ color: '#3B82F6' }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">
                          {ad.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background:
                          ad.type === 'Video'
                            ? 'rgba(255,59,48,0.1)'
                            : 'rgba(59,130,246,0.1)',
                        color: ad.type === 'Video' ? '#FF3B30' : '#3B82F6',
                      }}
                    >
                      {ad.type}
                    </span>
                    <p className="text-[9px] mt-1 text-[#6B7280]">
                      {ad.placement}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background:
                          ad.status === 'Active'
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(245,158,11,0.12)',
                        color:
                          ad.status === 'Active' ? '#10B981' : '#F59E0B',
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-current"
                        style={
                          ad.status === 'Active'
                            ? { animation: 'pulse 2s infinite' }
                            : undefined
                        }
                      />
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-white">
                    {fmtNum(ad.impressions)}
                  </td>
                  <td className="px-5 py-3 font-medium text-white">
                    {fmtNum(ad.clicks)}
                  </td>
                  <td className="px-5 py-3 font-semibold text-[#10B981]">
                    {ad.ctr.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 font-bold text-[#FF3B30]">
                    {fmtCur(ad.revenue)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-[#9CA3AF] transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-[#9CA3AF] transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-[#9CA3AF] transition-colors"
                        title="More"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-[#2A2A2A]">
          <p className="text-[10px] text-[#6B7280]">
            Showing {(currentPage - 1) * perPage + 1} to{' '}
            {Math.min(currentPage * perPage, filtered.length)} of{' '}
            {filtered.length} results
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 disabled:opacity-30 text-[#9CA3AF] border border-[#2A2A2A] transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all"
                style={{
                  background:
                    currentPage === page ? '#FF3B30' : 'transparent',
                  color: currentPage === page ? '#fff' : '#6B7280',
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 disabled:opacity-30 text-[#9CA3AF] border border-[#2A2A2A] transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="ml-2 rounded-lg border border-[#2A2A2A] bg-[#1F1F1F] px-2 py-1 text-[10px] text-white focus:outline-none"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          CREATE AD MODAL
          ═══════════════════════════════════════════════════════ */}
      <CreateAdModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
