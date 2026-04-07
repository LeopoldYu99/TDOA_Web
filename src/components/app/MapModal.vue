<template>
  <a-modal
    :open="visible"
    :title="title"
    :footer="null"
    :width="'80vw'"
    :body-style="{ height: '70vh', padding: 0 }"
    :destroy-on-close="false"
    :class="modalClass"
    @cancel="emit('close')"
  >
    <div :id="mapId" style="width: 100%; height: 100%"></div>
  </a-modal>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  mapId: { type: String, required: true },
  modalClass: { type: [String, Array, Object], default: '' },
})

const emit = defineEmits(['close'])
</script>
