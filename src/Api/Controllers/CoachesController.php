<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Database\Capsule\Manager as DB;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;

/**
 * GET /api/bjxy/coaches
 * 返回前台展示用的教练列表
 *
 * v0.1.4 改: 优先读 bjxy_coach_user_ids (modal 选 user 后保存), 按 user id 列表直接拿 user
 *   fallback 老的 bjxy_coach_group_ids (group 拉 user, 兼容旧部署)
 */
class CoachesController implements RequestHandlerInterface
{
    public function __construct(protected SettingsRepositoryInterface $settings) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // v0.1.4 优先 user id 列表 (modal 选 user 后保存)
        $userIdsRaw = $this->settings->get('bjxy_coach_user_ids') ?: '[]';
        $userIds = json_decode($userIdsRaw, true);
        if (!is_array($userIds)) $userIds = [];

        // v0.1.4 修: 用 flarum.config['url'] 拿 base URL, 之前用 resolve('flarum.api_url')
        //   错误 (flarum.api_url 不是 container binding, 会抛 BindingResolutionException)
        //   旧版 v0.1.0 有 if (empty($ids)) return [] 短路保护, 没触发过 resolve()
        //   新版 v0.1.4 user_ids 默认是空数组但继续往下走, 触发了 resolve() 才暴露问题
        $apiUrl = app('flarum.config')['url'] ?? '';

        if (!empty($userIds)) {
            // 直接按 user id 查 (admin 拖拽排序后保存的就是这个顺序)
            $rows = DB::table('users')
                ->whereIn('users.id', $userIds)
                ->where('users.is_email_confirmed', 1)
                ->select('users.id', 'users.username', 'users.nickname', 'users.avatar_url')
                ->get();

            // 按 userIds 顺序排 (sortablejs 拖拽后的顺序)
            $byId = [];
            foreach ($rows as $r) $byId[(int) $r->id] = $r;
            $ordered = [];
            foreach ($userIds as $id) {
                if (isset($byId[(int) $id])) $ordered[] = $byId[(int) $id];
            }

            $coaches = array_map(function ($r) use ($apiUrl) {
                $displayName = $r->nickname ?: $r->username;
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
            }, $ordered);

            return new JsonResponse(['coaches' => $coaches]);
        }

        // fallback: 老的 bjxy_coach_group_ids (group 拉 user)
        $idsRaw = $this->settings->get('bjxy_coach_group_ids') ?: '[]';
        $ids = json_decode($idsRaw, true);
        if (!is_array($ids) || empty($ids)) {
            return new JsonResponse(['coaches' => []]);
        }

        $rows = DB::table('group_user')
            ->join('users', 'group_user.user_id', '=', 'users.id')
            ->whereIn('group_user.group_id', $ids)
            ->where('users.is_email_confirmed', 1)
            ->select('users.id', 'users.username', 'users.nickname', 'users.avatar_url')
            ->distinct()
            ->orderBy('users.id')
            ->get();

        $coaches = $rows->map(function ($r) use ($apiUrl) {
            $displayName = $r->nickname ?: $r->username;
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

        return new JsonResponse(['coaches' => $coaches]);
    }
}
