<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="column-filter-dropdown"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      @click.stop
    >
      <a-input
        :value="searchText"
        placeholder="搜索..."
        size="small"
        allow-clear
        style="margin-bottom: 8px"
        @update:value="v => emit('update:searchText', v)"
      />
      <div style="margin-bottom: 8px">
        <a-space :size="4">
          <a-button type="link" size="small" @click="emit('select-all')">全选</a-button>
          <a-button type="link" size="small" @click="emit('clear-all')">清除</a-button>
        </a-space>
      </div>
      <div class="filter-options-list">
        <div v-for="val in options" :key="val" class="filter-option-item">
          <a-checkbox
            :checked="selectedValues?.has?.(val)"
            @change="emit('toggle-value', val)"
          >
            {{ val || '(空)' }}
          </a-checkbox>
        </div>
        <a-empty v-if="options.length === 0" :image="null" description="无匹配项" />
      </div>
      <div style="margin-top: 8px; text-align: right">
        <a-button type="primary" size="small" @click="emit('close')">确定</a-button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) },
  searchText: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  selectedValues: { type: Object, default: null },
})

const emit = defineEmits([
  'update:searchText',
  'select-all',
  'clear-all',
  'toggle-value',
  'close',
])
</script>

<style scoped>
.column-filter-dropdown {
  position: fixed;
  z-index: 1050;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  padding: 12px;
  min-width: 180px;
  max-width: 300px;
}
.filter-options-list {
  max-height: 240px;
  overflow-y: auto;
}
.filter-option-item {
  padding: 2px 0;
}
</style>
