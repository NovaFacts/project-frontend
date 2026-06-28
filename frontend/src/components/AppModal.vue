<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" :class="{ 'modal--sm': size === 'sm' }">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: 'default' | 'sm' }>(), { size: 'default' });
defineEmits<{ close: [] }>();
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal--sm {
  max-width: 420px;
}

@media (max-width: 480px) {
  .modal {
    padding: 24px 16px;
  }
}
</style>
