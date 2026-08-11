// ziven-bjxy-website admin entry
// 注册 /admin#/extension/ziven-bjxy-website 页面 (Flarum 2.0 registry 模式)
// v0.1.0a 修: app.extensionSettings 在 Flarum 2.0 不存在, 改用 app.registry.for('xxx').registerPage()
// v0.1.0e 修: namespace 拼错 'ziven-bjxy-website' → 'ziiven-bjxy-website'
//   vendor 目录 vendor/ziiven/bjxy-website → namespace key = 'ziiven-bjxy-website'
//   (跟 ziven-core 'ziiven-ziven-core' / dress-up 'ziiven-dress-up' 同款规则)
//   错拼 → admin app registry 找不到 namespace, 显示 "此扩展无设置项"
import app from 'flarum/admin/app';
import BjxySettings from './components/BjxySettings';

app.initializers.add('ziiven-bjxy-website', () => {
  app.registry
    .for('ziiven-bjxy-website')
    .registerPage(BjxySettings);

  // v0.2.0i.h 新 (辉哥 2026-08-11 21:43 反馈): 注入 /bjxy 到 admin 论坛首页 radio 选项
  //   vendor BasicsPage.homePageItems() 初始只 add allDiscussions (/all)
  //   (vendor/flarum/core/js/src/admin/components/BasicsPage.tsx L48-56)
  //   vendor BasicsPage.register() 调 registerSetting('default_route') (L173-187)
  //   走 vendor AdminApplication.runBeforeMount() (L146-154) 在 initializers.run() 之后跑
  //   → 直接在 initializer callback 里 setSetting 不会命中 (settings.has(key) = false, no-op L107)
  //   修法: 走 app.beforeMount() (vendor/flarum/core/js/src/common/Application.tsx L352-358),
  //         runBeforeMount 跑 AdminApplication.L147 BasicsPage.register() 后调 super.runBeforeMount()
  //         (AdminApplication.tsx L153) → 跑 beforeMounts 数组 → setSetting 命中
  //   时序参考: vendor Admin.ts L127 也是 app.beforeMount 包 setSetting
  //   vendor ForumServiceProvider::setDefaultRoute (vendor/flarum/core/src/Forum/ForumServiceProvider.php L236-248)
  //     读 default_route setting, 找 routes->getRouteData()[0]['GET'][$defaultRoute]['handler']
  //     bjxy extend.php L24 已注册 ->route('/bjxy', 'bjxy.website', ...) → 命中, / 走 bjxy handler
  //   改 original.options 加 /bjxy 选项, 不动 vendor allDiscussions
  //   i18n key: admin.home_page_option (locale/*.yml 走 vendor Extend\Locales, 无 namespace prefix)
  //     vendor LocaleManager.addTranslations($locale, $file, $module = null) — module null → prefix = ''
  //     实际 yml key 是 'admin.home_page_option', 不是 'ziiven-bjxy-website.admin.home_page_option'
  app.beforeMount(() => {
    app.registry
      .for('core-basics')
      .setSetting('default_route', (original) => ({
        ...original,
        options: [
          ...original.options,
          {
            path: '/bjxy',
            value: '/bjxy',
            label: app.translator.trans('admin.home_page_option', {}, 'bjxy 官网'),
          },
        ],
      }));
  });
});
