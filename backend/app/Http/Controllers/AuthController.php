<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;


class AuthController extends Controller
{
    // =====================================
    // Register
    // =====================================

    public function register(
        Request $request
    ) {
        $validated =
            $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'email' => [
                    'required',
                    'email',
                    'unique:users,email',
                    'unique:students,email',
                ],

                'phone' => [
                    'required',
                    'string',
                    'max:20',
                ],

                'password' => [
                    'required',
                    'string',
                    'min:6',
                    'confirmed',
                ],
            ]);


        $user =
            DB::transaction(
                function () use (
                    $validated
                ) {

                    // =========================
                    // Create Login Account
                    // =========================

                    $user =
                        User::create([
                            'name' =>
                                $validated['name'],

                            'email' =>
                                $validated['email'],

                            'password' =>
                                Hash::make(
                                    $validated[
                                        'password'
                                    ]
                                ),

                            /*
                            | Keep the current project
                            | student role value.
                            |
                            | Admin accounts use "admin".
                            | Normal registered accounts
                            | use "user".
                            */
                            'role' =>
                                'user',

                            'status' =>
                                '1',
                        ]);


                    // =========================
                    // Create Student Profile
                    // =========================

                    Student::create([
                        'user_id' =>
                            $user->id,

                        'name' =>
                            $validated['name'],

                        'email' =>
                            $validated['email'],

                        'phone' =>
                            $validated['phone'],

                        'status' =>
                            'Active',

                        /*
                        | Legacy field.
                        | Real course progress is
                        | stored on Enrollment.
                        */
                        'progress' =>
                            0,
                    ]);


                    return $user;
                }
            );


        // =====================================
        // Sanctum Token
        // =====================================

        $token =
            $user
                ->createToken(
                    'auth_token'
                )
                ->plainTextToken;


        $user->load(
            'student'
        );


        return response()->json([
            'message' =>
                'Registered successfully',

            'user' =>
                $user,

            'token' =>
                $token,
        ], 201);
    }


    // =====================================
    // Login
    // =====================================

    public function login(
        Request $request
    ) {
        $validated =
            $request->validate([
                'email' => [
                    'required',
                    'email',
                ],

                'password' => [
                    'required',
                ],
            ]);


        $user =
            User::with(
                'student'
            )
                ->where(
                    'email',
                    $validated['email']
                )
                ->first();


        // =====================================
        // Credentials
        // =====================================

        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {

            return response()->json([
                'message' =>
                    'Invalid email or password'
            ], 401);
        }


        // =====================================
        // User Account Status
        // =====================================

        if (
            (string)
            $user->status ===
            '0'
        ) {

            return response()->json([
                'message' =>
                    'Your account is inactive'
            ], 403);
        }


        // =====================================
        // Student Profile Status
        // =====================================

        if (
            $user->student &&
            $user->student->status ===
            'Inactive'
        ) {

            return response()->json([
                'message' =>
                    'Your account is inactive'
            ], 403);
        }


        // =====================================
        // Sanctum Token
        // =====================================

        $token =
            $user
                ->createToken(
                    'auth_token'
                )
                ->plainTextToken;


        return response()->json([
            'message' =>
                'Logged in successfully',

            'user' =>
                $user,

            'token' =>
                $token,
        ]);
    }


    // =====================================
    // Current User
    // =====================================

    public function me(
        Request $request
    ) {
        $user =
            $request
                ->user()
                ->load(
                    'student'
                );


        return response()->json([
            'user' =>
                $user
        ]);
    }


    // =====================================
    // Logout
    // =====================================

    public function logout(
        Request $request
    ) {
        $token =
            $request
                ->user()
                ->currentAccessToken();


        if ($token) {
            $token->delete();
        }


        return response()->json([
            'message' =>
                'Logged out successfully'
        ]);
    }
}
