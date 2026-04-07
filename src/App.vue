<template>
  <a-layout class="app-layout">
    <AppSidebar v-model:active-menu="activeMenu" />

    <a-layout>
      <a-layout-header class="app-header">
        <div class="header-left">
          <a-breadcrumb>
            <a-breadcrumb-item>{{ menuLabels[activeMenu] || '首页' }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-button type="text" size="small" @click="toggleFullscreen">
            <FullscreenOutlined />
          </a-button>
        </div>
      </a-layout-header>

      <a-layout-content class="app-content">
        <FileQueryPage
          v-if="activeMenu === 1"
          v-model:file-query-start-time="fileQueryStartTime"
          v-model:file-query-end-time="fileQueryEndTime"
          v-model:file-query-only-ul="fileQueryOnlyUl"
          v-model:file-query-only-imei="fileQueryOnlyImei"
          v-model:file-query-imei-filter="fileQueryImeiFilter"
          v-model:payload-filter-location-lat-lon="payloadFilterLocationLatLon"
          v-model:payload-filter-signaling="payloadFilterSignaling"
          v-model:payload-filter-idapp-x-y-z="payloadFilterIdappXYZ"
          v-model:payload-filter-aircraft="payloadFilterAircraft"
          v-model:payload-filter-voice="payloadFilterVoice"
          v-model:payload-filter-sms="payloadFilterSms"
          v-model:payload-filter-ip="payloadFilterIp"
          v-model:payload-filter-low-speed="payloadFilterLowSpeed"
          v-model:payload-filter-idapp="payloadFilterIdapp"
          v-model:file-query-page="fileQueryPage"
          :loading="loading"
          :file-query-columns="fileQueryColumns"
          :file-query-filters="fileQueryFilters"
          :file-query-paged-data="fileQueryPagedData"
          :file-query-filtered-data="fileQueryFilteredData"
          :file-query-total-pages="fileQueryTotalPages"
          :file-query-visible-pages="fileQueryVisiblePages"
          @query="handleFileQuery"
          @export="handleFileQueryExport"
          @toggle-filter-dropdown="toggleFilterDropdown"
          @open-payload-modal="openPayloadModal"
          @open-location-preview="openLocationPreview"
          @show-lcw-detail="showLCWDetail"
          @export-lcw-detail="handleLCWDetailExport"
        />

        <MapPanel
          v-show="activeMenu === 0 || activeMenu === 2"
          :active-menu="activeMenu"
          :loading="loading"
          :countdown="countdown"
          v-model:query-mode="queryMode"
          v-model:cal-step-second="calStepSecond"
          v-model:time-range="timeRange"
          v-model:search-query-mode="searchQueryMode"
          v-model:search-cal-step-second="searchCalStepSecond"
          v-model:search-start-time="searchStartTime"
          v-model:search-end-time="searchEndTime"
          v-model:search-terminal-id="searchTerminalId"
          @realtime-query="handleRealtimeQuery"
          @search="handleSearch"
          @export="handleExport"
        />

        <DeviceInfoPage
          v-if="activeMenu === 3"
          :device-config-form="deviceConfigForm"
          :device-config-meta="deviceConfigMeta"
          :device-config-loading="deviceConfigLoading"
          :device-config-saving="deviceConfigSaving"
          :rebooting-device="rebootingDevice"
          :shutting-down-device="shuttingDownDevice"
          :device-config-message="deviceConfigMessage"
          :device-config-message-type="deviceConfigMessageType"
          :device-list="deviceList"
          @save-device-config="handleSaveDeviceConfig"
          @reboot="handleReboot"
          @shutdown="handleShutdown"
          @open-mesh="openMeshPage"
        />

        <CommEventsTable
          v-if="activeMenu === 0"
          :comm-table-data="commTableData"
          @open-location-preview="openLocationPreview"
          @open-payload-modal="openPayloadModal"
          @show-lcw-detail="showLCWDetail"
          @export-lcw-detail="handleLCWDetailExport"
        />
      </a-layout-content>
    </a-layout>

    <MapModal
      :visible="showTrajectoryModal"
      :title="`终端轨迹 - ${trajectoryTerminalId}  ${trajectoryTimeRange}`"
      map-id="trajectoryMap"
      @close="closeTrajectoryModal"
    />

    <MapModal
      :visible="showLocationModal"
      :title="`定位预览 - ${locationPreviewLatLon}`"
      map-id="locationPreviewMap"
      modal-class="location-preview-modal"
      @close="closeLocationPreview"
    />

    <LcwDetailModal
      :visible="showLCWModal"
      :loading="lcwLoading"
      :lcw-detail-columns="lcwDetailColumns"
      :lcw-detail-filters="lcwDetailFilters"
      :lcw-detail-filtered-data="lcwDetailFilteredData"
      @close="closeLCWModal"
      @toggle-filter-dropdown="toggleLCWFilterDropdown"
    />

    <PayloadModal
      :visible="showPayloadModal"
      :current-payload-data="currentPayloadData"
      :current-payload-sections="currentPayloadSections"
      @close="showPayloadModal = false"
      @download-wav="downloadWav"
    />
  </a-layout>

  <ColumnFilterDropdown
    :visible="Boolean(activeFilterCol)"
    :position="filterDropdownPos"
    :options="activeFilterCol ? getFilteredOptions(activeFilterCol) : []"
    :selected-values="activeFilterCol ? fileQueryFilters[activeFilterCol] : null"
    v-model:search-text="filterSearchText"
    @select-all="activeFilterCol && filterSelectAll(activeFilterCol)"
    @clear-all="activeFilterCol && filterClearAll(activeFilterCol)"
    @toggle-value="val => activeFilterCol && toggleFilterValue(activeFilterCol, val)"
    @close="activeFilterCol = null"
  />

  <ColumnFilterDropdown
    :visible="Boolean(lcwActiveFilterCol)"
    :position="lcwFilterDropdownPos"
    :options="lcwActiveFilterCol ? getLCWFilteredOptions(lcwActiveFilterCol) : []"
    :selected-values="lcwActiveFilterCol ? lcwDetailFilters[lcwActiveFilterCol] : null"
    v-model:search-text="lcwFilterSearchText"
    @select-all="lcwActiveFilterCol && lcwFilterSelectAll(lcwActiveFilterCol)"
    @clear-all="lcwActiveFilterCol && lcwFilterClearAll(lcwActiveFilterCol)"
    @toggle-value="val => lcwActiveFilterCol && toggleLCWFilterValue(lcwActiveFilterCol, val)"
    @close="lcwActiveFilterCol = null"
  />
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FullscreenOutlined } from '@ant-design/icons-vue'
import AppSidebar from './components/app/AppSidebar.vue'
import ColumnFilterDropdown from './components/app/ColumnFilterDropdown.vue'
import CommEventsTable from './components/app/CommEventsTable.vue'
import DeviceInfoPage from './components/app/DeviceInfoPage.vue'
import FileQueryPage from './components/app/FileQueryPage.vue'
import LcwDetailModal from './components/app/LcwDetailModal.vue'
import MapModal from './components/app/MapModal.vue'
import MapPanel from './components/app/MapPanel.vue'
import PayloadModal from './components/app/PayloadModal.vue'

