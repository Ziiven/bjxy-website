// ====================================================================
// ziven-custom-tags webpack config - Flarum 2.0 (ziven-dress-up 同款)
// ====================================================================
//
// 走 flarum-webpack-config default (output.library: 'module.exports' +
// libraryTarget: 'assign', vendor Extension\Frontend addFile pattern 兼容,
// 2.0 vendor 解析 OK)
//
// 1.8 vendor: dist 加载会 throw (辉哥 2026-07-20 21:38 拍板砍 1.8 兼容,
// ziven-custom-tags 只兼容 Flarum 2.0)
// ====================================================================

const config = require('flarum-webpack-config')();

module.exports = config;
