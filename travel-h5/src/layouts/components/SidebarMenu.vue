<template>
  <el-menu
    :default-active="active"
    :collapse="collapsed"
    :collapse-transition="false"
    class="sidebar-menu"
    @select="handleSelect"
  >
    <el-menu-item-group
      v-for="group in menu"
      :key="group.groupTitle"
      :title="collapsed ? '' : group.groupTitle"
    >
      <el-menu-item
        v-for="item in group.items"
        :key="item.route"
        :index="item.route"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu-item-group>
  </el-menu>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  menu: {
    type: Array,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
  active: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

const router = useRouter()

const handleSelect = (index) => {
  router.push(index)
  emit('select', index)
}
</script>

<style scoped>
.sidebar-menu {
  border-right: none;
  height: 100%;
}

/* 分组标题样式 */
.sidebar-menu :deep(.el-menu-item-group__title) {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  padding: 20px 20px 8px;
}

/* 菜单项样式 */
.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  font-size: 14px;
  color: #606266;
  padding: 0 20px;
}

/* 菜单项图标与文字间距 */
.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
}

/* hover 状态 */
.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #f5f7fa;
  color: #606266;
}

/* active 状态 */
.sidebar-menu :deep(.el-menu-item.is-active) {
  color: #409eff;
  background-color: #ecf5ff;
  font-weight: 600;
}

/* 折叠状态下的菜单 */
.sidebar-menu.el-menu--collapse {
  width: 64px;
}

/* 折叠状态下隐藏分组标题 */
.sidebar-menu.el-menu--collapse :deep(.el-menu-item-group__title) {
  display: none;
}
</style>