// 侧栏菜单
const activeMenu = ref(0)
const menuLabels = { 0: '实时位置', 1: '内容查询', 2: '位置查询', 3: '设备信息' }

// 地图控件状态 - 实时位置
const queryMode = ref('realtime')
const calStepSecond = ref('60')
const timeRange = ref('2hour')

// 位置展示查询参数
const searchQueryMode = ref('realtime')
const searchCalStepSecond = ref('60')
const searchStartTime = ref('')
const searchEndTime = ref('')
const searchTerminalId = ref('')

// LCW详情弹窗
const showLCWModal = ref(false)
const lcwDetailData = ref([])
const lcwLoading = ref(false)
// 这一组列定义既决定表头显示，也决定导出 CSV 时的列顺序。
// 后面如果你想给 LCW 详情加字段，通常先从这里开始改。
const lcwDetailColumns = [
  { key: 'deviceNumber', label: '设备编号' },
  { key: 'time', label: '时间' },
  { key: 'isUl', label: '方向' },
  { key: 'frequency', label: '频率' },
  { key: 'imei', label: 'IMEI' },
  { key: 'chn', label: '信道' },
  { key: 'signaling', label: '信号类型' },
  { key: 'frameType', label: '帧类型' },
  { key: 'rawLine', label: '原始数据' },
]
// 每一列都用一个 Set 保存“当前勾选的值”。
// 例如某列勾选了 “上行” 和 “下行”，对应的 Set 就会有两个字符串。
const lcwDetailFilters = reactive(
  Object.fromEntries(lcwDetailColumns.map(c => [c.key, new Set()]))
)
const lcwActiveFilterCol = ref(null)
const lcwFilterSearchText = ref('')
const lcwFilterDropdownPos = ref({ top: 0, left: 0 })

const lcwDetailFilteredData = computed(() => {
  return lcwDetailData.value.filter(row => {
    // every 的意思是：所有列都通过筛选，这一行才保留。
    return lcwDetailColumns.every(col => {
      const selected = lcwDetailFilters[col.key]
      // 这一列如果一个选项都没勾，就等于“不限制这一列”。
      if (!selected || selected.size === 0) return true
      return selected.has(String(row[col.key] || ''))
    })
  })
})

// 轨迹弹窗
const showTrajectoryModal = ref(false)
const trajectoryTerminalId = ref('')
const trajectoryTimeRange = ref('')
let trajectoryMap = null
const showLocationModal = ref(false)
const locationPreviewLatLon = ref('')
let locationPreviewMap = null

// 内容查询参数
const fileQueryStartTime = ref('')
const fileQueryEndTime = ref('')
const fileQueryOnlyUl = ref(true)
const fileQueryOnlyImei = ref(true)
const fileQueryOnlyLocation = ref(true)
const fileQueryImeiFilter = ref('')

// 内容查询额外过滤
// payloadFilterLocationLatLon 用来筛出“拥有定位经纬度”的结果，和列筛选互补。
// 这里拆成多个 ref，是因为每个复选框都需要一个独立的布尔状态。
const payloadFilterLocationLatLon = ref(false)
const payloadFilterSignaling = ref(false)
const payloadFilterIdappXYZ = ref(false)
const payloadFilterAircraft = ref(false)
const payloadFilterVoice = ref(false)
const payloadFilterSms = ref(false)
const payloadFilterIp = ref(false)
const payloadFilterLowSpeed = ref(false)
const payloadFilterIdapp = ref(false)
const fileQueryTableData = ref([])
const fileQueryPage = ref(1)
const fileQueryPageSize = 50

const fileQueryColumns = [
  { key: 'deviceNumber', label: '设备编号', width: '65px' },
  { key: 'chainID', label: '识别码', width: '145px' },
  { key: 'startTime', label: '通信起始时间', width: '130px' },
  { key: 'endTime', label: '通信截止时间', width: '130px' },
  { key: 'duration', label: '通信时长(秒)', width: '78px' },
  { key: 'imei', label: 'IMEI', width: '110px' },
  { key: 'locationLatLon', label: '定位经纬度', width: '180px' },
  { key: 'payloadInfo', label: '载荷信息', width: '74px', noFilter: true },
]

// 列筛选状态：每列一个 Set，空 Set 表示不过滤
const fileQueryFilters = reactive(
  Object.fromEntries(fileQueryColumns.map(c => [c.key, new Set()]))
)
const activeFilterCol = ref(null)
const filterSearchText = ref('')
const filterDropdownPos = ref({ top: 0, left: 0 })

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

function toggleFilterDropdown(key, event) {
  if (activeFilterCol.value === key) {
    activeFilterCol.value = null
  } else {
    // 这里记录“当前打开的是哪一列的下拉框”，模板里会据此切换内容。
    activeFilterCol.value = key
    filterSearchText.value = ''
    // 用按钮坐标定位，避免被 overflow:auto 裁剪
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      filterDropdownPos.value = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    }
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

function getLCWColumnUniqueValues(key) {
  const vals = new Set()
  lcwDetailData.value.forEach(row => vals.add(String(row[key] || '')))
  return [...vals].sort()
}

function getLCWFilteredOptions(key) {
  const all = getLCWColumnUniqueValues(key)
  if (!lcwFilterSearchText.value) return all
  const kw = lcwFilterSearchText.value.toLowerCase()
  return all.filter(v => v.toLowerCase().includes(kw))
}

function toggleLCWFilterDropdown(key, event) {
  if (lcwActiveFilterCol.value === key) {
    lcwActiveFilterCol.value = null
  } else {
    lcwActiveFilterCol.value = key
    lcwFilterSearchText.value = ''
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      lcwFilterDropdownPos.value = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    }
  }
}

function toggleLCWFilterValue(key, val) {
  const s = lcwDetailFilters[key]
  if (s.has(val)) s.delete(val)
  else s.add(val)
}

function lcwFilterSelectAll(key) {
  const all = getLCWFilteredOptions(key)
  const s = lcwDetailFilters[key]
  all.forEach(v => s.add(v))
}

function lcwFilterClearAll(key) {
  lcwDetailFilters[key].clear()
}

