<template>
  <section class="table-panel">
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>设备号</th>
            <th>识别码</th>
            <th>通信起始时间</th>
            <th>通信截止时间</th>
            <th>通信时长(秒)</th>
            <th>IMEI</th>
            <th>定位经纬度</th>
            <th>载荷信息</th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in commTableData" :key="i">
            <td>{{ row.deviceNumber }}</td>
            <td>{{ row.chainID }}</td>
            <td>{{ row.startTime }}</td>
            <td>{{ row.endTime }}</td>
            <td>{{ row.duration }}</td>
            <td>{{ row.imei }}</td>
            <td>
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
            </td>
            <td>
              <button class="payload-btn" @click="emit('open-payload-modal', row)">查看载荷</button>
            </td>
            <td>
              <div class="detail-actions">
                <button class="detail-btn" @click="emit('show-lcw-detail', row)">查看</button>
                <button class="detail-export-btn" @click="emit('export-lcw-detail', row)">导出</button>
              </div>
            </td>
          </tr>
          <tr v-if="commTableData.length === 0">
            <td colspan="9" class="empty-row">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
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
