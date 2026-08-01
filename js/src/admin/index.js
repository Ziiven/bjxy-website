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
});
