<template>
  <div class="device-page">
    <a-card title="设备配置" :bordered="false" size="small">
      <template #extra>
        <a-space>
          <a-button
            type="primary"
            :loading="deviceConfigSaving"
            :disabled="deviceConfigLoading || rebootingDevice"
            @click="emit('save-device-config')"
          >
            保存配置
          </a-button>
          <a-button
            danger
            :loading="rebootingDevice"
            :disabled="deviceConfigLoading || deviceConfigSaving"
            @click="emit('reboot')"
          >
            设备重启
          </a-button>
          <a-button
            danger
            ghost
            :loading="shuttingDownDevice"
            :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
            @click="emit('shutdown')"
          >
            设备关机
          </a-button>
        </a-space>
      </template>

      <a-alert
        v-if="deviceConfigMessage"
        :message="deviceConfigMessage"
        :type="deviceConfigMessageType === 'error' ? 'error' : deviceConfigMessageType === 'warning' ? 'warning' : deviceConfigMessageType === 'success' ? 'success' : 'info'"
        show-icon
        closable
        style="margin-bottom: 16px"
      />

      <a-form layout="inline" :label-col="{ style: { width: '110px' } }">
        <a-row :gutter="[16, 12]" style="width: 100%">
          <a-col :span="8">
            <a-form-item label="设备编号">
              <a-input :value="deviceConfigMeta.deviceGuid || '-'" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否是中心节点">
              <a-switch
                v-model:checked="deviceConfigForm.isCenterNode"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
                checked-children="是"
                un-checked-children="否"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="主节点 IP">
              <a-input
                v-model:value="deviceConfigForm.device1IP"
                placeholder="对应 Device1IP"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="从节点2 IP">
              <a-input
                v-model:value="deviceConfigForm.device2IP"
                placeholder="对应 Device2IP"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="从节点3 IP">
              <a-input
                v-model:value="deviceConfigForm.device3IP"
                placeholder="对应 Device3IP"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card title="设备运行信息" :bordered="false" size="small" style="margin-top: 16px">
      <template #extra>
        <span style="color: #999; font-size: 12px">展示当前三台设备的在线状态、资源占用与自组网入口</span>
      </template>
      <a-table
        :columns="deviceColumns"
        :data-source="deviceList"
        :pagination="false"
        size="small"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'name'">
            <a-badge :status="record.isOnline ? 'success' : 'error'" />
            {{ record.name }}
          </template>
          <template v-else-if="column.key === 'disk'">
            {{ record.diskUsedGB }} / {{ record.diskTotalGB }}
          </template>
          <template v-else-if="column.key === 'cpuUsagePercent'">
            <span :style="{ color: record.cpuUsagePercent > 80 ? '#ff4d4f' : 'inherit', fontWeight: record.cpuUsagePercent > 80 ? 600 : 'normal' }">
              {{ record.cpuUsagePercent }}
            </span>
          </template>
          <template v-else-if="column.key === 'mesh'">
            <a-button type="link" size="small" @click="emit('open-mesh', index + 1)">前往自组网</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
const deviceColumns = [
  { title: '设备名称', key: 'name', dataIndex: 'name', width: 130 },
  { title: '更新时间', dataIndex: 'lastWorkedTime', key: 'lastWorkedTime', width: 170 },
  { title: '已工作时间', dataIndex: 'workedTime', key: 'workedTime', width: 150 },
  { title: '磁盘已用/总量(GB)', key: 'disk', width: 160 },
  { title: '磁盘剩余(GB)', dataIndex: 'diskAvailGB', key: 'diskAvailGB', width: 120 },
  { title: 'CPU使用率(%)', dataIndex: 'cpuUsagePercent', key: 'cpuUsagePercent', width: 120 },
  { title: '自组网', key: 'mesh', width: 120 },
]

defineProps({
  deviceConfigForm: { type: Object, required: true },
  deviceConfigMeta: { type: Object, required: true },
  deviceConfigLoading: { type: Boolean, default: false },
  deviceConfigSaving: { type: Boolean, default: false },
  rebootingDevice: { type: Boolean, default: false },
  shuttingDownDevice: { type: Boolean, default: false },
  deviceConfigMessage: { type: String, default: '' },
  deviceConfigMessageType: { type: String, default: 'info' },
  deviceList: { type: Array, default: () => [] },
})

const emit = defineEmits(['save-device-config', 'reboot', 'shutdown', 'open-mesh'])
</script>

<style scoped>
.device-page {
  padding: 0;
}
</style>