const fileQueryFilteredData = computed(() => {
  return fileQueryTableData.value.filter(row => {
    // 这里的 filter 相当于“多重关卡”：
    // 只要任何一个条件不满足，就 return false 把这一行排除掉。

    // IMEI 文本过滤（前端，模糊匹配）
    if (fileQueryImeiFilter.value.trim()) {
      const kw = fileQueryImeiFilter.value.trim().toLowerCase()
      if (!String(row.imei || '').toLowerCase().includes(kw)) return false
    }

    // 列筛选（跳过 noFilter 列）
    if (!fileQueryColumns.every(col => {
      if (col.noFilter) return true
      const selected = fileQueryFilters[col.key]
      if (!selected || selected.size === 0) return true
      return selected.has(String(row[col.key] || ''))
    })) return false

    // “定位经纬度”来自结果行本身，不依赖载荷解析结果。
    // 这里只要 locationLatLon 有值，就认为该条记录拥有可展示的定位数据。
    if (payloadFilterLocationLatLon.value && !String(row.locationLatLon || '').trim()) return false

    // 载荷过滤（勾选的条件必须全部满足）
    // row.payloadData 是我们在请求返回后提前整理好的结构化数据，
    // 这样这里判断时就不用每次都重新解析原始字段。
    const d = row.payloadData || {}
    if (payloadFilterSignaling.value && !(d.signaling?.length > 0)) return false
    if (payloadFilterIdappXYZ.value && !(d.idappXYZ?.length > 0)) return false
    if (payloadFilterAircraft.value && !(d.acars?.length > 0)) return false
    if (payloadFilterVoice.value && !(d.voiceWavs?.length > 0)) return false
    if (payloadFilterSms.value && !(d.sms?.length > 0)) return false
    if (payloadFilterIp.value && !d.isIp) return false
    if (payloadFilterLowSpeed.value && !d.isLowSpeedData) return false
    if (payloadFilterIdapp.value && !d.parsedData) return false

    return true
  })
})

const fileQueryTotalPages = computed(() =>
  Math.max(1, Math.ceil(fileQueryFilteredData.value.length / fileQueryPageSize))
)

const fileQueryPagedData = computed(() => {
  // 前端分页的本质就是“截取数组的一段”。
  const start = (fileQueryPage.value - 1) * fileQueryPageSize
  return fileQueryFilteredData.value.slice(start, start + fileQueryPageSize)
})

