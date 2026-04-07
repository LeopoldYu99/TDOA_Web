<template>
  <section class="file-query-page">
    <div class="file-query-bar">
      <input type="datetime-local" v-model="fileQueryStartTimeModel" class="datetime-input" step="1" />
      <span class="datetime-arrow">→</span>
      <input type="datetime-local" v-model="fileQueryEndTimeModel" class="datetime-input" step="1" />
      <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyUlModel" /> 包含上行</label>
      <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyImeiModel" /> 仅IMEI</label>
      <input type="text" v-model="fileQueryImeiFilterModel" class="imei-filter-input" placeholder="IMEI过滤..." />
      <button class="query-btn" @click="emit('query')">查 询</button>
      <button class="export-btn" @click="emit('export')">导出</button>
    </div>

    <div class="payload-filter-bar">
      <span class="payload-filter-title">载荷过滤：</span>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterCommTypeModel" /> 业务类型</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterSignalingModel" /> 信令类型</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterIdappXYZModel" /> 播发经纬度</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterAircraftModel" /> ACARS</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterVoiceModel" /> 语音通话</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterSmsModel" /> 短信数据</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterIpModel" /> IP数据</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterLowSpeedModel" /> 低速数据</label>
      <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterIdappModel" /> 解析数据</label>
    </div>

    <div v-if="loading" class="loading-overlay static-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">数据加载中..</span>
    </div>

    <div class="file-query-table-wrapper">
      <table class="device-table file-query-fixed-table">
        <colgroup>
          <col v-for="col in fileQueryColumns" :key="col.key" :style="{ width: col.width }" />
          <col style="width:110px" />
        </colgroup>
        <thead>
          <tr>
            <th v-for="col in fileQueryColumns" :key="col.key" class="filterable-th">
              <span>{{ col.label }}</span>
              <button
                v-if="!col.noFilter"
                class="filter-icon-btn"
                :class="{ 'filter-active': fileQueryFilters[col.key]?.size > 0 }"
                @click.stop="emit('toggle-filter-dropdown', col.key, $event)"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </button>
            </th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in fileQueryPagedData" :key="i">
            <td v-for="col in fileQueryColumns" :key="col.key">
              <button
                v-if="col.key === 'payloadInfo'"
                class="payload-btn"
                @click="emit('open-payload-modal', row)"
              >
                查看载荷
              </button>
              <template v-else-if="col.key === 'locationLatLon'">
                <div class="latlon-cell">
                  <span class="latlon-text">{{ row.locationLatLon || '-' }}</span>
                  <button
                    v-if="row.locationLatLon"
                    class="location-view-btn"
                    @click="emit('open-location-preview', row)"
                  >
                    查看
                  </button>
                </div>
              </template>
              <template v-else>{{ row[col.key] }}</template>
            </td>
            <td>
              <div class="detail-actions">
                <button class="detail-btn" @click="emit('show-lcw-detail', row)">查看</button>
                <button class="detail-export-btn" @click="emit('export-lcw-detail', row)">导出</button>
              </div>
            </td>
          </tr>
          <tr v-if="fileQueryFilteredData.length === 0">
            <td :colspan="fileQueryColumns.length + 1" class="empty-row">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="fileQueryFilteredData.length > 0" class="pagination">
      <span class="page-info">共 {{ fileQueryFilteredData.length }} 条，第 {{ fileQueryPage }}/{{ fileQueryTotalPages }} 页</span>
      <div class="page-btns">
        <button class="page-btn" :disabled="fileQueryPage <= 1" @click="setPage(1)">首页</button>
        <button class="page-btn" :disabled="fileQueryPage <= 1" @click="setPage(fileQueryPage - 1)">&lt;</button>
        <template v-for="p in fileQueryVisiblePages" :key="p">
          <button class="page-btn" :class="{ 'page-active': p === fileQueryPage }" @click="setPage(p)">{{ p }}</button>
        </template>
        <button class="page-btn" :disabled="fileQueryPage >= fileQueryTotalPages" @click="setPage(fileQueryPage + 1)">&gt;</button>
        <button class="page-btn" :disabled="fileQueryPage >= fileQueryTotalPages" @click="setPage(fileQueryTotalPages)">末页</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fileQueryStartTime: {
    type: String,
    default: '',
  },
  fileQueryEndTime: {
    type: String,
    default: '',
  },
  fileQueryOnlyUl: {
    type: Boolean,
    default: true,
  },
  fileQueryOnlyImei: {
    type: Boolean,
    default: true,
  },
  fileQueryImeiFilter: {
    type: String,
    default: '',
  },
  payloadFilterCommType: {
    type: Boolean,
    default: false,
  },
  payloadFilterSignaling: {
    type: Boolean,
    default: false,
  },
  payloadFilterIdappXYZ: {
    type: Boolean,
    default: false,
  },
  payloadFilterAircraft: {
    type: Boolean,
    default: false,
  },
  payloadFilterVoice: {
    type: Boolean,
    default: false,
  },
  payloadFilterSms: {
    type: Boolean,
    default: false,
  },
  payloadFilterIp: {
    type: Boolean,
    default: false,
  },
  payloadFilterLowSpeed: {
    type: Boolean,
    default: false,
  },
  payloadFilterIdapp: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  fileQueryColumns: {
    type: Array,
    default: () => [],
  },
  fileQueryFilters: {
    type: Object,
    required: true,
  },
  fileQueryPagedData: {
    type: Array,
    default: () => [],
  },
  fileQueryFilteredData: {
    type: Array,
    default: () => [],
  },
  fileQueryPage: {
    type: Number,
    default: 1,
  },
  fileQueryTotalPages: {
    type: Number,
    default: 1,
  },
  fileQueryVisiblePages: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:fileQueryStartTime',
  'update:fileQueryEndTime',
  'update:fileQueryOnlyUl',
  'update:fileQueryOnlyImei',
  'update:fileQueryImeiFilter',
  'update:payloadFilterCommType',
  'update:payloadFilterSignaling',
  'update:payloadFilterIdappXYZ',
  'update:payloadFilterAircraft',
  'update:payloadFilterVoice',
  'update:payloadFilterSms',
  'update:payloadFilterIp',
  'update:payloadFilterLowSpeed',
  'update:payloadFilterIdapp',
  'update:fileQueryPage',
  'query',
  'export',
  'toggle-filter-dropdown',
  'open-payload-modal',
  'open-location-preview',
  'show-lcw-detail',
  'export-lcw-detail',
])

