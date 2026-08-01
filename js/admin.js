// ====================================================================
// ziven-custom-tags admin webpack entry
// ====================================================================
//
// flarum-webpack-config 找 process.cwd() 下的 forum.{js,ts} / admin.{js,ts}
// 作为 webpack entry. 详见 node_modules/flarum-webpack-config/src/index.cjs:15-32.
// ====================================================================

// Admin module
import './src/admin/index.js';

// Default export for compatibility
export default {};