const fileQueryVisiblePages = computed(() => {
  // 分页按钮不把所有页码都显示出来，只显示当前页附近的一小段。
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

// 软件控制 - 设备列表锛堝浐瀹氫笁鍙帮級
const deviceList = ref([
  { name: 'Device1', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
  { name: 'Device2', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
  { name: 'Device3', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
])
const deviceConfigForm = reactive({
  isCenterNode: false,
  device1IP: '',
  device2IP: '',
  device3IP: '',
})
const deviceConfigMeta = reactive({
  deviceGuid: '',
})
const deviceConfigRaw = ref(null)
const deviceConfigLoading = ref(false)
const deviceConfigSaving = ref(false)
const rebootingDevice = ref(false)
const shuttingDownDevice = ref(false)
const deviceConfigMessage = ref('')
const deviceConfigMessageType = ref('info')
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

let map = null
let markers = [] // 存储地图上的标记
let refreshTimer = null

// 时间范围映射（小时数）
const timeRangeHours = {
  '1hour': 1, '2hour': 2, '6hour': 6, '12hour': 12, '24hour': 24
}


// 格式化栨棩鏈熶负 API 闇€瑕佺殑鏍煎紡
function formatDateTime(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 格式化 .NET TimeSpan 字符串用于表格显示
// 示例: "739699.14:51:03.8393552" -> "739699天 14:51:03", "00:00:12.1426503" -> "00:00:12"
function formatWorkedTime(val) {
  if (!val) return ''
  // 判断是否有天数前缀，例如 "739699.14:51:03"
  const withDays = /^(\d+)\.(\d+):(\d+):(\d+)/.exec(val)
  if (withDays) {
    const [, d, hh, mm, ss] = withDays
    return `${d}天 ${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}`
  }
  // 不含天数时，例如 "HH:mm:ss.fff"
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

function setDeviceConfigMessage(message, type = 'info') {
  deviceConfigMessage.value = message
  deviceConfigMessageType.value = type
}

function formatDisplay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDisplayPlus8(dateStr) {
  if (!dateStr) return ''
  // 强制按 UTC 解析（服务端返回无时区字符串）
  const utcStr = String(dateStr).replace(' ', 'T') + 'Z'
  const d = new Date(new Date(utcStr).getTime() + 8 * 3600 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

// 璁＄畻閫氫俊鏃堕暱
function getChainIdFromItem(item) {
  return String(item?.chainID ?? item?.ChainID ?? item?.chainId ?? item?.ChainId ?? '').trim()
}

function formatLocationLatLon(item) {
  const lat = item?.['定位经纬度Lat'] ?? item?.定位经纬度Lat ?? item?.locationLat ?? item?.LocationLat ?? item?.lat ?? item?.Lat
  const lon = item?.['定位经纬度Lon'] ?? item?.定位经纬度Lon ?? item?.locationLon ?? item?.LocationLon ?? item?.lon ?? item?.Lon

  const latText = String(lat ?? '').trim()
  const lonText = String(lon ?? '').trim()
  if (latText && lonText) {
    const latNum = Number(latText)
    const lonNum = Number(lonText)
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      if (latNum === 0 && lonNum === 0) return ''
      return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
    }
    return `${latText}, ${lonText}`
  }

  const fallback = String(item?.locationLatLon ?? item?.LocationLatLon ?? '').trim()
  if (!fallback) return ''
  const parts = fallback.split(/[,\s，]+/).filter(Boolean)
  if (parts.length >= 2) {
    const latNum = Number(parts[0])
    const lonNum = Number(parts[1])
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      if (latNum === 0 && lonNum === 0) return ''
      return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
    }
  }
  return fallback
}

function parseLatLonText(text) {
  const parts = String(text || '')
    .split(/[,\s，]+/)
    .map(s => s.trim())
    .filter(Boolean)
  if (parts.length < 2) return null
  const lat = Number(parts[0])
  const lon = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat === 0 && lon === 0) return null
  return { lat, lon }
}

function openLocationPreview(row) {
  const parsed = parseLatLonText(row?.locationLatLon)
  if (!parsed) return

  locationPreviewLatLon.value = `${parsed.lat.toFixed(6)}, ${parsed.lon.toFixed(6)}`
  showLocationModal.value = true

  nextTick(() => {
    if (locationPreviewMap) {
      locationPreviewMap.remove()
      locationPreviewMap = null
    }

    locationPreviewMap = L.map('locationPreviewMap', {
      center: [parsed.lat, parsed.lon],
      zoom: 12,
      zoomControl: true
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(locationPreviewMap)

    L.marker([parsed.lat, parsed.lon]).addTo(locationPreviewMap)
      .bindPopup(`<b>定位点</b><br>纬度: ${parsed.lat.toFixed(6)}<br>经度: ${parsed.lon.toFixed(6)}`)
      .openPopup()

    setTimeout(() => {
      if (locationPreviewMap) locationPreviewMap.invalidateSize()
    }, 120)
  })
}

function closeLocationPreview() {
  showLocationModal.value = false
  if (locationPreviewMap) {
    locationPreviewMap.remove()
    locationPreviewMap = null
  }
}

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

// 解析 .NET TimeSpan 字符串为秒数（保留两位小数）
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
    TargetImeiOrTmsi: '',
    isshowdevice: 'true',
    ...(isRealtime ? {} : { CalStepSecond: calStepSecond.value })
  })

  try {
    const resp = await fetch(`/api/Result/SearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data) {
      // 更新表格数据
      tableData.value = result.data.map(item => ({
        terminalId: item.terminalID || '',
        chainID: getChainIdFromItem(item),
        startTime: formatDisplayPlus8(item.startTime),
        endTime: formatDisplayPlus8(item.endTime),
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
// 判断是否为设备标记帮紙device1/2/3锛屽彧鏈夊潗鏍囨病鏈夋椂闂达級
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

// 閲嶅彔鐐硅仛鍚堢姸鎬侊細key -> { lat, lng, items, clusterMarker, expanded, individualMarkers }
let clusterGroups = {}

function createClusterIcon(count) {
  const r = count > 99 ? 20 : count > 9 ? 18 : 16
  const d = r * 2
  const h = d + r * 0.7
  const fs = count > 99 ? 11 : 13
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${h}" viewBox="0 0 ${d} ${h}">
    <circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="#1890ff" stroke="#fff" stroke-width="2.5"/>
    <polygon points="${r - 6},${d - 3} ${r + 6},${d - 3} ${r},${h}" fill="#1890ff"/>
    <text x="${r}" y="${r + fs * 0.38}" text-anchor="middle" fill="#fff"
      font-size="${fs}" font-weight="700" font-family="sans-serif">${count}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [d, h],
    iconAnchor: [r, h], // 尖角底部为锚点
  })
}

// 鍒涘缓鍗曚釜缁堢鏍囪骞舵坊鍔犲埌鍦板浘
function createSingleMarker(item, lat, lng) {
  let marker
  const chainID = getChainIdFromItem(item)
  if (isDeviceMarker(item)) {
    marker = L.marker([lat, lng], { icon: createPinIcon('#52c41a') }).addTo(map)
    marker.bindPopup(
      `<b>${item.terminalID}</b>${chainID ? `<br>识别码: ${chainID}` : ''}<br>经度: ${item.longitude.toFixed(6)}<br>纬度: ${item.latitude.toFixed(6)}`
    )
  } else {
    const hasTerminal = !!item.terminalID
    marker = L.circleMarker([lat, lng], {
      radius: 7,
      fillColor: hasTerminal ? '#1890ff' : '#e74c3c',
      color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    }).addTo(map)
    const popupContent = document.createElement('div')
    popupContent.style.cssText = 'font-size:13px;line-height:1.8;min-width:180px;'
    popupContent.innerHTML =
      `<div style="font-weight:600;font-size:14px;color:#1e3a5f;border-bottom:1px solid #e8e8e8;padding-bottom:4px;margin-bottom:4px;">终端: ${item.terminalID || '无'}</div>` +
      (chainID ? `<div>识别码: ${chainID}</div>` : '') +
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
  return marker
}

// 展开聚合：移除聚合图标，在圆形范围内显示各终端标记
function expandCluster(key) {
  const g = clusterGroups[key]
  if (!g || g.expanded) return
  map.removeLayer(g.clusterMarker)
  g.expanded = true
  g.individualMarkers = []
  const n = g.items.length
  const R = 0.0004

  // 半透明背景圆，视觉上框住散开的标记
  const bgCircle = L.circle([g.lat, g.lng], {
    radius: 55,          // 绫筹紝涓庢暎寮€鍗婂緞鍖归厤
    color: '#ff4d4f',
    weight: 1.5,
    opacity: 0.5,
    fillColor: '#ff4d4f',
    fillOpacity: 0.08,
    interactive: false,
  }).addTo(map)
  g.individualMarkers.push(bgCircle)

  g.items.forEach((item, idx) => {
    const angle = (2 * Math.PI * idx) / n - Math.PI / 2
    const lat = g.lat + R * Math.cos(angle)
    const lng = g.lng + R * Math.sin(angle)
    const m = createSingleMarker(item, lat, lng)
    g.individualMarkers.push(m)
  })
  // 鏀惰捣鎸夐挳
  const collapseIcon = L.divIcon({
    html: `<div class="map-cluster-collapse">×</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
  const collapseMarker = L.marker([g.lat, g.lng], { icon: collapseIcon, zIndexOffset: 1000 }).addTo(map)
  collapseMarker.on('click', () => collapseCluster(key))
  g.collapseMarker = collapseMarker
  g.individualMarkers.push(collapseMarker)
}

// 收起聚合：移除各终端标记，恢复聚合图标
function collapseCluster(key) {
  const g = clusterGroups[key]
  if (!g || !g.expanded) return
  g.individualMarkers.forEach(m => map.removeLayer(m))
  g.individualMarkers = []
  g.collapseMarker = null
  g.expanded = false
  g.clusterMarker.addTo(map)
}

function updateMapMarkers(data) {
  // 清除鏃ф爣璁帮紙鍚凡灞曞紑鐨勪釜浣撴爣璁帮級
  markers.forEach(m => map.removeLayer(m))
  Object.values(clusterGroups).forEach(g => {
    g.individualMarkers.forEach(m => map.removeLayer(m))
  })
  markers = []
  clusterGroups = {}

  if (!data || data.length === 0) return

  // 按精确坐标分组
  const coordGroups = {}
  data.forEach(item => {
    if (!item.latitude || !item.longitude || item.latitude === 0 || item.longitude === 0) return
    const key = `${item.latitude.toFixed(6)},${item.longitude.toFixed(6)}`
    if (!coordGroups[key]) coordGroups[key] = []
    coordGroups[key].push(item)
  })

  Object.entries(coordGroups).forEach(([key, group]) => {
    const [lat, lng] = key.split(',').map(Number)
    if (group.length === 1) {
      // 单点，直接渲染
      markers.push(createSingleMarker(group[0], lat, lng))
    } else {
      // 多点重叠，显示聚合图标
      const clusterMarker = L.marker([lat, lng], { icon: createClusterIcon(group.length), zIndexOffset: 500 }).addTo(map)
      clusterMarker.on('click', () => expandCluster(key))
      markers.push(clusterMarker)
      clusterGroups[key] = { lat, lng, items: group, clusterMarker, expanded: false, individualMarkers: [], collapseMarker: null }
    }
  })

  // 不自动缩放地图，保留用户当前视角
}

function closeLCWModal() {
  lcwDetailData.value = []
  showLCWModal.value = false
}

// 查询LCW详情
async function showLCWDetail(row) {
  // 打开弹窗前先把旧数据和旧筛选状态清空，避免看到上一次查询残留。
  showLCWModal.value = true
  lcwDetailData.value = []
  lcwLoading.value = true
  lcwDetailColumns.forEach(c => lcwDetailFilters[c.key].clear())
  lcwActiveFilterCol.value = null
  lcwFilterSearchText.value = ''
  try {
    lcwDetailData.value = await fetchLCWDetailRows(row)
  } catch (err) {
    console.error('查询LCW详情失败:', err)
  } finally {
    lcwLoading.value = false
  }
}

// 查询轨迹
function getLCWQueryTimeRangeForDetail() {
  // LCW 详情要跟随“当前页面上下文”的时间范围。
  // 在实时位置页，时间来自右上角时间范围；在内容查询页，时间来自查询栏。
  if (activeMenu.value === 0) {
    const now = new Date()
    const hours = timeRangeHours[timeRange.value] || 2
    const start = new Date(now.getTime() - hours * 3600 * 1000)
    return {
      startTime: formatDateTime(start),
      endTime: formatDateTime(now)
    }
  }
  return {
    startTime: fileQueryStartTime.value,
    endTime: fileQueryEndTime.value
  }
}

function mapLCWDetailRowsForUI(list) {
  // 后端字段命名不完全统一，所以这里做一次兼容映射，
  // 后续表格渲染就能只认一种固定结构。
  return (list || []).map(item => ({
    deviceNumber: item.deviceName ?? item.DeviceName ?? item.deviceNumber ?? item.DeviceNumber ?? '',
    time: formatDisplayPlus8(item.time ?? item.Time),
    isUl: (item.isUl ?? item.IsUl ?? item.isUL ?? item.IsUL) ? '上行' : '下行',
    frequency: item.frequncy ?? item.frequency ?? item.Frequency ?? item.Frequncy ?? '',
    imei: item.imei ?? item.Imei ?? item.IMEI ?? '',
    chn: item.chn ?? item.Chn ?? item.channel ?? item.Channel ?? '',
    signaling: item['信令类型'] ?? item.signaling ?? item.Signaling ?? '',
    frameType: item.frameType ?? item.FrameType ?? '',
    rawLine: item.rawLine ?? item.RawLine ?? ''
  }))
}

async function fetchLCWDetailRows(row) {
  const { startTime, endTime } = getLCWQueryTimeRangeForDetail()
  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    ChainID: row.chainID || ''
  })

  const resp = await fetch(`/api/Result/SearchLCW?${params}`)
  const text = await resp.text()
  if (!text) return []
  const result = JSON.parse(text)
  return mapLCWDetailRowsForUI(result.data || [])
}

async function handleLCWDetailExport(row) {
  try {
    // 导出时复用同一份查询逻辑，避免“表格里看到的”和“导出的”不一致。
    const rows = await fetchLCWDetailRows(row)
    const cols = lcwDetailColumns
    const header = cols.map(c => csvEscape(c.label)).join(',')
    const lines = rows.map(r => cols.map(c => csvEscape(r?.[c.key] ?? '')).join(','))
    const csv = [header, ...lines].join('\r\n')

    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const chain = String(row?.chainID || 'unknown').replace(/[\\/:*?"<>|]/g, '_')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lcw_detail_${chain}_${ts}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出LCW详情失败:', err)
  }
}

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
    // 位置展示 - 使用用户选择的时间
    startTime = searchStartTime.value
    endTime = searchEndTime.value
  }

  trajectoryTimeRange.value = `${startTime.replace('T', ' ')} 至 ${endTime.replace('T', ' ')}`

  // 继承当前页面的模式和 CalStepSecond 设置
  const isRealtime = activeMenu.value === 0
    ? queryMode.value === 'realtime'
    : searchQueryMode.value === 'realtime'
  const stepSecond = activeMenu.value === 0 ? calStepSecond.value : searchCalStepSecond.value

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: 'true',
    TargetImeiOrTmsi: terminalId,
    isshowdevice: 'true',
    ...(isRealtime ? {} : { CalStepSecond: stepSecond })
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
    const resp = await fetch(`/api/Result/SearchCoordinate?${params}`)
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

      // 在每段线段中间绘制橙色 SVG 箭头
      // 屏幕 Y 轴向下，因此纬度差值需要取反
      for (let i = 0; i < latlngs.length - 1; i++) {
        const from = latlngs[i]
        const to = latlngs[i + 1]
        const midLat = (from[0] + to[0]) / 2
        const midLng = (from[1] + to[1]) / 2
        const dlat = to[0] - from[0]
        const dlng = to[1] - from[1]
        // 墨卡托投影：经度方向在屏幕上缩短 cos(lat) 倍
        const cosLat = Math.cos(midLat * Math.PI / 180)
        // 先把经纬度差转换成近似“屏幕方向向量”，再用 atan2 算旋转角度。
        // 这里 X 近似等于经度差，Y 近似等于纬度差，但要考虑地图投影缩放。
        const angleDeg = Math.atan2(-dlat, dlng * cosLat) * 180 / Math.PI
        // 箭头原图默认朝右，所以这里只需要给外层 svg 旋转角度即可。
        const arrowSvg = `<svg width="28" height="14" viewBox="0 0 28 14" style="transform:rotate(${angleDeg}deg)"><polygon points="4,2 24,7 4,12" fill="#fa8c16" stroke="#e8740e" stroke-width="0.5"/></svg>`
        const arrowIcon = L.divIcon({
          html: arrowSvg,
          className: 'arrow-icon',
          iconSize: [28, 14],
          iconAnchor: [14, 7]
        })
        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(trajectoryMap)
      }

      // 起点标记锛堢豢鑹诧級
      L.circleMarker(latlngs[0], {
        radius: 9, fillColor: '#52c41a', color: '#fff', weight: 2, fillOpacity: 1
      }).addTo(trajectoryMap).bindPopup(`<b>起点</b><br>时间: ${formatDisplay(sorted[0].lastDataTime || sorted[0].startTime)}<br>经度: ${sorted[0].longitude.toFixed(6)}<br>纬度: ${sorted[0].latitude.toFixed(6)}`)

      // 终点标记锛堢孩鑹诧級
      const last = sorted[sorted.length - 1]
      L.circleMarker(latlngs[latlngs.length - 1], {
        radius: 9, fillColor: '#e74c3c', color: '#fff', weight: 2, fillOpacity: 1
      }).addTo(trajectoryMap).bindPopup(`<b>终点</b><br>时间: ${formatDisplay(last.lastDataTime || last.startTime)}<br>经度: ${last.longitude.toFixed(6)}<br>纬度: ${last.latitude.toFixed(6)}`)

      // 中间点癸紙深蓝色诧級
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

// 切换菜单时讹紝娓呯┖鏁版嵁骞跺垏鎹㈤€昏緫
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
    if (!fileQueryStartTime.value) initFileQueryTime()
  } else if (val === 2) {
    nextTick(() => { if (map) map.invalidateSize() })
    if (!searchStartTime.value) initSearchTime()
  } else if (val === 3) {
    setDeviceConfigMessage('')
    fetchDeviceInfo()
    fetchDeviceConfiguration()
    deviceRefreshTimer = setInterval(fetchDeviceInfo, 120000)
  }
})

// 点击页面其他区域关闭列筛选下拉
function handleGlobalClick() {
  if (activeFilterCol.value) activeFilterCol.value = null
  if (lcwActiveFilterCol.value) lcwActiveFilterCol.value = null
}

onMounted(async () => {
  document.addEventListener('click', handleGlobalClick)
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

  // 首次加载数据
  handleRealtimeQuery()
  setupRefreshTimer()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (deviceRefreshTimer) clearInterval(deviceRefreshTimer)
  document.removeEventListener('click', handleGlobalClick)
  if (locationPreviewMap) {
    locationPreviewMap.remove()
    locationPreviewMap = null
  }
})

// 位置展示 - 查询（使用 SearchCoordinate 接口）
async function handleSearch() {
  if (!searchStartTime.value || !searchEndTime.value) return

  loading.value = true
  // SearchCoordinate 同时支持“按通信定位”和“按终端 ID 定位”，
  // 所以这里把页面上的多个输入统一折叠成接口参数。
  const isRealtime = searchQueryMode.value === 'realtime'
  const params = new URLSearchParams({
    StartTime: searchStartTime.value,
    EndTime: searchEndTime.value,
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: searchTerminalId.value ? 'true' : 'false',
    TargetImeiOrTmsi: searchTerminalId.value || '',
    isshowdevice: 'true',
    ...(isRealtime ? {} : { CalStepSecond: searchCalStepSecond.value })
  })

  try {
    const resp = await fetch(`/api/Result/SearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data) {
      tableData.value = result.data.map(item => ({
        terminalId: item.terminalID || '',
        chainID: getChainIdFromItem(item),
        startTime: formatDisplayPlus8(item.startTime),
        endTime: formatDisplayPlus8(item.endTime),
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

// 软件控制 - 获取设备信息（固定三台设备，没有返回时保持离线）
async function fetchDeviceInfo() {
  // 先全部标记为离线，再按接口结果逐个回填。
  // 这样当接口失败时，界面不会误以为设备还在线。
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

function applyDeviceConfiguration(data) {
  // 这一层专门负责“把接口数据灌进表单”，
  // 好处是加载配置、保存后刷新配置都能复用它。
  deviceConfigRaw.value = data ? { ...data } : null
  deviceConfigMeta.deviceGuid = data?.deviceGuid || ''
  deviceConfigForm.isCenterNode = !!data?.isCenterNode
  deviceConfigForm.device1IP = data?.device1IP || ''
  deviceConfigForm.device2IP = data?.device2IP || ''
  deviceConfigForm.device3IP = data?.device3IP || ''
}

async function fetchDeviceConfiguration() {
  deviceConfigLoading.value = true
  try {
    const resp = await fetch('/api/Configuration/Get')
    const text = await resp.text()
    if (!text) {
      setDeviceConfigMessage('未获取到设备配置数据。', 'warning')
      return
    }
    const result = JSON.parse(text)
    if (result?.status !== undefined && result.status !== 1) {
      throw new Error(result?.message || '获取设备配置失败')
    }
    const data = result?.data || result
    applyDeviceConfiguration(data)
    setDeviceConfigMessage('设备配置已加载。', 'success')
  } catch (err) {
    console.error('获取设备配置失败:', err)
    setDeviceConfigMessage(`获取设备配置失败：${err?.message || err}`, 'error')
  } finally {
    deviceConfigLoading.value = false
  }
}

function buildDeviceConfigPayload() {
  // 提交时保留原始对象里我们没有编辑的字段，避免误删服务端已有配置。
  const base = deviceConfigRaw.value ? { ...deviceConfigRaw.value } : {}
  return {
    ...base,
    deviceGuid: deviceConfigMeta.deviceGuid || base.deviceGuid || '',
    isCenterNode: !!deviceConfigForm.isCenterNode,
    device1IP: deviceConfigForm.device1IP.trim(),
    device2IP: deviceConfigForm.device2IP.trim(),
    device3IP: deviceConfigForm.device3IP.trim(),
  }
}

async function postDeviceConfiguration(payload) {
  const endpoints = [
    '/api/Configuration/Set',
    '/api/Configuration/Update',
    '/api/Configuration/Save',
  ]
  let lastError = null

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        lastError = new Error(`${url} 返回 ${resp.status}`)
        continue
      }

      const text = await resp.text()
      if (!text) return
      const result = JSON.parse(text)
      if (result?.status !== undefined && result.status !== 1) {
        throw new Error(result?.message || `${url} 保存失败`)
      }
      return
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('保存配置失败')
}

async function handleSaveDeviceConfig() {
  const payload = buildDeviceConfigPayload()
  deviceConfigSaving.value = true
  setDeviceConfigMessage('正在保存设备配置...', 'info')

  try {
    await postDeviceConfiguration(payload)
    deviceConfigRaw.value = { ...payload }
    setDeviceConfigMessage('设备配置已保存。', 'success')
    await fetchDeviceConfiguration()
  } catch (err) {
    console.error('保存设备配置失败:', err)
    setDeviceConfigMessage(`保存设备配置失败：${err?.message || err}`, 'error')
  } finally {
    deviceConfigSaving.value = false
  }
}

async function handleReboot() {
  const ok = window.confirm('确认要重启设备吗？该操作会中断当前设备服务。')
  if (!ok) return

  rebootingDevice.value = true
  setDeviceConfigMessage('正在发送重启指令...', 'warning')

  try {
    const resp = await fetch('/api/Execution/Reboot', { method: 'POST' })
    if (!resp.ok) {
      throw new Error(`重启接口返回 ${resp.status}`)
    }
    setDeviceConfigMessage('重启指令已发送。设备可能会暂时离线，请稍后刷新查看。', 'success')
  } catch (err) {
    console.error('设备重启失败:', err)
    setDeviceConfigMessage(`设备重启失败：${err?.message || err}`, 'error')
  } finally {
    rebootingDevice.value = false
  }
}

async function handleShutdown() {
  const ok = window.confirm('确认要关闭设备吗？设备关机后需要人工重新开机。')
  if (!ok) return

  shuttingDownDevice.value = true
  setDeviceConfigMessage('正在发送关机指令...', 'warning')

  try {
    const resp = await fetch('/api/Execution/Close', { method: 'POST' })
    if (!resp.ok) {
      throw new Error(`关机接口返回 ${resp.status}`)
    }
    setDeviceConfigMessage('关机指令已发送。设备可能会很快离线。', 'success')
  } catch (err) {
    console.error('设备关机失败:', err)
    setDeviceConfigMessage(`设备关机失败：${err?.message || err}`, 'error')
  } finally {
    shuttingDownDevice.value = false
  }
}

// 载荷信息弹窗
const showPayloadModal = ref(false)
const currentPayloadData = ref(null)

const payloadSectionDefs = [
  { key: 'commType',  label: '业务类型',  color: '#1890ff', type: 'tags' },
  { key: 'signaling', label: '信令类型',  color: '#1890ff', type: 'tags' },
  { key: 'tmsi',      label: 'TMSI',    color: '#722ed1', type: 'tags' },
  { key: 'idappXYZ',  label: '播发经纬度', color: '#1890ff', type: 'tags' },
  { key: 'acars',     label: 'ACARS',   color: '#1890ff', type: 'tags' },
  { key: 'ira',       label: 'IRA',      color: '#1890ff', type: 'tags' },
  { key: 'parsedDataTags', label: '解析数据', color: '#1890ff', type: 'tags' },
  { key: 'sms',       label: '短信数据',  color: '#fa8c16', type: 'tags' },
  { key: 'voiceWavs', label: '语音通话',  color: '#52c41a', type: 'wav'  },
  { key: 'voiceInfo', label: '语音附加信息', color: '#52c41a', type: 'text' },
]

const currentPayloadSections = computed(() => {
  if (!currentPayloadData.value) return []
  // payloadSectionDefs 定义“有哪些展示区块”，
  // 这里再根据实际数据决定哪些区块真的显示出来。
  return payloadSectionDefs
    .map(def => {
      const raw = currentPayloadData.value[def.key]
      if (def.type === 'text') {
        const text = (raw || '').trim()
        return { ...def, text, values: [] }
      }
      const values = Array.isArray(raw) ? raw.filter(Boolean) : (raw ? [String(raw)] : [])
      return { ...def, values }
    })
    .filter(s => s.type === 'text' ? s.text.length > 0 : s.values.length > 0)
})

function openPayloadModal(row) {
  currentPayloadData.value = row.payloadData || null
  showPayloadModal.value = true
}

function toArr(val) {
  // 后端有时给数组，有时给单个值，甚至会给对象。
  // 统一转成数组以后，模板里渲染会简单很多。
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'object') return [JSON.stringify(val)]
  return [String(val)]
}

function toText(val) {
  // 和 toArr 类似，这里把不同类型统一成字符串，方便直接显示。
  if (val === null || val === undefined) return ''
  if (Array.isArray(val)) return val.filter(Boolean).map(v => String(v)).join('\n')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function splitMultiValueText(text) {
  // 一个字段里可能用换行、逗号、分号混着分隔多个值，这里一次性拆开。
  return String(text || '')
    .split(/[\r\n,，;；]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function normalizeTmsiValues(val) {
  // TMSI 经常出现大小写、空格不一致的问题，
  // 所以这里先标准化，再去重，避免界面显示很多“看起来不同其实相同”的值。
  const rawList = Array.isArray(val)
    ? val.flatMap(v => splitMultiValueText(typeof v === 'object' ? JSON.stringify(v) : v))
    : splitMultiValueText(typeof val === 'object' ? JSON.stringify(val) : val)

  const normalized = rawList
    .map(v => v.replace(/\s+/g, '').toUpperCase())
    .filter(Boolean)

  return [...new Set(normalized)]
}

function normalizeParsedData(raw) {
  // 解析数据字段格式最不稳定，所以这里单独做归一化。
  // 最终统一返回：
  // 1. text: 适合直接展示的大文本
  // 2. tags: 适合拆成标签的小块文本
  if (raw === null || raw === undefined) {
    return { text: '', tags: [] }
  }

  if (Array.isArray(raw)) {
    const tags = raw
      .map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .map(s => s.trim())
      .filter(Boolean)
    return { text: tags.join('\n'), tags }
  }

  if (typeof raw === 'object') {
    const tags = Object.entries(raw)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .map(s => s.trim())
      .filter(Boolean)
    return { text: tags.join('\n'), tags }
  }

  const text = toText(raw).trim()
  if (!text) return { text: '', tags: [] }
  const tags = text
    .split(/\r?\n|；|;/)
    .map(s => s.trim())
    .filter(Boolean)
  return { text, tags: tags.length ? tags : [text] }
}

// 提取结构化载荷数据
function extractPayloadData(item) {
  // 这是内容查询里很核心的一步：
  // 把后端原始字段整理成前端自己的统一结构。
  // 这样后面的弹窗、过滤、导出都可以共用同一份数据。
  const parsed = normalizeParsedData(item.payloadData ?? item.PayloadData ?? item.IdappRawLine ?? item.idappRawLine)
  const rawIsIp =
    item?.isIp ??
    item?.IsIp ??
    item?.IsIP ??
    item?.['isIp'] ??
    item?.['IsIp'] ??
    item?.['IsIP'] ??
    item?.['isIP数据'] ??
    item?.['IsIP数据'] ??
    item?.['IP数据']
  return {
    commType:   toArr(item.commType),
    signaling:  toArr(item['信令类型']),
    tmsi:       normalizeTmsiValues(item.tmsi ?? item.Tmsi ?? item.TMSI),
    idappXYZ:   toArr(item.idappXYZ ?? item.IdappXYZ),
    acars:      toArr(item.acars ?? item.Acars),
    ira:        toArr(item.ira ?? item.IRA),
    sms:        toArr(item.sms ?? item.Sms ?? item.SMS),
    ipData:     toArr(item.ipData ?? item.IPData ?? item.IpData ?? item.IpRawLine ?? item.ipRawLine),
    isIp:       rawIsIp === true || rawIsIp === 1 || String(rawIsIp ?? '').toLowerCase() === 'true' || String(rawIsIp ?? '') === '1',
    voiceWavs:  toArr(item.VoiceWavs ?? item.voiceWavs),
    voiceInfo:  (item.VoiceInfo ?? item.voiceInfo ?? '').trim(),
    parsedData: parsed.text,
    parsedDataTags: parsed.tags,
    isLowSpeedData: !!(
      item?.isLowSpeedData ??
      item?.IsLowSpeedData ??
      item?.['isLowSpeedData'] ??
      item?.['IsLowSpeedData'] ??
      item?.['低速数据'] ??
      item?.['is低速数据'] ??
      item?.['Is低速数据']
    ),
  }
}

// 格式化载荷信息为纯文本（用于列筛选）
function formatPayloadInfo(item) {
  // 表格单元格本身不直接显示这些文字，
  // 但导出、调试、以及某些扩展场景会用到这段汇总文本。
  const d = extractPayloadData(item)
  const parts = []
  if (d.commType.length) parts.push(`业务类型: ${d.commType.join(', ')}`)
  if (d.signaling.length) parts.push(`信令类型: ${d.signaling.join(', ')}`)
  if (d.tmsi.length) parts.push(`TMSI: ${d.tmsi.join(', ')}`)
  if (d.idappXYZ.length) parts.push(`播发经纬度: ${d.idappXYZ.join(', ')}`)
  if (d.acars.length) parts.push(`ACARS: ${d.acars.join(', ')}`)
  if (d.ira.length) parts.push(`IRA: ${d.ira.join(', ')}`)
  if (d.sms.length) parts.push(`短信数据: ${d.sms.join(', ')}`)
  if (d.parsedData) parts.push(`解析数据: ${d.parsedData}`)
  if (d.voiceWavs.length) parts.push(`语音通话: ${d.voiceWavs.length}条`)
  if (d.voiceInfo) parts.push(`语音附加信息: ${d.voiceInfo}`)
  return parts.join('\n')
}

function downloadWav(base64Data, chainID, index) {
  try {
    // 浏览器不能直接下载 base64 文本，需要先转成二进制 Blob。
    const binary = atob(base64Data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice_${chainID || 'unknown'}_${index + 1}.wav`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('WAV 下载失败', e)
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
    // 这里就先把后端记录加工成“界面直接可用”的结构，
    // 这样模板里只负责显示，不需要再写一堆兼容判断。
    commTableData.value = list.map(item => ({
      deviceNumber: item.deviceNumber || '',
      dataCount: `${item.device1Count ?? 0} / ${item.device2Count ?? 0} / ${item.device3Count ?? 0}`,
      startTime: formatDisplayPlus8(item.startTime),
      endTime: formatDisplayPlus8(item.endTime),
      duration: parseDurationToSeconds(item.duration),
      imei: item.imei || '',
      payloadInfo: formatPayloadInfo(item),
      payloadData: extractPayloadData(item),
      locationLatLon: formatLocationLatLon(item),
      chainID: item.chainID || ''
    }))
  } catch (err) {
    console.error('获取通信事件失败:', err)
  }
}

// 内容查询
async function handleFileQuery() {
  if (!fileQueryStartTime.value || !fileQueryEndTime.value) return

  // 重新查询时清空列过滤。
  // 否则用户改了时间范围之后，还会被旧的列筛选条件继续限制。
  fileQueryColumns.forEach(c => { if (fileQueryFilters[c.key]) fileQueryFilters[c.key].clear() })
  activeFilterCol.value = null
  fileQueryPage.value = 1

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
    // 和实时位置表一样，先把接口数据整理成前端自己的统一结构。
    fileQueryTableData.value = list.map(item => ({
      deviceNumber: item.deviceNumber || '',
      dataCount: `${item.device1Count ?? 0} / ${item.device2Count ?? 0} / ${item.device3Count ?? 0}`,
      startTime: formatDisplayPlus8(item.startTime),
      endTime: formatDisplayPlus8(item.endTime),
      duration: parseDurationToSeconds(item.duration),
      imei: item.imei || '',
      payloadInfo: formatPayloadInfo(item),
      payloadData: extractPayloadData(item),
      locationLatLon: formatLocationLatLon(item),
      chainID: item.chainID || ''
    }))
  } catch (err) {
    console.error('内容查询失败:', err)
  } finally {
    loading.value = false
  }
}

function csvEscape(val) {
  // CSV 里如果包含逗号、双引号、换行，必须转义，否则 Excel 打开会错列。
  const s = String(val ?? '')
    .replace(/\r?\n+/g, ' | ')
    .trim()
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function normalizeExportCell(key, val) {
  // 个别列在导出时需要稍微“洗一下”文本，避免出现多余分隔符。
  const text = String(val ?? '')
  if (key === 'deviceNumber') {
    return text.replace(/[，,]+/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return text
}

function handleFileQueryExport() {
  // 导出的是“当前筛选结果”，而不是原始全部数据。
  // 所以这里要基于 fileQueryFilteredData，而不是 fileQueryTableData。
  const cols = fileQueryColumns
  const header = cols.map(c => csvEscape(c.label)).join(',')
  const rows = fileQueryFilteredData.value.map(row =>
    cols.map(c => csvEscape(normalizeExportCell(c.key, row?.[c.key] ?? ''))).join(',')
  )
  const csv = [header, ...rows].join('\r\n')

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `content_query_${ts}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileQueryReset() {
  // 这个函数现在主要给初始化和未来扩展用。
  // 如果后面你加了更多查询条件，记得在这里一起恢复默认值。
  initFileQueryTime()
  fileQueryOnlyUl.value = true
  fileQueryOnlyImei.value = true
  fileQueryOnlyLocation.value = true
  fileQueryTableData.value = []
  fileQueryPage.value = 1
  fileQueryColumns.forEach(c => fileQueryFilters[c.key] = new Set())
  // 重置时把所有前端勾选过滤恢复到默认态，避免切页后沿用旧条件。
  payloadFilterLocationLatLon.value = false
  payloadFilterSignaling.value = false
  payloadFilterIdappXYZ.value = false
  payloadFilterAircraft.value = false
  payloadFilterVoice.value = false
  payloadFilterSms.value = false
  payloadFilterIp.value = false
  payloadFilterLowSpeed.value = false
  payloadFilterIdapp.value = false
  fileQueryImeiFilter.value = ''
}

function initFileQueryTime() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
  fileQueryEndTime.value = formatDateTimeLocal(now)
  fileQueryStartTime.value = formatDateTimeLocal(oneHourAgo)
}

function openMeshPage(deviceNum) {
  window.open(`http://192.168.104.${deviceNum}/`, '_blank')
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
    const isRealtime = searchQueryMode.value === 'realtime'
    startTime = searchStartTime.value
    endTime = searchEndTime.value
    locateByComm = isRealtime ? 'true' : 'false'
    locateByImei = searchTerminalId.value ? 'true' : 'false'
    targetImei = searchTerminalId.value || ''
  } else {
    return
  }

  const isRealtimeExport = activeMenu.value === 0
    ? queryMode.value === 'realtime'
    : searchQueryMode.value === 'realtime'
  const stepSecondExport = activeMenu.value === 0 ? calStepSecond.value : searchCalStepSecond.value

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    LocateByCoummounication: locateByComm,
    LocateByImeiOrTmsi: locateByImei,
    TargetImeiOrTmsi: targetImei,
    isshowdevice: 'true',
    ...(isRealtimeExport ? {} : { CalStepSecond: stepSecondExport })
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
