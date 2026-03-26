<template>
  <div class="layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>位置展示系统</span>
      </div>

      <nav class="menu">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="menu-item"
          :class="{ active: activeMenu === index }"
          @click="activeMenu = index"
        >
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="item.icon"></svg>
          <span>{{ item.label }}</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main">
      <!-- 顶部工具栏已移除 -->

      <!-- 地图区域（软件控制页不显示地图） -->
      <!-- 内容查询页 -->
      <section v-if="activeMenu === 1" class="file-query-page">
        <div class="file-query-bar">
          <input type="datetime-local" v-model="fileQueryStartTime" class="datetime-input" step="1" />
          <span class="datetime-arrow">→</span>
          <input type="datetime-local" v-model="fileQueryEndTime" class="datetime-input" step="1" />
          <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyUl" /> 仅上行</label>
          <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyImei" /> 仅IMEI</label>
          <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyLocation" /> 仅拥有定位结果</label>
          <button class="query-btn" @click="handleFileQuery">查 询</button>
          <button class="reset-btn" @click="handleFileQueryReset">重 置</button>
        </div>
        <div v-if="loading" class="loading-overlay static-loading">
          <div class="loading-spinner"></div>
          <span class="loading-text">数据加载中...</span>
        </div>
        <div class="file-query-table-wrapper">
          <table class="device-table">
            <thead>
              <tr>
                <th v-for="col in fileQueryColumns" :key="col.key" class="filterable-th">
                  <span>{{ col.label }}</span>
                  <button
                    class="filter-icon-btn"
                    :class="{ 'filter-active': fileQueryFilters[col.key].size > 0 }"
                    @click.stop="toggleFilterDropdown(col.key)"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                  </button>
                  <!-- 筛选下拉面板 -->
                  <div v-if="activeFilterCol === col.key" class="filter-dropdown" @click.stop>
                    <input type="text" class="filter-search" v-model="filterSearchText" placeholder="搜索..." />
                    <div class="filter-actions">
                      <button @click="filterSelectAll(col.key)">全选</button>
                      <button @click="filterClearAll(col.key)">清除</button>
                    </div>
                    <div class="filter-options">
                      <label
                        v-for="val in getFilteredOptions(col.key)"
                        :key="val"
                        class="filter-option"
                      >
                        <input type="checkbox" :checked="fileQueryFilters[col.key].has(val)" @change="toggleFilterValue(col.key, val)" />
                        <span>{{ val || '(空)' }}</span>
                      </label>
                      <div v-if="getFilteredOptions(col.key).length === 0" class="filter-empty">无匹配项</div>
                    </div>
                    <div class="filter-footer">
                      <button class="filter-confirm" @click="activeFilterCol = null">确定</button>
                    </div>
                  </div>
                </th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in fileQueryPagedData" :key="i">
                <td v-for="col in fileQueryColumns" :key="col.key" :class="{ 'payload-cell': col.key === 'payload' }">{{ row[col.key] }}</td>
                <td><button class="detail-btn" @click="showLCWDetail(row)">详情</button></td>
              </tr>
              <tr v-if="fileQueryFilteredData.length === 0">
                <td :colspan="fileQueryColumns.length + 1" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 分页 -->
        <div v-if="fileQueryFilteredData.length > 0" class="pagination">
          <span class="page-info">共 {{ fileQueryFilteredData.length }} 条，第 {{ fileQueryPage }}/{{ fileQueryTotalPages }} 页</span>
          <div class="page-btns">
            <button class="page-btn" :disabled="fileQueryPage <= 1" @click="fileQueryPage = 1">首页</button>
            <button class="page-btn" :disabled="fileQueryPage <= 1" @click="fileQueryPage--">&lt;</button>
            <template v-for="p in fileQueryVisiblePages" :key="p">
              <button class="page-btn" :class="{ 'page-active': p === fileQueryPage }" @click="fileQueryPage = p">{{ p }}</button>
            </template>
            <button class="page-btn" :disabled="fileQueryPage >= fileQueryTotalPages" @click="fileQueryPage++">&gt;</button>
            <button class="page-btn" :disabled="fileQueryPage >= fileQueryTotalPages" @click="fileQueryPage = fileQueryTotalPages">末页</button>
          </div>
        </div>
      </section>

      <section v-show="activeMenu === 0 || activeMenu === 2" class="map-container">
        <div id="map" ref="mapRef"></div>
        <!-- 实时位置 - 地图右上角控件 -->
        <div v-if="activeMenu === 0" class="map-controls">
          <select v-model="queryMode" class="map-select">
            <option value="realtime">实时模式</option>
            <option value="highprecision">高精度模式</option>
          </select>
          <select v-model="timeRange" class="map-select">
            <option value="1hour">1hour</option>
            <option value="2hour">2hour</option>
            <option value="6hour">6hour</option>
            <option value="12hour">12hour</option>
            <option value="24hour">24hour</option>
          </select>
          <button class="query-btn" @click="handleRealtimeQuery">查 询</button>
          <span class="countdown-badge">{{ countdown }}s</span>
          <button class="export-btn" @click="handleExport">导 出</button>
        </div>
        <!-- 加载遮罩 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <span class="loading-text">数据加载中...</span>
        </div>
        <!-- 位置展示 - 地图顶部查询栏 -->
        <div v-if="activeMenu === 2" class="map-controls-bar">
          <select v-model="searchQueryMode" class="map-select">
            <option value="realtime">实时模式</option>
            <option value="highprecision">高精度模式</option>
          </select>
          <input type="datetime-local" v-model="searchStartTime" class="datetime-input" step="1" />
          <span class="datetime-arrow">→</span>
          <input type="datetime-local" v-model="searchEndTime" class="datetime-input" step="1" />
          <input type="text" v-model="searchTerminalId" class="terminal-input" placeholder="请输入终端ID" />
          <button class="query-btn" @click="handleSearch">查询</button>
          <button class="export-btn" @click="handleExport">导出</button>
        </div>
      </section>

      <!-- 软件控制 - 设备信息页 -->
      <section v-if="activeMenu === 3" class="device-page">
        <div class="device-table-wrapper">
          <table class="device-table">
            <thead>
              <tr>
                <th>设备名称</th>
                <th>更新时间</th>
                <th>已工作时间</th>
                <th>磁盘已用/总量(GB)</th>
                <th>磁盘剩余(GB)</th>
                <th>CPU使用率(%)</th>
                <th>自组网</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(dev, i) in deviceList" :key="i">
                <td><span class="status-light" :class="dev.isOnline ? 'online' : 'offline'"></span>{{ dev.name }}</td>
                <td>{{ dev.lastWorkedTime }}</td>
                <td>{{ dev.workedTime }}</td>
                <td>{{ dev.diskUsedGB }} / {{ dev.diskTotalGB }}</td>
                <td>{{ dev.diskAvailGB }}</td>
                <td :class="{ 'cpu-high': dev.cpuUsagePercent > 80 }">{{ dev.cpuUsagePercent }}</td>
                <td><button class="mesh-btn" @click="openMeshPage(dev.ip)">前往自组网</button></td>
              </tr>
              <tr v-if="deviceList.length === 0">
                <td colspan="7" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 底部通信事件表格（仅实时位置页显示） -->
      <section v-if="activeMenu === 0" class="table-panel">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>设备号</th>
                <th>数据数量</th>
                <th>通信起始时间</th>
                <th>通信截止时间</th>
                <th>通信时长(秒)</th>
                <th>IMEI</th>
                <th>通联类型</th>
                <th>定位经纬度</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in commTableData" :key="i">
                <td>{{ row.deviceNumber }}</td>
                <td>{{ row.dataCount }}</td>
                <td>{{ row.startTime }}</td>
                <td>{{ row.endTime }}</td>
                <td>{{ row.duration }}</td>
                <td>{{ row.imei }}</td>
                <td>{{ row.commType }}</td>
                <td>{{ row.locationLatLon }}</td>
                <td><button class="detail-btn" @click="showLCWDetail(row)">详情</button></td>
              </tr>
              <tr v-if="commTableData.length === 0">
                <td colspan="9" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- 轨迹弹窗 -->
    <div v-if="showTrajectoryModal" class="trajectory-modal-overlay" @click.self="closeTrajectoryModal">
      <div class="trajectory-modal">
        <div class="trajectory-modal-header">
          <span>终端轨迹 - {{ trajectoryTerminalId }}　　{{ trajectoryTimeRange }}</span>
          <button class="trajectory-modal-close" @click="closeTrajectoryModal">&times;</button>
        </div>
        <div class="trajectory-modal-body">
          <div id="trajectoryMap" style="width:100%;height:100%;"></div>
        </div>
      </div>
    </div>

    <!-- LCW详情弹窗 -->
    <div v-if="showLCWModal" class="trajectory-modal-overlay" @click.self="showLCWModal = false">
      <div class="trajectory-modal" style="width:70vw;height:60vh;">
        <div class="trajectory-modal-header">
          <span>LCW 详情</span>
          <button class="trajectory-modal-close" @click="showLCWModal = false">&times;</button>
        </div>
        <div class="trajectory-modal-body" style="overflow:auto;">
          <div v-if="lcwLoading" class="loading-overlay" style="position:relative;height:100%;display:flex;align-items:center;justify-content:center;">
            <div class="loading-spinner"></div>
            <span class="loading-text">加载中...</span>
          </div>
          <table v-else class="device-table" style="width:100%;">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>方向</th>
                <th>频率</th>
                <th>IMEI</th>
                <th>TMSI</th>
                <th>信道</th>
                <th>载荷</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in lcwDetailData" :key="i">
                <td>{{ row.time }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.isUl }}</td>
                <td>{{ row.frequency }}</td>
                <td>{{ row.imei }}</td>
                <td>{{ row.tmsi }}</td>
                <td>{{ row.chn }}</td>
                <td>{{ row.payload }}</td>
              </tr>
              <tr v-if="lcwDetailData.length === 0 && !lcwLoading">
                <td colspan="8" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 侧栏菜单
