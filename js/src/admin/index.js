// ziven-bjxy-website admin entry
// 注册 /admin#/extension/ziven-bjxy-website 页面
import app from 'flarum/admin/app';
import BjxySettings from './components/BjxySettings';

app.initializers.add('ziven-bjxy-website', () => {
  app.extensionSettings['ziiven-bjxy-website'] = () => m(BjxySettings);
});
