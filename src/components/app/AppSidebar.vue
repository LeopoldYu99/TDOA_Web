<template>
  <aside class="sidebar">
    <div class="logo">
      <span>信号识别定位系统</span>
    </div>

    <nav class="menu">
      <div
        v-for="(item, index) in menuItems"
        :key="index"
        class="menu-item"
        :class="{ active: activeMenu === index }"
        @click="emit('update:activeMenu', index)"
      >
        <svg
          class="menu-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          v-html="item.icon"
        ></svg>
        <span>{{ item.label }}</span>
      </div>
    </nav>
  </aside>
</template>

<script setup>
defineProps({
  menuItems: {
    type: Array,
    default: () => [],
  },
  activeMenu: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:activeMenu'])
</script>
