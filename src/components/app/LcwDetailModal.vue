<template>
  <div v-if="visible" class="trajectory-modal-overlay" @click.self="emit('close')">
    <div class="trajectory-modal" style="width:90vw;height:80vh;">
      <div class="trajectory-modal-header">
        <span>LCW 详情</span>
        <button class="trajectory-modal-close" @click="emit('close')">&times;</button>
      </div>
      <div class="trajectory-modal-body" style="overflow:auto;">
        <div
          v-if="loading"
          class="loading-overlay"
          style="position:relative;height:100%;display:flex;align-items:center;justify-content:center;"
        >
          <div class="loading-spinner"></div>
          <span class="loading-text">加载中..</span>
        </div>
        <div v-else class="lcw-detail-wrapper">
          <table class="device-table lcw-detail-table" style="width:100%;">
            <thead>
              <tr>
                <th v-for="col in lcwDetailColumns" :key="col.key" class="filterable-th">
                  <span>{{ col.label }}</span>
                  <button
                    class="filter-icon-btn"
                    :class="{ 'filter-active': lcwDetailFilters[col.key]?.size > 0 }"
                    @click.stop="emit('toggle-filter-dropdown', col.key, $event)"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in lcwDetailFilteredData" :key="i">
                <td
                  v-for="col in lcwDetailColumns"
                  :key="col.key"
                  :style="col.key === 'rawLine' ? 'text-align:left;word-break:break-all;' : ''"
                >
                  {{ row[col.key] }}
                </td>
              </tr>
              <tr v-if="lcwDetailFilteredData.length === 0 && !loading">
                <td :colspan="lcwDetailColumns.length" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  lcwDetailColumns: {
    type: Array,
    default: () => [],
  },
  lcwDetailFilters: {
    type: Object,
    required: true,
  },
  lcwDetailFilteredData: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'toggle-filter-dropdown'])
</script>
