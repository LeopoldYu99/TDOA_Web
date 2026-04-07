<template>
  <div v-if="visible" class="trajectory-modal-overlay" @click.self="emit('close')">
    <div class="trajectory-modal" :class="modalClass">
      <div class="trajectory-modal-header">
        <span>{{ title }}</span>
        <button class="trajectory-modal-close" @click="emit('close')">&times;</button>
      </div>
      <div class="trajectory-modal-body">
        <div :id="mapId" style="width:100%;height:100%;"></div>
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
  title: {
    type: String,
    default: '',
  },
  mapId: {
    type: String,
    required: true,
  },
  modalClass: {
    type: [String, Array, Object],
    default: '',
  },
})

const emit = defineEmits(['close'])
</script>
