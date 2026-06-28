<template>
  <div class="section-header">
    <div class="section-header-text">
      <h2 class="section-title">{{ title }}</h2>
      <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
    </div>
    <button
      v-if="showCreateButton"
      class="btn btn--primary"
      type="button"
      @click="$emit('create')"
    >
      {{ createLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  createLabel: string;
  showCreateButton: boolean;
}>();

defineEmits<{ create: [] }>();
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-header-text {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 4px 0 0;
}
</style>
