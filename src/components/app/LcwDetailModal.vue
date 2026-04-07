<template>
  <a-modal
    :open="visible"
    title="LCW 详情"
    :footer="null"
    :width="'90vw'"
    :body-style="{ height: '70vh', overflow: 'auto', padding: '12px' }"
    destroy-on-close
    :animation="false"
    :mask-animation="false"
    @cancel="emit('close')"
  >
    <a-spin :spinning="loading" tip="加载中..">
      <a-table
        :columns="antColumns"
        :data-source="lcwDetailFilteredData"
        :pagination="{ pageSize: 100, size: 'small', showTotal: total => `共 ${total} 条`, showQuickJumper: true }"
        size="small"
        bordered
        :scroll="{ y: 'calc(70vh - 120px)' }"
      >
        <template #headerCell="{ column }">
          <span>{{ column.title }}</span>
          <a-button
            type="text"
            size="small"
            :class="{ 'filter-btn-active': lcwDetailFilters[column.key]?.size > 0 }"
            @click.stop="emit('toggle-filter-dropdown', column.key, $event)"
            style="padding: 0 4px; margin-left: 4px"
          >
            <FilterOutlined :style="{ fontSize: '11px', color: lcwDetailFilters[column.key]?.size > 0 ? '#1890ff' : '#bfbfbf' }" />
          </a-button>
        </template>
        <template #bodyCell="{ column, text }">
          <template v-if="column.key === 'rawLine'">
            <span style="white-space: nowrap">{{ text }}</span>
          </template>
        </template>
      </a-table>
    </a-spin>
  </a-modal>
</template>

<script setup>
import { computed } from 'vue'
import { FilterOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  lcwDetailColumns: { type: Array, default: () => [] },
  lcwDetailFilters: { type: Object, required: true },
  lcwDetailFilteredData: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'toggle-filter-dropdown'])

const antColumns = computed(() =>
  props.lcwDetailColumns.map(col => ({
    title: col.label,
    dataIndex: col.key,
    key: col.key,
    ellipsis: true,
    width: col.key === 'rawLine' ? 400 : undefined,
    align: 'center',
  }))
)
</script>

<style scoped>
.filter-btn-active {
  background: rgba(24, 144, 255, 0.1) !important;
}
</style>
