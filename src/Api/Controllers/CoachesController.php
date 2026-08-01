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
 * 读取 bjxy_coach_group_ids settings 里的 group id 列表, 查 group_user 表,
 * 返回这些组里的所有用户 (作为教练展示)
 */
class CoachesController implements RequestHandlerInterface
{
    public function __construct(protected SettingsRepositoryInterface $settings) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $ids = json_decode($this->settings->get('bjxy_coach_group_ids') ?: '[]', true) ?: [];
        if (empty($ids)) {
            return new JsonResponse(['coaches' => []]);
        }

        $rows = DB::table('group_user')
            ->join('users', 'group_user.user_id', '=', 'users.id')
            ->whereIn('group_user.group_id', $ids)
            ->select('users.id', 'users.username', 'users.display_name', 'users.avatar_url')
            ->distinct()
            ->get();

        $apiUrl = resolve('flarum.api_url');
        $coaches = $rows->map(function ($r) use ($apiUrl) {
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

        return new JsonResponse(['coaches' => $coaches]);
    }
}
