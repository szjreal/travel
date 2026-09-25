<template>
  <div class="spot-item" v-if="data">
    <div class="spot-name">{{ data.spot || data.name || '待定' }}</div>
    <div class="spot-details" v-if="data.duration || data.ticket || data.transportation">
      <div class="detail-row" v-if="data.duration">
        <el-icon><Clock /></el-icon>
        <span>{{ data.duration }}</span>
      </div>
      <div class="detail-row" v-if="data.ticket">
        <el-icon><Ticket /></el-icon>
        <span>{{ data.ticket }}</span>
      </div>
      <div class="detail-row" v-if="data.transportation">
        <el-icon><Position /></el-icon>
        <span>{{ data.transportation }}</span>
      </div>
    </div>
    <div class="spot-desc" v-if="data.description">{{ data.description }}</div>
  </div>
  <div class="spot-item empty" v-else>
    <el-text type="info" size="small">暂无安排</el-text>
  </div>
</template>

<script setup>
import { Clock, Ticket, Position } from '@element-plus/icons-vue'

defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.spot-item { padding: 8px 0; }
.spot-item.empty { padding: 16px 0; text-align: center; }
.spot-name { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.spot-details { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
.detail-row { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #909399; }
.spot-desc { font-size: 14px; color: #909399; line-height: 1.5; }
</style>
