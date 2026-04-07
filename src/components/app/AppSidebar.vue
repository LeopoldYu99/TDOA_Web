<template>
  <aside class="sidebar">
    <div class="logo">
      <!-- logo 用内联 SVG，避免额外引入静态资源后还要处理打包路径。 -->
      <div class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="logoShell" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#b8f4ff" />
              <stop offset="1" stop-color="#3ea3ff" />
            </linearGradient>
            <linearGradient id="logoBeam" x1="23" y1="16" x2="45" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#dffbff" />
              <stop offset="1" stop-color="#5cc5ff" />
            </linearGradient>
          </defs>
          <path
            d="M32 8C19.85 8 10 17.85 10 30c0 14.57 18.31 24.87 20.18 25.9a3.82 3.82 0 0 0 3.64 0C35.69 54.87 54 44.57 54 30 54 17.85 44.15 8 32 8Z"
            fill="rgba(12,33,64,0.24)"
            stroke="url(#logoShell)"
            stroke-width="3"
          />
          <path
            d="M32 17c-6.9 0-12.5 5.6-12.5 12.5S25.1 42 32 42s12.5-5.6 12.5-12.5S38.9 17 32 17Z"
            fill="rgba(143,231,255,0.12)"
            stroke="rgba(216,246,255,0.6)"
            stroke-width="1.6"
          />
          <path
            d="M32 17a12.5 12.5 0 0 1 11.42 7.43L32 29.5V17Z"
            fill="url(#logoBeam)"
            opacity="0.95"
          />
          <circle cx="32" cy="29.5" r="4.5" fill="#eefcff" />
          <circle cx="32" cy="29.5" r="2" fill="#5cc5ff" />
          <path d="M32 11.5v4.5" stroke="#e8fbff" stroke-width="2.8" stroke-linecap="round" />
          <path d="M18.2 29.5h4.5" stroke="#e8fbff" stroke-width="2.8" stroke-linecap="round" />
          <path d="M41.3 29.5h4.5" stroke="#e8fbff" stroke-width="2.8" stroke-linecap="round" />
          <path d="M32 42.5v4.5" stroke="#e8fbff" stroke-width="2.8" stroke-linecap="round" />
          <circle cx="46.5" cy="17.5" r="3.2" fill="#8fe7ff" opacity="0.95" />
          <circle cx="46.5" cy="17.5" r="6.2" stroke="#8fe7ff" opacity="0.28" />
        </svg>
      </div>
      <span class="logo-text">信号识别定位系统</span>
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
