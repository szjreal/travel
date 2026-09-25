/**
 * 侧边栏菜单配置
 * 供 MainLayout 的 SidebarMenu 子组件消费
 */
export const sidebarMenu = [
  {
    groupTitle: '主要功能',
    items: [
      { title: '首页仪表盘', icon: 'Odometer',    route: '/dashboard' },
      { title: 'AI 对话',    icon: 'ChatDotRound', route: '/chat' },
      { title: '行程规划',   icon: 'MapLocation',  route: '/plan-wizard' },
      { title: '场景助手',   icon: 'MagicStick',   route: '/scene' },
    ]
  },
  {
    groupTitle: '探索发现',
    items: [
      { title: '热门目的地', icon: 'Compass', route: '/discover' },
      { title: '目的地PK',   icon: 'Trophy', route: '/tips' },
    ]
  },
  {
    groupTitle: '个人中心',
    items: [
      { title: '我的收藏',   icon: 'Star',       route: '/favorites' },
      { title: '历史对话',   icon: 'Clock',      route: '/chat-history' },
      { title: '个人信息',   icon: 'User',       route: '/profile' },
      { title: '关于系统',   icon: 'InfoFilled', route: '/about' },
    ]
  },
]