const activeMenu = ref(0)
const sidebarCollapsed = ref(false)

const menuItems = [
  { label: '实时位置', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>' },
  { label: '内容查询', icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>' },
  { label: '位置展示', icon: '<circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 00-8-8z"/>' },
  { label: '软件控制', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>' },
]

// 地图控件状态 - 实时位置
const queryMode = ref('realtime')
const timeRange = ref('2hour')
const refreshInterval = ref('10min')

// 位置展示查询参数
const searchQueryMode = ref('realtime')
const searchStartTime = ref('')
const searchEndTime = ref('')
const searchTerminalId = ref('')

// LCW详情弹窗
const showLCWModal = ref(false)
const lcwDetailData = ref([])
const lcwLoading = ref(false)

// 轨迹弹窗
const showTrajectoryModal = ref(false)
const trajectoryTerminalId = ref('')
const trajectoryTimeRange = ref('')
let trajectoryMap = null

// 内容查询参数
const fileQueryStartTime = ref('')
const fileQueryEndTime = ref('')
const fileQueryOnlyUl = ref(true)
const fileQueryOnlyImei = ref(true)
const fileQueryOnlyLocation = ref(true)
const fileQueryTableData = ref([])
const fileQueryPage = ref(1)
const fileQueryPageSize = 50

const fileQueryColumns = [
  { key: 'deviceNumber', label: '设备编号' },
  { key: 'dataCount', label: '数据数量' },
  { key: 'startTime', label: '通信起始时间' },
  { key: 'endTime', label: '通信截止时间' },
  { key: 'duration', label: '通信时间(秒)' },
  { key: 'imei', label: 'IMEI' },
  { key: 'commType', label: '通联类型' },
  { key: 'locationLatLon', label: '定位经纬度' }
]

// 筛选状态：每列一个 Set，空 Set 表示不筛选
const fileQueryFilters = reactive(
  Object.fromEntries(fileQueryColumns.map(c => [c.key, new Set()]))
)
const activeFilterCol = ref(null)
const filterSearchText = ref('')

// 获取某列所有唯一值
function getColumnUniqueValues(key) {
  const vals = new Set()
  fileQueryTableData.value.forEach(row => vals.add(String(row[key] || '')))
  return [...vals].sort()
}

// 获取筛选搜索后的选项
function getFilteredOptions(key) {
  const all = getColumnUniqueValues(key)
  if (!filterSearchText.value) return all
  const kw = filterSearchText.value.toLowerCase()
  return all.filter(v => v.toLowerCase().includes(kw))
}

function toggleFilterDropdown(key) {
  if (activeFilterCol.value === key) {
    activeFilterCol.value = null
  } else {
    activeFilterCol.value = key
    filterSearchText.value = ''
  }
}

function toggleFilterValue(key, val) {
  const s = fileQueryFilters[key]
  if (s.has(val)) s.delete(val)
  else s.add(val)
  fileQueryPage.value = 1
}

function filterSelectAll(key) {
  const all = getFilteredOptions(key)
  const s = fileQueryFilters[key]
  all.forEach(v => s.add(v))
  fileQueryPage.value = 1
}

function filterClearAll(key) {
  fileQueryFilters[key].clear()
  fileQueryPage.value = 1
}

// 点击其他地方关闭筛选面板
function closeFilterDropdown() {
  activeFilterCol.value = null
}

const fileQueryFilteredData = computed(() => {
  return fileQueryTableData.value.filter(row => {
    return fileQueryColumns.every(col => {
      const selected = fileQueryFilters[col.key]
      if (selected.size === 0) return true
      return selected.has(String(row[col.key] || ''))
    })
  })
})

const fileQueryTotalPages = computed(() =>
  Math.max(1, Math.ceil(fileQueryFilteredData.value.length / fileQueryPageSize))
)

const fileQueryPagedData = computed(() => {
  const start = (fileQueryPage.value - 1) * fileQueryPageSize
  return fileQueryFilteredData.value.slice(start, start + fileQueryPageSize)
})

const fileQueryVisiblePages = computed(() => {
  const total = fileQueryTotalPages.value
  const current = fileQueryPage.value
  const pages = []
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, start + 4)
    else start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// 表格数据
const tableData = ref([])
const commTableData = ref([])

// 软件控制 - 设备列表（固定三台）
const deviceList = ref([
  { name: 'Device1', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
  { name: 'Device2', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
  { name: 'Device3', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
])
let deviceRefreshTimer = null

// 加载状态
const loading = ref(false)

// 倒计时
const countdown = ref(60)
let countdownTimer = null

// 初始化位置展示的默认时间
function initSearchTime() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
  searchEndTime.value = formatDateTimeLocal(now)
  searchStartTime.value = formatDateTimeLocal(oneHourAgo)
}

function formatDateTimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const mapRef = ref(null)
let map = null
let markers = [] // 存储地图上的标记
let refreshTimer = null

// 时间范围映射（小时数）
const timeRangeHours = {
  '1hour': 1, '2hour': 2, '6hour': 6, '12hour': 12, '24hour': 24
}

// 刷新间隔映射（毫秒）
const refreshIntervalMs = {
  '5min': 5 * 60 * 1000,
  '10min': 10 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '60min': 60 * 60 * 1000
}

// 格式化日期为 API 需要的格式
function formatDateTime(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 格式化日期用于表格显示
// 格式化 .NET TimeSpan 字符串
// "739699.14:51:03.8393552" → "739699天 14:51:03"
// "00:00:12.1426503"        → "00:00:12"
function formatWorkedTime(val) {
  if (!val) return ''
  // 判断是否有天数前缀：形如 "数字.数字:数字:数字"
  const withDays = /^(\d+)\.(\d+):(\d+):(\d+)/.exec(val)
  if (withDays) {
    const [, d, hh, mm, ss] = withDays
    return `${d}天 ${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}`
  }
  // 不含天数：形如 "HH:mm:ss.fff"
  const nodays = /^(\d+):(\d+):(\d+)/.exec(val)
  if (nodays) {
    const [, hh, mm, ss] = nodays
    return `${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}`
  }
  return val
}

// 字节转 GB，保留两位小数
function bytesToGB(bytes) {
  if (!bytes && bytes !== 0) return '0.00'
  return (bytes / (1024 ** 3)).toFixed(2)
}

function formatDisplay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 计算通信时长
function calcDuration(start, end) {
  if (!start || !end) return ''
  const ms = new Date(end) - new Date(start)
  if (ms < 0) return ''
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h${m}m${s}s`
  if (m > 0) return `${m}m${s}s`
  return `${s}s`
}

// 解析 .NET TimeSpan 字符串为秒数（保留2位小数）
function parseDurationToSeconds(dur) {
  if (dur === null || dur === undefined || dur === '') return ''
  // If already a number, just format it
  if (typeof dur === 'number') return dur.toFixed(2)
  // If string that looks like a number (no colons)
  if (typeof dur === 'string' && !dur.includes(':')) return parseFloat(dur).toFixed(2)
  // 格式: "HH:MM:SS.xxx" 或 "D.HH:MM:SS.xxx"
  const parts = dur.split(':')
  if (parts.length < 3) return dur
  let h = 0, m = 0, s = 0
  if (parts.length === 3) {
    const dayHour = parts[0].split('.')
    if (dayHour.length === 2) {
      h = parseInt(dayHour[0]) * 24 + parseInt(dayHour[1])
    } else {
      h = parseInt(parts[0])
    }
    m = parseInt(parts[1])
    s = parseFloat(parts[2])
  }
  const totalSec = h * 3600 + m * 60 + s
  return totalSec.toFixed(2)
}

// 调用 API 获取坐标数据
async function fetchCoordinateData() {
  const now = new Date()
  const hours = timeRangeHours[timeRange.value] || 2
  const startTime = new Date(now.getTime() - hours * 3600 * 1000)

  const isRealtime = queryMode.value === 'realtime'

  const params = new URLSearchParams({
    StartTime: formatDateTime(startTime),
    EndTime: formatDateTime(now),
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: 'false',
    TargetImeiOrTmsi: ''
  })

  try {
    const resp = await fetch(`/api/Result/NewSearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data) {
      // 更新表格数据
      tableData.value = result.data.map(item => ({
        terminalId: item.terminalID || '',
        startTime: formatDisplay(item.startTime),
        endTime: formatDisplay(item.endTime),
        duration: calcDuration(item.startTime, item.endTime),
        longitude: item.longitude,
        latitude: item.latitude,
        altitude: item.altitude,
        lastDataTime: formatDisplay(item.lastDataTime)
      }))

      // 更新地图标记
      updateMapMarkers(result.data)
    }
  } catch (err) {
    console.error('获取坐标数据失败:', err)
  }
}

// 更新地图上的标记
// 判断是否为设备标记（device1/2/3，只有坐标没有时间）
function isDeviceMarker(item) {
  const id = (item.terminalID || '').toLowerCase()
  return id.startsWith('devive') || id.startsWith('device')
}

// 创建设备图钉图标
function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: 'pin-icon',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38]
  })
}

function updateMapMarkers(data) {
  // 清除旧标记
  markers.forEach(m => map.removeLayer(m))
  markers = []

  if (!data || data.length === 0) return

  data.forEach(item => {
    if (item.latitude && item.longitude && item.latitude !== 0 && item.longitude !== 0) {
      let marker

      if (isDeviceMarker(item)) {
        // 设备标记 - 用图钉图标，绿色
        marker = L.marker([item.latitude, item.longitude], {
          icon: createPinIcon('#52c41a')
        }).addTo(map)

        marker.bindPopup(
          `<b>${item.terminalID}</b><br>` +
          `经度: ${item.longitude.toFixed(6)}<br>` +
          `纬度: ${item.latitude.toFixed(6)}`
        )
      } else {
        // 普通标记 - 圆点
        const hasTerminal = !!item.terminalID
        marker = L.circleMarker([item.latitude, item.longitude], {
          radius: 7,
          fillColor: hasTerminal ? '#1890ff' : '#e74c3c',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map)

        const popupContent = document.createElement('div')
        popupContent.style.cssText = 'font-size:13px;line-height:1.8;min-width:180px;'
        popupContent.innerHTML =
          `<div style="font-weight:600;font-size:14px;color:#1e3a5f;border-bottom:1px solid #e8e8e8;padding-bottom:4px;margin-bottom:4px;">终端: ${item.terminalID || '无'}</div>` +
          `<div>经度: ${item.longitude.toFixed(6)}</div>` +
          `<div>纬度: ${item.latitude.toFixed(6)}</div>` +
          `<div>时间: ${formatDisplay(item.lastDataTime)}</div>`
        if (hasTerminal) {
          const btn = document.createElement('button')
          btn.textContent = '查询轨迹'
          btn.style.cssText = 'margin-top:8px;padding:4px 14px;background:#1890ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;width:100%;'
          btn.onmouseenter = () => btn.style.background = '#096dd9'
          btn.onmouseleave = () => btn.style.background = '#1890ff'
          btn.onclick = () => queryTrajectory(item.terminalID)
          popupContent.appendChild(btn)
        }
        marker.bindPopup(popupContent)
      }

      markers.push(marker)
    }
  })

  // 如果有数据，调整视野
  if (markers.length > 0) {
    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.2))
  }
}

