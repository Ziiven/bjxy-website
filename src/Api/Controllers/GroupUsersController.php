<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;

/**
 * GET /api/bjxy/group-users?ids=1,2,3
 * 读取 bjxy_coach_group_ids 类似的 group id 列表 (从 query string 拿),
 * 查 group_user 表, 返回这些组里的所有 user (合并去重)
 *
 * v0.1.4 用: GroupPickerModal 弹 modal 时调这个 API 拿所选 group 的 user 列表
 *   之前是弹 modal 选 group, 现在是弹 modal 选 group 内的 user
 *
 * v0.1.10 改: 用 User::query() 走 model (走 avatarUrl accessor 拼 URL)
 *   跟 CoachesController v0.1.10 修法一致
 *   之前 raw DB::table() 拼出的 URL 少 /assets/avatars/ 路径 (跟 CoachesController 同样 bug)
 */
class GroupUsersController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        // 从 query string 拿 ids=1,2,3
        $params = $request->getQueryParams();
        $idsRaw = isset($params['ids']) ? $params['ids'] : '';
        $ids = array_filter(array_map('intval', explode(',', $idsRaw)));

        if (empty($ids)) {
            return new JsonResponse(['users' => []]);
        }

        $userModels = User::query()
            ->whereIn('id', function ($query) use ($ids) {
                $query->select('user_id')
                    ->from('group_user')
                    ->whereIn('group_id', $ids);
            })
            // v0.2.0i.a 改 (辉哥 07:55 反馈 B1 方案): 删 ->where('is_email_confirmed', 1) 过滤
            //   之前 v0.1.4 加这个过滤是防 admin 误创建的废账号
            //   现在改设计: modal 显示 group 全部 user, admin 自行勾选/取消 (bjxy_coach_user_ids 白名单保留)
            //   废账号在 modal 显示, admin 一眼看出 + 不勾选即可 (不强求删废账号)
            ->distinct()
            // v0.2.0i.a 加: sort 顺序, 已确认邮箱的 user 排前面 (admin 优先选)
            ->orderBy('is_email_confirmed', 'desc')
            ->orderBy('id')
            ->get();

        // v0.1.10: 直接读 $user->avatar_url 走 vendor User::getAvatarUrlAttribute() accessor
        //   自动调 disk('flarum-avatars')->url($filename) 拼 https://geek.ski/assets/avatars/<filename>
        $users = $userModels->map(function ($user) {
            return [
                'id' => (int) $user->id,
                'username' => $user->username,
                'displayName' => $user->display_name ?: $user->username,
                'avatarUrl' => $user->avatar_url,
            ];
        })->values()->all();

        return new JsonResponse(['users' => $users]);
    }
}