const fileQueryStartTimeModel = computed({
  get: () => props.fileQueryStartTime,
  set: value => emit('update:fileQueryStartTime', value),
})

const fileQueryEndTimeModel = computed({
  get: () => props.fileQueryEndTime,
  set: value => emit('update:fileQueryEndTime', value),
})

const fileQueryOnlyUlModel = computed({
  get: () => props.fileQueryOnlyUl,
  set: value => emit('update:fileQueryOnlyUl', value),
})

const fileQueryOnlyImeiModel = computed({
  get: () => props.fileQueryOnlyImei,
  set: value => emit('update:fileQueryOnlyImei', value),
})

const fileQueryImeiFilterModel = computed({
  get: () => props.fileQueryImeiFilter,
  set: value => emit('update:fileQueryImeiFilter', value),
})

const payloadFilterCommTypeModel = computed({
  get: () => props.payloadFilterCommType,
  set: value => emit('update:payloadFilterCommType', value),
})

const payloadFilterSignalingModel = computed({
  get: () => props.payloadFilterSignaling,
  set: value => emit('update:payloadFilterSignaling', value),
})

const payloadFilterIdappXYZModel = computed({
  get: () => props.payloadFilterIdappXYZ,
  set: value => emit('update:payloadFilterIdappXYZ', value),
})

const payloadFilterAircraftModel = computed({
  get: () => props.payloadFilterAircraft,
  set: value => emit('update:payloadFilterAircraft', value),
})

const payloadFilterVoiceModel = computed({
  get: () => props.payloadFilterVoice,
  set: value => emit('update:payloadFilterVoice', value),
})

const payloadFilterSmsModel = computed({
  get: () => props.payloadFilterSms,
  set: value => emit('update:payloadFilterSms', value),
})

const payloadFilterIpModel = computed({
  get: () => props.payloadFilterIp,
  set: value => emit('update:payloadFilterIp', value),
})

const payloadFilterLowSpeedModel = computed({
  get: () => props.payloadFilterLowSpeed,
  set: value => emit('update:payloadFilterLowSpeed', value),
})

const payloadFilterIdappModel = computed({
  get: () => props.payloadFilterIdapp,
  set: value => emit('update:payloadFilterIdapp', value),
})

function setPage(page) {
  emit('update:fileQueryPage', page)
}
</script>
