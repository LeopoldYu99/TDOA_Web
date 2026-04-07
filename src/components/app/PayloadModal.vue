<template>
  <div v-if="visible" class="trajectory-modal-overlay" @click.self="emit('close')">
    <div class="payload-modal">
      <div class="trajectory-modal-header">
        <span>载荷信息</span>
        <button class="trajectory-modal-close" @click="emit('close')">&times;</button>
      </div>
      <div class="payload-modal-body">
        <div v-for="section in currentPayloadSections" :key="section.label" class="payload-section">
          <div class="payload-section-label" :style="{ color: section.color }">{{ section.label }}</div>
          <div class="payload-tags">
            <template v-if="section.type === 'wav'">
              <button
                v-for="(val, vi) in section.values"
                :key="vi"
                class="wav-download-btn"
                @click="emit('download-wav', val, currentPayloadData?.chainID, vi)"
              >
                <span class="wav-icon">&#9654;</span> 语音{{ vi + 1 }}.wav
              </button>
            </template>
            <template v-else-if="section.type === 'text'">
              <div class="payload-text-block">
                <span v-for="(line, li) in section.text.split('\n')" :key="li" class="payload-text-line">{{ line }}</span>
              </div>
            </template>
            <template v-else>
              <span
                v-for="(val, vi) in section.values"
                :key="vi"
                class="payload-tag"
                :style="{ borderColor: section.color, color: section.color }"
              >
                {{ val }}
              </span>
            </template>
          </div>
        </div>
        <div v-if="currentPayloadSections.length === 0" class="empty-row" style="padding:24px 0;">暂无载荷数据</div>
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
  currentPayloadData: {
    type: Object,
    default: null,
  },
  currentPayloadSections: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'download-wav'])
</script>
