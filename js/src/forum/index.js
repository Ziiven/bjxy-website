// ziven-bjxy-website forum entry
// 注册 /bjxy 路由 + 渲染 BjxyPage (10 section + 浅深双版)
import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import BjxyPage from './components/BjxyPage';
import BjxyCoachModal from './components/BjxyCoachModal';

// v0.2.0i.k.b 新 (辉哥 2026-08-12 17:35 反馈): 劫持 m.route.set + 启动补 push, 解决 /u/{username} 返回按钮 + 刷新跳 /bjxy
//   背景:
//     vendor History 是 session-only 内存, 刷新后 mithril 重建 stack, bjxy entry 丢
//     辉哥实测: 刷新 /u/wfl → stack 变成 [user.posts], 没 bjxy entry, 返回按钮跳 / (首页)
//   修法 3 件套:
//     1) BjxyPage oninit 写 sessionStorage: 'ziven-bjxy-prev-path' = '/bjxy' + 'ziven-bjxy-active' = '1'
//     2) 劫持 m.route.set: 跳 /u/... 时, IF active='1' THEN push bjxy entry
//     3) 启动补 push: initializer 末尾 setTimeout 0, check 当前 url 是 /u/... 且 active='1', push bjxy entry
//   为什么需要 active flag (不是只用 prev-path):
//     防止 /d/1 → /u/ 副作用: 用户没访问过 bjxy, 但劫持无脑 push 会让返回跳 /bjxy 而不是 /d/1
//     active flag 只在 BjxyPage oninit 写, onremove 清, 严格反映"当前 SPA session 内当前路由链是否经过 bjxy"
//   劫持时机 (SOP 2025-08-12 mithril 0.2.x 实战):
//     - bjxy oninit push bjxy entry (stack = [tags, bjxy])
//     - 用户点 /u/wfl link → mithril hijack → 调劫持 m.route.set('/u/wfl')
//     - 我们的劫持: check active='1' (因为 bjxy onremove 还没触发) → push bjxy entry
//     - 调 originalRouteSet → mithril 内部 mount newPage + unmount oldPage (同步)
//     - unmount oldPage: bjxy.onremove() → 清 active='0'
//     - mount newPage: PostsUserPage.oninit → show() push 'user.posts' → stack = [tags, bjxy, user.posts]
//     - canGoBack = true ✅, back() 跳 stack[length-2] = bjxy url = '/bjxy' ✅
//   启动补 push (刷新场景):
//     - 用户刷新 /u/wfl (同 tab, sessionStorage 还在, active='1')
//     - 浏览器新加载 JS, mithril 启动 m.route() 直接 mount default route
//     - mithril 内部 mount PostsUserPage → oninit → show() push 'user.posts' → stack = [tags, user.posts]
//     - 注意: mithril 0.2.x 启动不调 m.route.set, 直接 mount, 所以劫持没被触发 (错过了)
//     - 我们 initializer setTimeout 0 异步 check: 当前 url = /u/wfl, active='1' → push bjxy entry
//     - 异步 push 后 stack = [tags, bjxy, user.posts], backUrl = /bjxy ✅
//   /d/1 → /u/ 场景 (重要!):
//     - 用户在 /d/1, sessionStorage active='0' (没访问过 bjxy)
//     - 点 user 链接 → 劫持 m.route.set('/u/wfl') → check active='0' → 不 push
//     - 走 vendor 默认: stack = [..., 'd/1', 'user.posts'], back 跳 /d/1 ✅
//   跨 tab 场景:
//     - tab A 进 bjxy, tab B 直接打开 /u/wfl
//     - tab B sessionStorage 独立, active='0' → 劫持不 push ✅
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
        const active = sessionStorage.getItem('ziven-bjxy-active');
        const bjxyPrev = sessionStorage.getItem('ziven-bjxy-prev-path');
        // 三重 check 防 /d/1 → /u/ 副作用:
        //   1. active='1' (用户在 SPA session 内访问过 bjxy)
        //   2. bjxyPrev 存在
        //   3. app.previous 是 bjxy 路径 (m.route.set 之前 mithril 内部已 setPrevious)
        //   关键: sessionStorage 跨 page.goto 持续, 单独用 active 没法区分 /d/1 → /u/ (用户没访问过 bjxy 但 active='1' 还在)
        //   app.previous 是 mithril 0.2.x 内部 PageState 跟踪上一路由, 在 m.route.set 调用时已更新
        //   如果 app.previous routeName='bjxy', 说明用户真的是从 bjxy 跳过来的
        //   如果 app.previous 是其他 (e.g. 'discussion'), 说明用户从其他页面来, 不该 push bjxy entry
        // 注意: app.previous 可能是 undefined (第一次 mount), 这时不 push
        if (active === '1' && bjxyPrev && app && app.history && app.previous && app.previous.get && app.previous.get('routeName') === 'bjxy') {
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

const maybePushBjxyOnBoot = () => {
  // 启动补 push: 刷新 /u/{username} 场景, mithril 0.2.x 启动不调 m.route.set, 劫持错过
  // setTimeout 0 让 mithril 同步 mount 完成 (PostsUserPage.oninit + show + push user.posts) 后再补 push
  // 关键: splice 插入到 stack 倒数第 2 个位置 (user.posts 之前), 不能简单 push 否则 backUrl 错误
  //   错误: 简单 push → stack = [..., 'user.posts', 'bjxy'] → backUrl = '/u/wfl' (错!)
  //   正确: splice 插入 → stack = [..., 'bjxy', 'user.posts'] → backUrl = '/bjxy' (对)
  // 二次 check 防 /d/1 → /u/ 副作用 (跟劫持逻辑一致, 三重 check)
  // 特殊 case: 刷新 /u/{username} 场景, app.previous 是 null (第一次 mount), 走 noPrevious 路径
  setTimeout(() => {
    try {
      const active = sessionStorage.getItem('ziven-bjxy-active');
      const bjxyPrev = sessionStorage.getItem('ziven-bjxy-prev-path');
      const currentPath = window.location.pathname;
      const isUserPage = currentPath.indexOf('/u/') === 0;
      // 场景 A: /u/ 路径 + 正常 previous 链 (SPA 内跳转) — app.previous='bjxy'
      // 场景 B: /u/ 路径 + 无 previous (刷新场景) — app.previous 是 null/undefined
      // 场景 C: 非 /u/ 路径 — 不补 push
      if (!isUserPage) return;
      if (!active || active !== '1' || !bjxyPrev || !app || !app.history) return;

      const previousRoute = app.previous && app.previous.get ? app.previous.get('routeName') : null;
      const isFromBjxy = previousRoute === 'bjxy';
      const isFreshLoad = !previousRoute; // 第一次 mount (刷新场景)
      // 场景 C 防误伤: 是 /u/ 路径但 previous 是 'tags' 或 'discussion' 等其他 (e.g. /d/1 跨 page 跳过来的 mithril 启动)
      //   但这种情况 setTimeout 0 跑时, currentPath 应该是 /d/1 不是 /u/, 已经 return 了
      //   所以 isFromBjxy || isFreshLoad 就够了
      if (!isFromBjxy && !isFreshLoad) return;

      const stack = app.history.stack;
      if (stack && stack.length > 0) {
        // 已经在倒数第 2 个位置是 bjxy (幂等) 就跳过
        if (stack.length >= 2 && stack[stack.length - 2].name === 'bjxy') return;
        // 用 splice 把 bjxy entry 插入到栈顶前面 (length-1 位置)
        stack.splice(stack.length - 1, 0, { name: 'bjxy', url: bjxyPrev, title: 'bjxy 官网' });
      }
    } catch (e) {
      // 静默失败
    }
  }, 0);
};

app.initializers.add('ziven-bjxy-website', () => {
  // v0.2.0i.k.b: 在 initializer 启动时装 m.route.set 劫持 + 启动补 push
  //   initializer 在 forum JS bundle 启动时执行一次, 时机早于任何 component mount
  installBjxyRouteHook();
  maybePushBjxyOnBoot();
  app.routes.bjxy = {
    path: '/bjxy',
    component: BjxyPage,
  };
  app.bjxyCoachModal = BjxyCoachModal;
});
