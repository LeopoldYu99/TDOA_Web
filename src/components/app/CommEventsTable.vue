<template>
  <a-card title="通信事件" :bordered="false" size="small" class="comm-events-card">
    <a-table
      :columns="columns"
      :data-source="commTableData"
      :pagination="false"
      size="small"
      :scroll="{ y: 240 }"
      row-key="chainID"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'locationLatLon'">
          <span>{{ record.locationLatLon || '-' }}</span>
          <a-button
            v-if="record.locationLatLon"
            type="link"
            size="small"
            @click="emit('open-location-preview', record)"
          >查看</a-button>
        </template>
        <template v-else-if="column.key === 'payloadInfo'">
          <a-button type="link" size="small" @click="emit('open-payload-modal', record)">查看载荷</a-button>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button type="link" size="small" @click="emit('show-lcw-detail', record)">查看</a-button>
            <a-button type="link" size="small" @click="emit('export-lcw-detail', record)">导出</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup>
const columns = [
  { title: '设备号', dataIndex: 'deviceNumber', key: 'deviceNumber', width: 80 },
  { title: '识别码', dataIndex: 'chainID', key: 'chainID', width: 150, ellipsis: true },
  { title: '通信起始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
  { title: '通信截止时间', dataIndex: 'endTime', key: 'endTime', width: 160 },
  { title: '通信时长(秒)', dataIndex: 'duration', key: 'duration', width: 100 },
  { title: 'IMEI', dataIndex: 'imei', key: 'imei', width: 130 },
  { title: '定位经纬度', dataIndex: 'locationLatLon', key: 'locationLatLon', width: 200 },
  { title: '载荷信息', key: 'payloadInfo', width: 90 },
  { title: '详情', key: 'actions', width: 120 },
]

defineProps({
  commTableData: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'open-location-preview',
  'open-payload-modal',
  'show-lcw-detail',
  'export-lcw-detail',
])
</script>

<style scoped>
.comm-events-card {
  margin-top: 12px;
  flex-shrink: 0;
}
</style>
