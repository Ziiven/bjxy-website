// ziven-bjxy-website forum entry
// 注册 /bjxy 路由 + 渲染 BjxyPage (10 section + 浅深双版)
import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import BjxyPage from './components/BjxyPage';
import BjxyCoachModal from './components/BjxyCoachModal';

// v0.2.0i.k.b 新 (辉哥 2026-08-12 17:35 反馈): 劫持 m.route.set, 跳 /u/{username} 时自动 push bjxy entry
//   背景:
//     vendor History 是 session-only 内存, 刷新后 mithril 重建 stack, bjxy entry 丢
//     辉哥实测: 刷新 /u/wfl → stack 变成 [user.posts], 没 bjxy entry, 返回按钮跳 / (首页)
//   修法:
//     1) BjxyPage oninit 写 sessionStorage.setItem('ziven-bjxy-prev-path', '/bjxy') (SPA session 内持续)
//     2) 劫持 m.route.set, 当新 path 匹配 /u/{username} 时, 读 sessionStorage 自动 push bjxy entry
//        这样 /u/wfl 加载完成后 stack = [bjxy, user.posts] length 2, canGoBack = true, 返回跳 /bjxy
//   劫持时机:
//     - bjxy oninit push bjxy entry (stack = [bjxy])
//     - 用户点教练 → m.route.set('/u/wfl')
//     - 劫持: 读 sessionStorage → push bjxy entry (但 stack top 已经是 bjxy, History.push L57-58 会覆盖)
//     - mithril 内部 mount PostsUserPage → show() push 'user.posts' → stack = [bjxy, user.posts]
//     - canGoBack = true ✅, back() 跳 stack[length-2] = bjxy url = '/bjxy' ✅
//   刷新场景:
//     - 用户从 bjxy → /u/wfl, sessionStorage 还在
//     - 刷新 /u/wfl → mithril 重建 → mithril 内部 m.route.set('/u/wfl') 触发劫持 → push bjxy entry
//     - PostsUserPage mount → push user.posts → stack = [bjxy, user.posts]
//     - 同样返回跳 /bjxy ✅
//   非 bjxy 场景 (用户从 / 跳 /u/wfl):
//     - sessionStorage 没 bjxy prev path (没进 bjxy)
//     - 劫持不 push → 走 vendor 默认行为, stack = [user.posts] length 1, canGoBack = false
//   注意:
//     - 用 global m (Flarum 2.0 注入, 跟 bjxy admin 同款, 跟 vendor patchMithril.js L4 一致)
//     - 劫持只执行一次 (用 closure flag 防止多次 initializer 重入)
//     - 不能改 vendor routes (ForumApplication 改不了), 只能劫持 m.route.set 这个公共 API
const installBjxyRouteHook = () => {
  // 只装一次, 防止 HMR / 多次 initializer 重复 patch
  if (window.__zivenBjxyRouteHookInstalled) return;
  window.__zivenBjxyRouteHookInstalled = true;

  const originalRouteSet = m.route.set.bind(m.route);
  m.route.set = function (path, params, options) {
    // 只在跳 /u/{username} 用户页面时插桩 (其他路径不影响)
    if (typeof path === 'string' && path.indexOf('/u/') === 0) {
      try {
        const bjxyPrev = sessionStorage.getItem('ziven-bjxy-prev-path');
        if (bjxyPrev && app && app.history) {
          // push 'bjxy' entry, History.push L57-58 检查 top 同名会覆盖, 不会 stack 重复
          app.history.push('bjxy', 'bjxy 官网', bjxyPrev);
        }
      } catch (e) {
        // sessionStorage 禁用 (隐私模式), 静默失败
      }
    }
    return originalRouteSet(path, params, options);
  };
};

app.initializers.add('ziven-bjxy-website', () => {
  // v0.2.0i.k.b: 在 initializer 启动时装 m.route.set 劫持
  //   initializer 在 forum JS bundle 启动时执行一次, 时机早于任何 component mount
  installBjxyRouteHook();
  app.routes.bjxy = {
    path: '/bjxy',
    component: BjxyPage,
  };
  app.bjxyCoachModal = BjxyCoachModal;
});
