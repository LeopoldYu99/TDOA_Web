<template>
  <a-layout-sider
    :width="184"
    :collapsed-width="64"
    :collapsible="true"
    v-model:collapsed="collapsed"
    theme="dark"
    class="app-sider"
  >
    <div class="sider-logo">
      <div class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" width="36" height="36">
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
      <span v-if="!collapsed" class="logo-text">信号识别定位系统</span>
    </div>

    <a-menu
      theme="dark"
      mode="inline"
      :selected-keys="[String(activeMenu)]"
      @click="handleMenuClick"
    >
      <a-menu-item key="0">
        <template #icon><AimOutlined /></template>
        <span>实时位置</span>
      </a-menu-item>
      <a-menu-item key="1">
        <template #icon><FileSearchOutlined /></template>
        <span>内容查询</span>
      </a-menu-item>
      <a-menu-item key="2">
        <template #icon><EnvironmentOutlined /></template>
        <span>位置查询</span>
      </a-menu-item>
      <a-menu-item key="3">
        <template #icon><SettingOutlined /></template>
        <span>设备信息</span>
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script setup>
import { ref } from 'vue'
import {
  AimOutlined,
  FileSearchOutlined,
  EnvironmentOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'

defineProps({
  activeMenu: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:activeMenu'])
const collapsed = ref(false)

function handleMenuClick({ key }) {
  emit('update:activeMenu', Number(key))
}
</script>

<style scoped>
.app-sider {
  background: linear-gradient(180deg, #001529 0%, #002140 100%) !important;
}
.app-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
}
.sider-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.logo-text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  white-space: nowrap;
}
</style>
