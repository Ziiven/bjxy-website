// ziven-bjxy-website forum entry
// 注册 /bjxy 路由 + 渲染 BjxyPage (10 section + 浅深双版)
import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import BjxyPage from './components/BjxyPage';
import BjxyCoachModal from './components/BjxyCoachModal';

app.initializers.add('ziven-bjxy-website', () => {
  app.routes.bjxy = {
    path: '/bjxy',
    component: BjxyPage,
  };
  app.bjxyCoachModal = BjxyCoachModal;
});
