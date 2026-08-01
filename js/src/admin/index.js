// ziven-bjxy-website admin entry
// 注册 /admin#/extension/ziven-bjxy-website 页面 (Flarum 2.0 registry 模式)
// v0.1.0a 修: app.extensionSettings 在 Flarum 2.0 不存在, 改用 app.registry.for('xxx').registerPage()
import app from 'flarum/admin/app';
import BjxySettings from './components/BjxySettings';

app.initializers.add('ziven-bjxy-website', () => {
  app.registry
    .for('ziven-bjxy-website')
    .registerPage(BjxySettings);
});
