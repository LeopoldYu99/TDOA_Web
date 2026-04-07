<template>
  <section class="device-page">
    <div class="device-section device-config-section">
      <div class="device-section-header">
        <div>
          <div class="device-section-title">设备配置</div>
        </div>
        <div class="device-config-toolbar">
          <button
            class="query-btn"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
            @click="emit('save-device-config')"
          >
            {{ deviceConfigSaving ? '保存中...' : '保存配置' }}
          </button>
          <button
            class="danger-btn"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
            @click="emit('reboot')"
          >
            {{ rebootingDevice ? '重启中...' : '设备重启' }}
          </button>
          <button
            class="danger-btn danger-btn-secondary"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice || shuttingDownDevice"
            @click="emit('shutdown')"
          >
            {{ shuttingDownDevice ? '关机中...' : '设备关机' }}
          </button>
        </div>
      </div>

      <div
        v-if="deviceConfigMessage"
        class="device-config-message"
        :class="`device-config-message-${deviceConfigMessageType}`"
      >
        {{ deviceConfigMessage }}
      </div>

      <div class="device-config-grid">
        <div class="device-config-field">
          <span class="device-config-label">设备编号</span>
          <input class="device-config-input" :value="deviceConfigMeta.deviceGuid || '-'" type="text" readonly />
        </div>

        <label class="device-config-field">
          <span class="device-config-label">是否是中心节点</span>
          <div class="device-switch-row">
            <label class="device-switch">
              <input
                v-model="deviceConfigForm.isCenterNode"
                type="checkbox"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
              <span class="device-switch-slider"></span>
            </label>
            <span class="device-switch-text">{{ deviceConfigForm.isCenterNode ? '是' : '否' }}</span>
          </div>
        </label>

        <div class="device-config-field">
          <span class="device-config-label">主节点 IP</span>
          <input
            v-model.trim="deviceConfigForm.device1IP"
            class="device-config-input"
            type="text"
            placeholder="对应 Device1IP"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
          />
        </div>

        <div class="device-config-field">
          <span class="device-config-label">从节点2 IP</span>
          <input
            v-model.trim="deviceConfigForm.device2IP"
            class="device-config-input"
            type="text"
            placeholder="对应 Device2IP"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
          />
        </div>

        <div class="device-config-field">
          <span class="device-config-label">从节点3 IP</span>
          <input
            v-model.trim="deviceConfigForm.device3IP"
            class="device-config-input"
            type="text"
            placeholder="对应 Device3IP"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
          />
        </div>
      </div>
    </div>

    <div class="device-section device-card-section">
      <div class="device-section-header">
        <div>
          <div class="device-section-title">设备运行信息</div>
          <div class="device-section-desc">展示当前三台设备的在线状态、资源占用与自组网入口。</div>
        </div>
      </div>
      <div class="device-table-wrapper">
        <table class="device-table">
          <thead>
            <tr>
              <th>设备名称</th>
              <th>更新时间</th>
              <th>已工作时间</th>
              <th>磁盘已用/总量(GB)</th>
              <th>磁盘剩余(GB)</th>
              <th>CPU使用率(%)</th>
              <th>自组网</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(dev, i) in deviceList" :key="i">
              <td><span class="status-light" :class="dev.isOnline ? 'online' : 'offline'"></span>{{ dev.name }}</td>
              <td>{{ dev.lastWorkedTime }}</td>
              <td>{{ dev.workedTime }}</td>
              <td>{{ dev.diskUsedGB }} / {{ dev.diskTotalGB }}</td>
              <td>{{ dev.diskAvailGB }}</td>
              <td :class="{ 'cpu-high': dev.cpuUsagePercent > 80 }">{{ dev.cpuUsagePercent }}</td>
              <td><button class="mesh-btn" @click="emit('open-mesh', i + 1)">前往自组网</button></td>
            </tr>
            <tr v-if="deviceList.length === 0">
              <td colspan="7" class="empty-row">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  deviceConfigForm: {
    type: Object,
    required: true,
  },
  deviceConfigMeta: {
    type: Object,
    required: true,
  },
  deviceConfigLoading: {
    type: Boolean,
    default: false,
  },
  deviceConfigSaving: {
    type: Boolean,
    default: false,
  },
  rebootingDevice: {
    type: Boolean,
    default: false,
  },
  shuttingDownDevice: {
    type: Boolean,
    default: false,
  },
  deviceConfigMessage: {
    type: String,
    default: '',
  },
  deviceConfigMessageType: {
    type: String,
    default: 'info',
  },
  deviceList: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['save-device-config', 'reboot', 'shutdown', 'open-mesh'])
</script>
