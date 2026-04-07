<template>
  <div class="file-query-page">
    <a-card :bordered="false" size="small">
      <div class="query-bar">
        <input
          type="datetime-local"
          :value="fileQueryStartTime"
          @input="emit('update:fileQueryStartTime', $event.target.value)"
          class="native-datetime"
          step="1"
        />
        <span style="color: #999; flex-shrink: 0">→</span>
        <input
          type="datetime-local"
          :value="fileQueryEndTime"
          @input="emit('update:fileQueryEndTime', $event.target.value)"
          class="native-datetime"
          step="1"
        />
        <a-checkbox :checked="fileQueryOnlyUl" @update:checked="v => emit('update:fileQueryOnlyUl', v)">包含上行</a-checkbox>
        <a-checkbox :checked="fileQueryOnlyImei" @update:checked="v => emit('update:fileQueryOnlyImei', v)">仅IMEI</a-checkbox>
        <a-input
          :value="fileQueryImeiFilter"
          @update:value="v => emit('update:fileQueryImeiFilter', v)"
          placeholder="IMEI过滤..."
          style="width: 150px"
          size="small"
          allow-clear
        />
        <a-button type="primary" size="small" @click="emit('query')">查 询</a-button>
        <a-button size="small" @click="emit('export')">导出</a-button>
      </div>

      <div class="payload-filter-bar">
        <span style="font-weight: 500; color: #666; flex-shrink: 0">载荷过滤：</span>
        <a-checkbox :checked="payloadFilterLocationLatLon" @update:checked="v => emit('update:payloadFilterLocationLatLon', v)">定位经纬度</a-checkbox>
        <a-checkbox :checked="payloadFilterSignaling" @update:checked="v => emit('update:payloadFilterSignaling', v)">信令类型</a-checkbox>
        <a-checkbox :checked="payloadFilterIdappXYZ" @update:checked="v => emit('update:payloadFilterIdappXYZ', v)">播发经纬度</a-checkbox>
        <a-checkbox :checked="payloadFilterAircraft" @update:checked="v => emit('update:payloadFilterAircraft', v)">ACARS</a-checkbox>
        <a-checkbox :checked="payloadFilterVoice" @update:checked="v => emit('update:payloadFilterVoice', v)">语音通话</a-checkbox>
        <a-checkbox :checked="payloadFilterSms" @update:checked="v => emit('update:payloadFilterSms', v)">短信数据</a-checkbox>
        <a-checkbox :checked="payloadFilterIp" @update:checked="v => emit('update:payloadFilterIp', v)">IP数据</a-checkbox>
        <a-checkbox :checked="payloadFilterLowSpeed" @update:checked="v => emit('update:payloadFilterLowSpeed', v)">低速数据</a-checkbox>
        <a-checkbox :checked="payloadFilterIdapp" @update:checked="v => emit('update:payloadFilterIdapp', v)">解析数据</a-checkbox>
      </div>
    </a-card>

    <a-spin :spinning="loading" tip="数据加载中..">
      <a-table
        :columns="antColumns"
        :data-source="fileQueryPagedData"
        :pagination="false"
        size="small"
        :scroll="{ x: 'max-content' }"
        bordered
        row-key="chainID"
        style="margin-top: 12px"
      >
        <template #headerCell="{ column }">
          <span>{{ column.title }}</span>
          <a-button
            v-if="!column.noFilter"
            type="text"
            size="small"
            :class="{ 'filter-btn-active': fileQueryFilters[column.key]?.size > 0 }"
            @click.stop="emit('toggle-filter-dropdown', column.key, $event)"
            style="padding: 0 4px; margin-left: 4px"
          >
            <FilterOutlined :style="{ fontSize: '11px', color: fileQueryFilters[column.key]?.size > 0 ? '#1890ff' : '#bfbfbf' }" />
          </a-button>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'payloadInfo'">
            <a-button type="link" size="small" @click="emit('open-payload-modal', record)">查看载荷</a-button>
          </template>
          <template v-else-if="column.key === 'locationLatLon'">
            <span>{{ record.locationLatLon || '-' }}</span>
            <a-button
              v-if="record.locationLatLon"
              type="link"
              size="small"
              @click="emit('open-location-preview', record)"
            >查看</a-button>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="emit('show-lcw-detail', record)">查看</a-button>
              <a-button type="link" size="small" @click="emit('export-lcw-detail', record)">导出</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-spin>

    <div v-if="fileQueryFilteredData.length > 0" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center">
      <span style="color: #666; font-size: 13px">
        共 {{ fileQueryFilteredData.length }} 条，第 {{ fileQueryPage }}/{{ fileQueryTotalPages }} 页
      </span>
      <a-pagination
        :current="fileQueryPage"
        :total="fileQueryFilteredData.length"
        :page-size="50"
        size="small"
        show-quick-jumper
        @change="p => emit('update:fileQueryPage', p)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FilterOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  fileQueryStartTime: { type: String, default: '' },
  fileQueryEndTime: { type: String, default: '' },
  fileQueryOnlyUl: { type: Boolean, default: true },
  fileQueryOnlyImei: { type: Boolean, default: true },
  fileQueryImeiFilter: { type: String, default: '' },
  payloadFilterLocationLatLon: { type: Boolean, default: false },
  payloadFilterSignaling: { type: Boolean, default: false },
  payloadFilterIdappXYZ: { type: Boolean, default: false },
  payloadFilterAircraft: { type: Boolean, default: false },
  payloadFilterVoice: { type: Boolean, default: false },
  payloadFilterSms: { type: Boolean, default: false },
  payloadFilterIp: { type: Boolean, default: false },
  payloadFilterLowSpeed: { type: Boolean, default: false },
  payloadFilterIdapp: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  fileQueryColumns: { type: Array, default: () => [] },
  fileQueryFilters: { type: Object, required: true },
  fileQueryPagedData: { type: Array, default: () => [] },
  fileQueryFilteredData: { type: Array, default: () => [] },
  fileQueryPage: { type: Number, default: 1 },
  fileQueryTotalPages: { type: Number, default: 1 },
  fileQueryVisiblePages: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:fileQueryStartTime',
  'update:fileQueryEndTime',
  'update:fileQueryOnlyUl',
  'update:fileQueryOnlyImei',
  'update:fileQueryImeiFilter',
  'update:payloadFilterLocationLatLon',
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

const antColumns = computed(() => {
  const cols = props.fileQueryColumns.map(col => ({
    title: col.label,
    dataIndex: col.key,
    key: col.key,
    width: parseInt(col.width) || 120,
    noFilter: col.noFilter,
    ellipsis: true,
    align: 'center',
  }))
  cols.push({ title: '详情', key: 'actions', width: 120, noFilter: true, align: 'center' })
  return cols
})
</script>

<style scoped>
.query-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}
.payload-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.native-datetime {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
  outline: none;
  flex-shrink: 0;
  width: 200px;
}
.native-datetime:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.filter-btn-active {
  background: rgba(24, 144, 255, 0.1) !important;
}
</style>