// 查询LCW详情
async function showLCWDetail(row) {
  showLCWModal.value = true
  lcwDetailData.value = []
  lcwLoading.value = true

  // 使用查询时的时间范围，而非行数据的时间
  let startTime, endTime
  if (activeMenu.value === 0) {
    // 实时位置 - 当前时间减去时间范围
    const now = new Date()
    const hours = timeRangeHours[timeRange.value] || 2
    const start = new Date(now.getTime() - hours * 3600 * 1000)
    startTime = formatDateTime(start)
    endTime = formatDateTime(now)
  } else {
    // 内容查询 - 用户选择的时间
    startTime = fileQueryStartTime.value
    endTime = fileQueryEndTime.value
  }

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    ChainID: row.chainID || ''
  })

  try {
    const resp = await fetch(`/api/Result/SearchLCW?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    lcwDetailData.value = (result.data || []).map(item => ({
      time: formatDisplay(item.time),
      type: item.type,
      isUl: item.isUl ? '上行' : '下行',
      frequency: item.frequncy,
      imei: item.imei || '',
      tmsi: item.tmsi || '',
      chn: item.chn,
      payload: item.payload || ''
    }))
  } catch (err) {
    console.error('查询LCW详情失败:', err)
  } finally {
    lcwLoading.value = false
  }
}

// 查询轨迹
async function queryTrajectory(terminalId) {
  trajectoryTerminalId.value = terminalId
  showTrajectoryModal.value = true

  // 根据当前页面获取时间范围
  let startTime, endTime
  if (activeMenu.value === 0) {
    // 实时位置 - 用当前时间和时间范围
    const now = new Date()
    const hours = timeRangeHours[timeRange.value] || 2
    const start = new Date(now.getTime() - hours * 3600 * 1000)
    startTime = formatDateTime(start)
    endTime = formatDateTime(now)
  } else {
    // 位置展示 - 用用户选的时间
    startTime = searchStartTime.value
    endTime = searchEndTime.value
  }

  trajectoryTimeRange.value = `${startTime.replace('T', ' ')} 至 ${endTime.replace('T', ' ')}`

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    LocateByCoummounication: 'true',
    LocateByImeiOrTmsi: 'true',
    TargetImeiOrTmsi: terminalId
  })

  await nextTick()

  // 初始化轨迹地图
  if (trajectoryMap) {
    trajectoryMap.remove()
    trajectoryMap = null
  }
  trajectoryMap = L.map('trajectoryMap', {
    center: [30, 50],
    zoom: 3,
    zoomControl: true
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(trajectoryMap)

  try {
    const resp = await fetch(`/api/Result/NewSearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data && result.data.length > 0) {
      // 按时间排序
      const sorted = result.data
        .filter(item => item.latitude && item.longitude && item.latitude !== 0 && item.longitude !== 0)
        .sort((a, b) => new Date(a.lastDataTime || a.startTime) - new Date(b.lastDataTime || b.startTime))

      if (sorted.length === 0) return

      const latlngs = sorted.map(item => [item.latitude, item.longitude])

      // 画轨迹线（浅蓝色）
      L.polyline(latlngs, { color: '#91d5ff', weight: 3, opacity: 0.9 }).addTo(trajectoryMap)

      // 在每段线段中间画箭头（橙色 SVG）
      // 注意：屏幕Y轴向下，纬度向上，所以dlat取反
      for (let i = 0; i < latlngs.length - 1; i++) {
        const from = latlngs[i]
        const to = latlngs[i + 1]
        const midLat = (from[0] + to[0]) / 2
        const midLng = (from[1] + to[1]) / 2
        const dlat = to[0] - from[0]
        const dlng = to[1] - from[1]
        // 墨卡托投影：经度方向在屏幕上缩短cos(lat)倍
        const cosLat = Math.cos(midLat * Math.PI / 180)
        // 屏幕坐标：X=dlng*cosLat, Y=-dlat（Y轴向下）
        const angleDeg = Math.atan2(-dlat, dlng * cosLat) * 180 / Math.PI
        // SVG箭头初始朝右(0°)，关于中心点(14,7)对称
        const arrowSvg = `<svg width="28" height="14" viewBox="0 0 28 14" style="transform:rotate(${angleDeg}deg)"><polygon points="4,2 24,7 4,12" fill="#fa8c16" stroke="#e8740e" stroke-width="0.5"/></svg>`
        const arrowIcon = L.divIcon({
          html: arrowSvg,
          className: 'arrow-icon',
          iconSize: [28, 14],
          iconAnchor: [14, 7]
        })
        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(trajectoryMap)
      }

      // 起点标记（绿色）
      L.circleMarker(latlngs[0], {
        radius: 9, fillColor: '#52c41a', color: '#fff', weight: 2, fillOpacity: 1
      }).addTo(trajectoryMap).bindPopup(`<b>起点</b><br>时间: ${formatDisplay(sorted[0].lastDataTime || sorted[0].startTime)}<br>经度: ${sorted[0].longitude.toFixed(6)}<br>纬度: ${sorted[0].latitude.toFixed(6)}`)

      // 终点标记（红色）
      const last = sorted[sorted.length - 1]
      L.circleMarker(latlngs[latlngs.length - 1], {
        radius: 9, fillColor: '#e74c3c', color: '#fff', weight: 2, fillOpacity: 1
      }).addTo(trajectoryMap).bindPopup(`<b>终点</b><br>时间: ${formatDisplay(last.lastDataTime || last.startTime)}<br>经度: ${last.longitude.toFixed(6)}<br>纬度: ${last.latitude.toFixed(6)}`)

      // 中间点（深蓝色）
      for (let i = 1; i < sorted.length - 1; i++) {
        L.circleMarker(latlngs[i], {
          radius: 5, fillColor: '#1e3a5f', color: '#fff', weight: 1.5, fillOpacity: 0.9
        }).addTo(trajectoryMap).bindPopup(`<b>第${i + 1}点</b><br>时间: ${formatDisplay(sorted[i].lastDataTime || sorted[i].startTime)}<br>经度: ${sorted[i].longitude.toFixed(6)}<br>纬度: ${sorted[i].latitude.toFixed(6)}`)
      }

      // 调整视野
      trajectoryMap.fitBounds(L.latLngBounds(latlngs).pad(0.2))
    }
  } catch (err) {
    console.error('查询轨迹失败:', err)
  }

  // 修正地图尺寸
  setTimeout(() => { if (trajectoryMap) trajectoryMap.invalidateSize() }, 200)
}

