<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStudent
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Student access in this project
        |--------------------------------------------------------------------------
        |
        | Registered students currently use:
        |
        |     users.role = "user"
        |
        | and have a linked Student profile.
        |
        | Therefore student authorization must be based on the linked
        | Student profile, not on checking role === "student".
        |
        */

        if (
            !$user ||
            !$user->student
        ) {
            return response()->json([
                'message' =>
                    'Unauthorized. Student access only.'
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | Disabled account / student profile
        |--------------------------------------------------------------------------
        */

        if (
            (string) $user->status === '0' ||
            $user->student->status !== 'Active'
        ) {
            return response()->json([
                'message' =>
                    'Your student account is inactive.'
            ], 403);
        }


        return $next($request);
    }
}
