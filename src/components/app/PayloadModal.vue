<template>
  <a-modal
    :open="visible"
    title="载荷信息"
    :footer="null"
    :width="900"
    :body-style="{ maxHeight: '75vh', overflowY: 'auto', padding: '16px 24px' }"
    @cancel="emit('close')"
  >
    <div v-for="section in currentPayloadSections" :key="section.label" class="payload-section">
      <div class="payload-section-label" :style="{ color: section.color }">
        {{ section.label }}
      </div>
      <div class="payload-section-body">
        <template v-if="section.type === 'wav'">
          <a-space wrap>
            <a-button
              v-for="(val, vi) in section.values"
              :key="vi"
              size="small"
              @click="emit('download-wav', val, currentPayloadData?.chainID, vi)"
            >
              <CaretRightOutlined /> 语音{{ vi + 1 }}.wav
            </a-button>
          </a-space>
        </template>
        <template v-else-if="section.type === 'text'">
          <div class="payload-text-block">{{ section.text }}</div>
        </template>
        <template v-else>
          <!-- 短值用 tag，长值用文本块 -->
          <template v-if="isLongContent(section.values)">
            <div class="payload-long-tags">
              <div
                v-for="(val, vi) in section.values"
                :key="vi"
                class="payload-long-tag"
                :style="{ borderLeftColor: section.color }"
              >
                {{ val }}
              </div>
            </div>
          </template>
          <template v-else>
            <div class="payload-tags-wrap">
              <a-tag
                v-for="(val, vi) in section.values"
                :key="vi"
                :color="section.color"
                class="payload-tag"
              >
                {{ val }}
              </a-tag>
            </div>
          </template>
        </template>
      </div>
    </div>
    <a-empty v-if="currentPayloadSections.length === 0" description="暂无载荷数据" />
  </a-modal>
</template>

<script setup>
import { CaretRightOutlined } from '@ant-design/icons-vue'

defineProps({
  visible: { type: Boolean, default: false },
  currentPayloadData: { type: Object, default: null },
  currentPayloadSections: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'download-wav'])

function isLongContent(values) {
  if (!values || values.length === 0) return false
  return values.some(v => String(v).length > 60)
}
</script>

<style scoped>
.payload-section {
  margin-bottom: 14px;
}
.payload-section-label {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
}
.payload-section-body {
  width: 100%;
}
.payload-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
}
.payload-tag {
  margin-right: 6px;
  margin-bottom: 4px;
  max-width: 100%;
  white-space: normal;
  word-break: break-all;
  height: auto;
  line-height: 1.6;
}
.payload-long-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.payload-long-tag {
  background: #f5f5f5;
  border-left: 3px solid #1890ff;
  padding: 4px 10px;
  border-radius: 0 4px 4px 0;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  color: rgba(0, 0, 0, 0.75);
}
.payload-text-block {
  white-space: pre-wrap;
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.75);
}
</style>