function closeTrajectoryModal() {
  showTrajectoryModal.value = false
  if (trajectoryMap) {
    trajectoryMap.remove()
    trajectoryMap = null
  }
}

// 实时位置 - 立即查询
async function handleRealtimeQuery() {
  loading.value = true
  try {
    await Promise.all([fetchCoordinateData(), fetchCommEvents()])
  } finally {
    loading.value = false
  }
  resetCountdown()
}

// 设置自动刷新定时器（1分钟）
function setupRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)

  countdown.value = 60

  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      handleRealtimeQuery()
    }
  }, 1000)
}

function resetCountdown() {
  countdown.value = 60
}

// 监听控件变化，重新查询
watch([queryMode, timeRange], () => {
  if (activeMenu.value === 0) {
    handleRealtimeQuery()
  }
})

// 切换菜单时，清空数据并切换逻辑
watch(activeMenu, (val) => {
  tableData.value = []
  if (map) {
    markers.forEach(m => map.removeLayer(m))
    markers = []
  }

  // 清除所有定时器
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  if (deviceRefreshTimer) { clearInterval(deviceRefreshTimer); deviceRefreshTimer = null }

  if (val === 0) {
    nextTick(() => { if (map) map.invalidateSize() })
    handleRealtimeQuery()
    setupRefreshTimer()
  } else if (val === 1) {
    initFileQueryTime()
  } else if (val === 2) {
    nextTick(() => { if (map) map.invalidateSize() })
    initSearchTime()
  } else if (val === 3) {
    fetchDeviceInfo()
    deviceRefreshTimer = setInterval(fetchDeviceInfo, 120000)
  }
})

