<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * GET /api/bjxy/group-users?ids=1,2,3
 * 读取 bjxy_coach_group_ids 类似的 group id 列表 (从 query string 拿),
 * 查 group_user 表, 返回这些组里的所有 user (合并去重)
 *
 * v0.1.4 用: GroupPickerModal 弹 modal 时调这个 API 拿所选 group 的 user 列表
 *   之前是弹 modal 选 group, 现在是弹 modal 选 group 内的 user
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

        $rows = DB::table('group_user')
            ->join('users', 'group_user.user_id', '=', 'users.id')
            ->whereIn('group_user.group_id', $ids)
            ->select('users.id', 'users.username', 'users.display_name', 'users.avatar_url', 'users.is_email_confirmed')
            // v0.1.4: 排除未激活邮箱的用户 (admin 误创建的废账号)
            ->where('users.is_email_confirmed', 1)
            ->distinct()
            ->orderBy('users.id')
            ->get();

        $apiUrl = resolve('flarum.api_url');
        $users = $rows->map(function ($r) use ($apiUrl) {
            $displayName = $r->display_name ?: $r->username;
            $avatarUrl = null;
            if ($r->avatar_url) {
                $avatarUrl = preg_match('/^https?:/i', $r->avatar_url)
                    ? $r->avatar_url
                    : rtrim($apiUrl, '/') . str_replace('\\', '/', $r->avatar_url);
            }
            return [
                'id' => (int) $r->id,
                'username' => $r->username,
                'displayName' => $displayName,
                'avatarUrl' => $avatarUrl,
            ];
        })->values()->all();

        return new JsonResponse(['users' => $users]);
    }
}
