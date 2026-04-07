<template>
  <section class="map-container">
    <div id="map"></div>

    <div v-if="activeMenu === 0" class="map-controls">
      <select v-model="queryModeModel" class="map-select">
        <option value="realtime">实时模式</option>
        <option value="highprecision">高精度模式</option>
      </select>
      <select
        v-model="calStepSecondModel"
        class="map-select"
        :disabled="queryModeModel === 'realtime'"
        :title="queryModeModel === 'realtime' ? '实时定位模式无效' : 'CalStepSecond'"
      >
        <option value="30">30s</option>
        <option value="60">1min</option>
        <option value="120">2min</option>
        <option value="300">5min</option>
        <option value="600">10min</option>
        <option value="1800">30min</option>
        <option value="3600">60min</option>
      </select>
      <select v-model="timeRangeModel" class="map-select">
        <option value="1hour">1hour</option>
        <option value="2hour">2hour</option>
        <option value="6hour">6hour</option>
        <option value="12hour">12hour</option>
        <option value="24hour">24hour</option>
      </select>
      <button class="query-btn" @click="emit('realtime-query')">查 询</button>
      <span class="countdown-badge">{{ countdown }}s</span>
      <button class="export-btn" @click="emit('export')">导 出</button>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">数据加载中..</span>
    </div>

    <div v-if="activeMenu === 2" class="map-controls-bar">
      <select v-model="searchQueryModeModel" class="map-select">
        <option value="realtime">实时模式</option>
        <option value="highprecision">高精度模式</option>
      </select>
      <select
        v-model="searchCalStepSecondModel"
        class="map-select"
        :disabled="searchQueryModeModel === 'realtime'"
        :title="searchQueryModeModel === 'realtime' ? '实时定位模式无效' : 'CalStepSecond'"
      >
        <option value="30">30s</option>
        <option value="60">1min</option>
        <option value="120">2min</option>
        <option value="300">5min</option>
        <option value="600">10min</option>
        <option value="1800">30min</option>
        <option value="3600">60min</option>
      </select>
      <input type="datetime-local" v-model="searchStartTimeModel" class="datetime-input" step="1" />
      <span class="datetime-arrow">→</span>
      <input type="datetime-local" v-model="searchEndTimeModel" class="datetime-input" step="1" />
      <input type="text" v-model="searchTerminalIdModel" class="terminal-input" placeholder="请输入终端ID" />
      <button class="query-btn" @click="emit('search')">查询</button>
      <button class="export-btn" @click="emit('export')">导出</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

// 地图区域本身由父组件里的 Leaflet 逻辑控制，
// 这里主要负责顶部查询条、按钮和 loading 状态的展示。
const props = defineProps({
  activeMenu: {
    type: Number,
    default: 0,
  },
  queryMode: {
    type: String,
    default: 'realtime',
  },
  calStepSecond: {
    type: String,
    default: '60',
  },
  timeRange: {
    type: String,
    default: '2hour',
  },
  countdown: {
    type: Number,
    default: 60,
  },
  searchQueryMode: {
    type: String,
    default: 'realtime',
  },
  searchCalStepSecond: {
    type: String,
    default: '60',
  },
  searchStartTime: {
    type: String,
    default: '',
  },
  searchEndTime: {
    type: String,
    default: '',
  },
  searchTerminalId: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:queryMode',
  'update:calStepSecond',
  'update:timeRange',
  'update:searchQueryMode',
  'update:searchCalStepSecond',
  'update:searchStartTime',
  'update:searchEndTime',
  'update:searchTerminalId',
  'realtime-query',
  'search',
  'export',
])

// 这一组 computed 是“v-model 代理层”：
// 子组件读 props，修改时通过 emit 告诉父组件去更新真正的状态。
const queryModeModel = computed({
  get: () => props.queryMode,
  set: value => emit('update:queryMode', value),
})

const calStepSecondModel = computed({
  get: () => props.calStepSecond,
  set: value => emit('update:calStepSecond', value),
})

const timeRangeModel = computed({
  get: () => props.timeRange,
  set: value => emit('update:timeRange', value),
})

const searchQueryModeModel = computed({
  get: () => props.searchQueryMode,
  set: value => emit('update:searchQueryMode', value),
})

const searchCalStepSecondModel = computed({
  get: () => props.searchCalStepSecond,
  set: value => emit('update:searchCalStepSecond', value),
})

const searchStartTimeModel = computed({
  get: () => props.searchStartTime,
  set: value => emit('update:searchStartTime', value),
})

const searchEndTimeModel = computed({
  get: () => props.searchEndTime,
  set: value => emit('update:searchEndTime', value),
})

const searchTerminalIdModel = computed({
  get: () => props.searchTerminalId,
  set: value => emit('update:searchTerminalId', value),
})
</script>