onMounted(async () => {
  await nextTick()
  // 初始化 Leaflet 地图
  map = L.map('map', {
    center: [30, 50],
    zoom: 3,
    zoomControl: false
  })

  // 左上角缩放控件
  L.control.zoom({ position: 'topleft' }).addTo(map)

  // OpenStreetMap 在线瓦片
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  document.addEventListener('click', closeFilterDropdown)

  // 首次加载数据
  handleRealtimeQuery()
  setupRefreshTimer()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (deviceRefreshTimer) clearInterval(deviceRefreshTimer)
  document.removeEventListener('click', closeFilterDropdown)
})

// 位置展示 - 查询（使用 NewSearchCoordinate 接口）
async function handleSearch() {
  if (!searchStartTime.value || !searchEndTime.value) return

  loading.value = true
  const isRealtime = searchQueryMode.value === 'realtime'
  const params = new URLSearchParams({
    StartTime: searchStartTime.value,
    EndTime: searchEndTime.value,
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: 'false',
    TargetImeiOrTmsi: ''
  })

  try {
    const resp = await fetch(`/api/Result/NewSearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data) {
      tableData.value = result.data.map(item => ({
        terminalId: item.terminalID || '',
        startTime: formatDisplay(item.startTime),
        endTime: formatDisplay(item.endTime),
        duration: calcDuration(item.startTime, item.endTime),
        longitude: item.longitude,
        latitude: item.latitude,
        altitude: item.altitude,
        lastDataTime: formatDisplay(item.lastDataTime)
      }))
      updateMapMarkers(result.data)
    }
  } catch (err) {
    console.error('查询坐标数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 软件控制 - 获取设备信息（固定三行，接口无返回时亮红灯）
async function fetchDeviceInfo() {
  // 先把所有设备标为离线，接口返回后再更新
  deviceList.value.forEach(d => d.isOnline = false)
  try {
    const resp = await fetch('/api/Execution/GetMachineUsage')
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    const list = Array.isArray(result) ? result : (result.data || [])
    list.forEach((item, idx) => {
      const target = deviceList.value[idx]
      if (!target) return
      target.isOnline = item.isOnline ?? true
      target.ip = item.ip || ''
      target.lastWorkedTime = formatDisplay(item.lastWorkedTime)
      target.workedTime = formatWorkedTime(item.workedTime || '')
      target.diskUsedGB = bytesToGB(item.diskUsedBytes ?? 0)
      target.diskTotalGB = bytesToGB(item.diskTotalBytes ?? 0)
      target.diskAvailGB = bytesToGB(item.diskAvailableBytes ?? 0)
      target.cpuUsagePercent = parseFloat((item.cpuUsagePercent ?? 0).toFixed(1))
    })
  } catch (err) {
    console.error('获取设备信息失败:', err)
  }
}

// 实时位置 - 获取通信事件
async function fetchCommEvents() {
  const now = new Date()
  const hours = timeRangeHours[timeRange.value] || 2
  const startTime = new Date(now.getTime() - hours * 3600 * 1000)

  const params = new URLSearchParams({
    StartTime: formatDateTime(startTime),
    EndTime: formatDateTime(now),
    OnlyUl: 'false',
    OnlyLocation: 'true',
    Count: '100'
  })

  try {
    const resp = await fetch(`/api/Result/SearchCommEvent?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    const list = result.data || []
    commTableData.value = list.map(item => ({
      deviceNumber: item.deviceNumber || '',
      dataCount: `${item.device1Count ?? 0} / ${item.device2Count ?? 0} / ${item.device3Count ?? 0}`,
      startTime: formatDisplay(item.startTime),
      endTime: formatDisplay(item.endTime),
      duration: parseDurationToSeconds(item.duration),
      imei: item.imei || '',
      commType: item.commType || '',
      locationLatLon: item.locationLatLon || '',
      chainID: item.chainID || ''
    }))
  } catch (err) {
    console.error('获取通信事件失败:', err)
  }
}

// 内容查询
async function handleFileQuery() {
  if (!fileQueryStartTime.value || !fileQueryEndTime.value) return

  loading.value = true
  const params = new URLSearchParams({
    StartTime: fileQueryStartTime.value,
    EndTime: fileQueryEndTime.value,
    OnlyUl: String(fileQueryOnlyUl.value),
    OnlyImei: String(fileQueryOnlyImei.value),
    OnlyLocation: String(fileQueryOnlyLocation.value),
    Count: '100000'
  })

  try {
    const resp = await fetch(`/api/Result/SearchCommEvent?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    const list = result.data || []
    fileQueryPage.value = 1
    fileQueryTableData.value = list.map(item => ({
      deviceNumber: item.deviceNumber || '',
      dataCount: `${item.device1Count ?? 0} / ${item.device2Count ?? 0} / ${item.device3Count ?? 0}`,
      startTime: formatDisplay(item.startTime),
      endTime: formatDisplay(item.endTime),
      duration: parseDurationToSeconds(item.duration),
      imei: item.imei || '',
      commType: item.commType || '',
      locationLatLon: item.locationLatLon || '',
      chainID: item.chainID || ''
    }))
  } catch (err) {
    console.error('内容查询失败:', err)
  } finally {
    loading.value = false
  }
}

function handleFileQueryReset() {
  initFileQueryTime()
  fileQueryOnlyUl.value = true
  fileQueryOnlyImei.value = true
  fileQueryOnlyLocation.value = true
  fileQueryTableData.value = []
  fileQueryPage.value = 1
  fileQueryColumns.forEach(c => fileQueryFilters[c.key] = new Set())
}

function initFileQueryTime() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
  fileQueryEndTime.value = formatDateTimeLocal(now)
  fileQueryStartTime.value = formatDateTimeLocal(oneHourAgo)
}

function openMeshPage(ip) {
  if (ip) window.open(`http://${ip}/`, '_blank')
}

function handleExport() {
  const now = new Date()
  let startTime, endTime, locateByComm, locateByImei, targetImei

  if (activeMenu.value === 0) {
    const hours = timeRangeHours[timeRange.value] || 2
    startTime = formatDateTime(new Date(now.getTime() - hours * 3600 * 1000))
    endTime = formatDateTime(now)
    locateByComm = queryMode.value === 'realtime' ? 'true' : 'false'
    locateByImei = 'false'
    targetImei = ''
  } else if (activeMenu.value === 2) {
    startTime = searchStartTime.value
    endTime = searchEndTime.value
    locateByComm = 'true'
    locateByImei = 'false'
    targetImei = ''
  } else {
    return
  }

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    LocateByCoummounication: locateByComm,
    LocateByImeiOrTmsi: locateByImei,
    TargetImeiOrTmsi: targetImei
  })

  window.open(`/api/Result/DownloadSearchCoordinateCSV?${params}`, '_blank')
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<style>
/* ===== 全局重置 ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  height: 100%;
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Microsoft YaHei UI", "PingFang SC", "Helvetica Neue", sans-serif;
  font-size: 14px;
  color: #2c3e50;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== 整体布局 ===== */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ===== 左侧导航栏 ===== */
.sidebar {
  width: 180px;
  min-width: 180px;
  background: linear-gradient(180deg, #0d4a7a 0%, #062a4f 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  user-select: none;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 16px 28px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

.logo-icon {
  width: 26px;
  height: 26px;
  color: #5cc5ff;
  flex-shrink: 0;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  border-radius: 6px;
  border-left: none;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-item.active {
  background: rgba(77, 184, 255, 0.2);
  color: #fff;
  font-weight: 500;
  box-shadow: inset 3px 0 0 #5cc5ff;
}

.menu-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  opacity: 0.85;
}

.menu-item.active .menu-icon {
  opacity: 1;
}

/* ===== 主内容区 ===== */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

/* ===== 顶部工具栏 ===== */
.toolbar {
  height: 46px;
  min-height: 46px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
}

/* ===== 地图容器 ===== */
.map-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

#map {
  width: 100%;
  height: 100%;
}

/* 实时位置 - 地图右上角控件 */
.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-select {
  height: 34px;
  padding: 0 30px 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.map-select:hover {
  border-color: #b0b0b0;
}

.map-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.export-btn {
  height: 34px;
  padding: 0 22px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 3px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  transition: all 0.2s;
}

.export-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.35);
}

/* 位置展示 - 顶部查询栏 */
.map-controls-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #e0e0e0;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.datetime-input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.datetime-input:hover {
  border-color: #b0b0b0;
}

.datetime-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.datetime-arrow {
  color: #999;
  font-size: 16px;
  font-weight: 300;
}

.terminal-input {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  width: 170px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.terminal-input:hover {
  border-color: #b0b0b0;
}

.terminal-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.terminal-input::placeholder {
  color: #bbb;
  font-weight: 300;
}

.query-btn {
  height: 34px;
  padding: 0 24px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  transition: all 0.2s;
}

.query-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.35);
}

