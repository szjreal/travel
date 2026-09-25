<template>
  <div class="budget-table">
    <el-descriptions :column="1" border>
      <el-descriptions-item
        v-for="(value, key) in budgetItems"
        :key="key"
        :label="getLabel(key)"
      >
        <span class="budget-value">¥{{ value }}</span>
      </el-descriptions-item>
    </el-descriptions>
    <div class="budget-total">
      <span>总计</span>
      <span class="total-amount">¥{{ total }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  total: {
    type: [Number, String],
    default: 0
  }
})

const budgetItems = computed(() => {
  return {
    accommodation: props.data.accommodation || 0,
    food: props.data.food || 0,
    transportation: props.data.transportation || 0,
    tickets: props.data.tickets || 0,
    other: props.data.other || 0
  }
})

const labelMap = {
  accommodation: '住宿',
  food: '餐饮',
  transportation: '交通',
  tickets: '门票',
  other: '其他'
}

const getLabel = (key) => {
  return labelMap[key] || key
}
</script>

<style scoped>
.budget-table { margin-top: 8px; }
.budget-value { font-weight: 500; }
.budget-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
}
.total-amount { color: #f56c6c; font-size: 18px; }
</style>
