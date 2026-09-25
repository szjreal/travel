<template>
  <div class="wizard-page">
    <h2 class="page-title">🗺️ 智能行程规划向导</h2>

    <!-- 步骤条 -->
    <el-steps :active="currentStep" finish-status="success" align-center>
      <el-step title="选目的地" />
      <el-step title="选天数" />
      <el-step title="选预算" />
      <el-step title="选偏好" />
    </el-steps>

    <!-- 步骤内容 -->
    <div class="wizard-content">
      <!-- Step 1: 目的地 -->
      <div v-show="currentStep === 0" class="step-panel">
        <h3>选择你的目的地城市</h3>
        <el-select v-model="wizard.city" placeholder="请选择城市" size="large" filterable>
          <el-option v-for="city in cityOptions" :key="city" :label="city" :value="city" />
        </el-select>
      </div>

      <!-- Step 2: 天数 -->
      <div v-show="currentStep === 1" class="step-panel">
        <h3>选择你的旅行天数</h3>
        <el-radio-group v-model="wizard.days" size="large">
          <el-radio-button v-for="d in dayOptions" :key="d" :label="d">{{ d }}天</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Step 3: 预算 -->
      <div v-show="currentStep === 2" class="step-panel">
        <h3>输入你的预算金额</h3>
        <el-input-number
          v-model="wizard.budget"
          :min="0"
          :step="100"
          size="large"
          placeholder="请输入预算金额"
          controls-position="right"
        />
        <div class="budget-display">预算: {{ wizard.budget || 0 }} 元</div>
        <div v-if="wizard.budget < 500" class="budget-warning">⚠️ 预算不能低于 500 元</div>
      </div>

      <!-- Step 4: 偏好 -->
      <div v-show="currentStep === 3" class="step-panel">
        <h3>选择你的旅行偏好</h3>
        <el-checkbox-group v-model="wizard.preferences">
          <el-checkbox v-for="pref in preferenceOptions" :key="pref" :label="pref">{{ pref }}</el-checkbox>
        </el-checkbox-group>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="wizard-actions">
      <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
      <el-button v-if="currentStep < 3" type="primary" @click="nextStep" :disabled="!canNext">下一步</el-button>
      <el-button v-if="currentStep === 3" type="primary" :loading="generating" @click="generatePlan">生成行程</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { post } from '@/untils/request.js'

const router = useRouter()

const currentStep = ref(0)
const generating = ref(false)

const wizard = reactive({
  city: '',
  days: 3,
  budget: 2000,
  preferences: [],
})

const cityOptions = ['北京', '上海', '成都', '西安', '杭州', '厦门', '三亚', '丽江', '重庆', '苏州', '青岛', '大理']
const dayOptions = [1, 2, 3, 5, 7]
const preferenceOptions = ['历史文化', '自然风光', '美食探店', '拍照打卡', '休闲度假', '户外探险']

const canNext = computed(() => {
  switch (currentStep.value) {
    case 0: return !!wizard.city
    case 1: return !!wizard.days
    case 2: return wizard.budget >= 500
    case 3: return true
    default: return false
  }
})

const nextStep = () => {
  if (!canNext.value) return
  if (currentStep.value < 3) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const generatePlan = async () => {
  generating.value = true
  try {
    const res = await post('/recommend', {
      city: wizard.city,
      budget: wizard.budget,
      days: wizard.days,
    })

    sessionStorage.setItem('planResult', JSON.stringify(res))

    ElMessage.success('行程生成成功！')
    router.push({ path: '/detail', query: { city: wizard.city, budget: wizard.budget, days: wizard.days } })
  } catch (err) {
    ElMessage.error('行程生成失败，请稍后重试')
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.wizard-page { max-width: 600px; margin: 0 auto; }
.page-title { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 32px; }
.wizard-content { min-height: 200px; padding: 32px; background: #f5f7fa; border-radius: 8px; margin: 24px 0; }
.step-panel { text-align: center; }
.step-panel h3 { font-size: 18px; margin-bottom: 20px; }
.budget-display { margin-top: 16px; font-size: 16px; font-weight: 600; color: #409eff; }
.budget-warning { margin-top: 8px; font-size: 14px; color: #f56c6c; }
.wizard-actions { display: flex; gap: 12px; justify-content: center; }
</style>