/* ===== 底部表格 ===== */
.table-panel {
  height: 160px;
  min-height: 120px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.table-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

th, td {
  padding: 4px 6px;
  text-align: center;
  font-size: 12px;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background: #fafafa;
  color: #555;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 2px solid #e8e8e8;
}

td {
  color: #444;
  font-variant-numeric: tabular-nums;
}

tbody tr {
  transition: background 0.15s;
}

tbody tr:hover {
  background: #e6f7ff;
}

.empty-row {
  padding: 30px;
  color: #aaa;
  font-size: 13px;
}

/* ===== 内容查询页 ===== */
.file-query-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

.file-query-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #1890ff;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.reset-btn {
  height: 34px;
  padding: 0 22px;
  background: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.file-query-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.file-query-table-wrapper .device-table {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

/* ===== 列筛选 ===== */
.filterable-th {
  position: relative;
}

.filterable-th span {
  margin-right: 4px;
}

.filter-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  color: #bbb;
  cursor: pointer;
  border-radius: 3px;
  vertical-align: middle;
  transition: all 0.2s;
}

.filter-icon-btn:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.filter-icon-btn.filter-active {
  color: #1890ff;
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 3000;
  width: 220px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8e8e8;
  padding: 8px 0;
  text-align: left;
}

.filter-search {
  width: calc(100% - 16px);
  margin: 0 8px 6px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  color: #333;
}

.filter-search:focus {
  outline: none;
  border-color: #1890ff;
}

.filter-search::placeholder {
  color: #bbb;
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding: 0 8px 6px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-actions button {
  font-size: 12px;
  color: #1890ff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
}

.filter-actions button:hover {
  text-decoration: underline;
}

.filter-options {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 0;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-option:hover {
  background: #f5f5f5;
}

.filter-option input[type="checkbox"] {
  accent-color: #1890ff;
  flex-shrink: 0;
}

.filter-empty {
  padding: 12px;
  text-align: center;
  color: #aaa;
  font-size: 12px;
}

.filter-footer {
  padding: 6px 8px 2px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.filter-confirm {
  height: 26px;
  padding: 0 16px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-confirm:hover {
  background: #40a9ff;
}

.filter-options::-webkit-scrollbar {
  width: 4px;
}

.filter-options::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.page-info {
  font-size: 13px;
  color: #666;
}

.page-btns {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff !important;
}

/* ===== 软件控制 - 设备信息页 ===== */
.device-page {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: #f0f2f5;
}

.device-bar {
  margin-bottom: 12px;
}

.device-table-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
}

.device-table th {
  background: #fafafa;
  color: #1890ff;
  font-weight: 600;
  font-size: 12px;
  padding: 5px 8px;
  text-align: center;
  border-bottom: 2px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 1;
}

.device-table td {
  padding: 5px 8px;
  text-align: center;
  font-size: 12px;
  color: #444;
  border-bottom: 1px solid #f0f0f0;
  font-variant-numeric: tabular-nums;
}

.device-table tbody tr {
  transition: background 0.15s;
}

.device-table tbody tr:hover {
  background: #e6f7ff;
}

.status-light {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.status-light.online {
  background: #52c41a;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
}

.status-light.offline {
  background: #bbb;
}

.mesh-btn {
  height: 28px;
  padding: 0 14px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.mesh-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
}

.cpu-high {
  color: #f5222d;
  font-weight: 600;
}

/* ===== 倒计时徽章 ===== */
.countdown-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 34px;
  padding: 0 10px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* ===== 加载遮罩 ===== */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
}

.static-loading {
  position: relative;
  flex: none;
  height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8e8e8;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 设备图钉图标 */
.pin-icon {
  background: none !important;
  border: none !important;
}

/* Leaflet 缩放按钮样式 */
.leaflet-control-zoom a {
  width: 32px !important;
  height: 32px !important;
  line-height: 32px !important;
  font-size: 16px !important;
  border-radius: 6px !important;
}

/* 滚动条美化 */
.table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 轨迹弹窗 */
.trajectory-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trajectory-modal {
  background: #fff;
  width: 80vw;
  height: 75vh;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.trajectory-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #1e3a5f;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.trajectory-modal-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.trajectory-modal-close:hover {
  opacity: 0.7;
}
.trajectory-modal-body {
  flex: 1;
  position: relative;
}
.payload-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-btn {
  padding: 2px 10px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.detail-btn:hover {
  background: #096dd9;
}
.arrow-icon {
  background: none !important;
  border: none !important;
}
</style>
