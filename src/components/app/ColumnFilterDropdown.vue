<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="filter-dropdown"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      @click.stop
    >
      <input
        type="text"
        class="filter-search"
        :value="searchText"
        placeholder="搜索..."
        @input="emit('update:searchText', $event.target.value)"
      />
      <div class="filter-actions">
        <button @click="emit('select-all')">全选</button>
        <button @click="emit('clear-all')">清除</button>
      </div>
      <div class="filter-options">
        <label
          v-for="val in options"
          :key="val"
          class="filter-option"
        >
          <input
            type="checkbox"
            :checked="selectedValues?.has?.(val)"
            @change="emit('toggle-value', val)"
          />
          <span>{{ val || '(空)' }}</span>
        </label>
        <div v-if="options.length === 0" class="filter-empty">无匹配项</div>
      </div>
      <div class="filter-footer">
        <button class="filter-confirm" @click="emit('close')">确定</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// 这个下拉框是“通用组件”，
// 文件查询表和 LCW 详情表都在复用它，所以只保留最通用的输入和事件。
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 }),
  },
  searchText: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  selectedValues: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'update:searchText',
  'select-all',
  'clear-all',
  'toggle-value',
  'close',
])
</script>
