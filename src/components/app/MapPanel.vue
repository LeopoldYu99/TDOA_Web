<template>
  <section class="map-container">
    <div id="map"></div>

    <div v-if="activeMenu === 0" class="map-controls">
      <div class="controls-row">
        <a-select v-model:value="queryModeModel" style="width: 120px" size="small">
          <a-select-option value="realtime">实时模式</a-select-option>
          <a-select-option value="highprecision">高精度模式</a-select-option>
        </a-select>
        <a-select
          v-model:value="calStepSecondModel"
          style="width: 90px"
          size="small"
          :disabled="queryModeModel === 'realtime'"
          :title="queryModeModel === 'realtime' ? '实时定位模式无效' : 'CalStepSecond'"
        >
          <a-select-option value="30">30s</a-select-option>
          <a-select-option value="60">1min</a-select-option>
          <a-select-option value="120">2min</a-select-option>
          <a-select-option value="300">5min</a-select-option>
          <a-select-option value="600">10min</a-select-option>
          <a-select-option value="1800">30min</a-select-option>
          <a-select-option value="3600">60min</a-select-option>
        </a-select>
        <a-select v-model:value="timeRangeModel" style="width: 100px" size="small">
          <a-select-option value="1hour">1hour</a-select-option>
          <a-select-option value="2hour">2hour</a-select-option>
          <a-select-option value="6hour">6hour</a-select-option>
          <a-select-option value="12hour">12hour</a-select-option>
          <a-select-option value="24hour">24hour</a-select-option>
        </a-select>
        <a-button type="primary" size="small" @click="emit('realtime-query')">查 询</a-button>
        <a-badge :count="countdown" :number-style="{ backgroundColor: '#1890ff' }" :overflow-count="999">
          <span style="display:inline-block;width:8px"></span>
        </a-badge>
        <a-button size="small" @click="emit('export')">导 出</a-button>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <a-spin size="large" tip="数据加载中.." />
    </div>

    <div v-if="activeMenu === 2" class="map-controls-bar">
      <div class="controls-row">
        <a-select v-model:value="searchQueryModeModel" style="width: 120px" size="small">
          <a-select-option value="realtime">实时模式</a-select-option>
          <a-select-option value="highprecision">高精度模式</a-select-option>
        </a-select>
        <a-select
          v-model:value="searchCalStepSecondModel"
          style="width: 90px"
          size="small"
          :disabled="searchQueryModeModel === 'realtime'"
          :title="searchQueryModeModel === 'realtime' ? '实时定位模式无效' : 'CalStepSecond'"
        >
          <a-select-option value="30">30s</a-select-option>
          <a-select-option value="60">1min</a-select-option>
          <a-select-option value="120">2min</a-select-option>
          <a-select-option value="300">5min</a-select-option>
          <a-select-option value="600">10min</a-select-option>
          <a-select-option value="1800">30min</a-select-option>
          <a-select-option value="3600">60min</a-select-option>
        </a-select>
        <input
          type="datetime-local"
          :value="searchStartTime"
          @input="emit('update:searchStartTime', $event.target.value)"
          class="native-datetime"
          step="1"
        />
        <span style="color: #999; flex-shrink: 0">→</span>
        <input
          type="datetime-local"
          :value="searchEndTime"
          @input="emit('update:searchEndTime', $event.target.value)"
          class="native-datetime"
          step="1"
        />
        <a-input
          :value="searchTerminalId"
          @update:value="v => emit('update:searchTerminalId', v)"
          placeholder="请输入终端ID"
          style="width: 140px"
          size="small"
        />
        <a-button type="primary" size="small" @click="emit('search')">查询</a-button>
        <a-button size="small" @click="emit('export')">导出</a-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeMenu: { type: Number, default: 0 },
  queryMode: { type: String, default: 'realtime' },
  calStepSecond: { type: String, default: '60' },
  timeRange: { type: String, default: '2hour' },
  countdown: { type: Number, default: 60 },
  searchQueryMode: { type: String, default: 'realtime' },
  searchCalStepSecond: { type: String, default: '60' },
  searchStartTime: { type: String, default: '' },
  searchEndTime: { type: String, default: '' },
  searchTerminalId: { type: String, default: '' },
  loading: { type: Boolean, default: false },
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
</script>

<style scoped>
.map-container {
  position: relative;
  height: calc(100vh - 48px - 24px - 290px);
  min-height: 380px;
  flex-shrink: 0;
}
#map {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}
.controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  flex-wrap: nowrap;
}
.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.map-controls-bar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  z-index: 999;
  border-radius: 8px;
}
.native-datetime {
  height: 24px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
  outline: none;
  flex-shrink: 0;
  width: 190px;
}
.native-datetime:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
