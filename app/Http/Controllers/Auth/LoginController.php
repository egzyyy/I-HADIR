<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request)
    {
        $credentials = $request->validate([
            'ic_number' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // FIRST: Check if the user exists and their user_type
        $user = \App\Models\User::where('ic_number', $request->ic_number)->first();
        
        if ($user) {
            // Check user_type BEFORE attempting authentication
            if (!in_array($user->user_type, ['admin', 'teacher', 'security_staff'])) {
                throw ValidationException::withMessages([
                    'ic_number' => 'You are not authorized to log in. Only teachers and security staff can access the system.',
                ]);
            }
            
            // Check if user has a password set
            if (is_null($user->password) || empty($user->password)) {
                throw ValidationException::withMessages([
                    'ic_number' => 'Your account does not have login access. Please contact the administrator to set up your password.',
                ]);
            }
        }

        // SECOND: Attempt authentication with credentials
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return response()->noContent();
        }

        // THIRD: If authentication fails, show generic error
        throw ValidationException::withMessages([
            'ic_number' => __('auth.failed'),
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->noContent();
    }
}