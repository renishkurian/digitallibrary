<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles')
            ->withCount('readComics')
            ->orderBy('name')
            ->paginate(50)
            ->through(fn($user) => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'roles'       => $user->getRoleNames(),
                'is_admin'    => $user->hasRole('admin'),
                'read_comics_count' => $user->read_comics_count,
                'created_at'  => $user->created_at?->format('M d, Y'),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => Role::pluck('name'),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only('name', 'email'));

        return back()->with('success', 'User updated successfully.');
    }

    public function assignRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        // Sync: remove all roles and assign only the selected one
        $user->syncRoles([$request->role]);

        // Keep is_admin column in sync for backwards compat
        $user->update(['is_admin' => $request->role === 'admin']);

        return back()->with('success', 'Role updated.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete yourself.');
        }

        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function readingStats()
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        // Total time per comic
        $comicStats = $user->readComics()
            ->withPivot('total_seconds_spent', 'last_read_page', 'updated_at')
            ->orderByDesc('comic_user.updated_at')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'thumbnail' => $c->thumbnail,
                'total_seconds' => (int) $c->pivot->total_seconds_spent,
                'last_page' => $c->pivot->last_read_page,
                'last_read' => $c->pivot->updated_at?->diffForHumans(),
            ]);

        // Daily logs (last 30 days)
        $dailyLogs = \App\Models\ReadingLog::with('comic')
            ->where('user_id', $user->id)
            ->where('date', '>=', now()->subDays(30)->toDateString())
            ->orderByDesc('date')
            ->get()
            ->groupBy(fn($log) => $log->date->toDateString())
            ->map(fn($group, $date) => [
                'date' => \Carbon\Carbon::parse($date)->format('M d, Y'),
                'total_seconds' => $group->sum('seconds_spent'),
                'comics' => $group->map(fn($log) => [
                    'id' => $log->comic_id,
                    'title' => $log->comic?->title ?? 'Deleted Comic',
                    'seconds' => $log->seconds_spent,
                ]),
            ])
            ->values();

        return Inertia::render('Users/ReadingStats', [
            'comicStats' => $comicStats,
            'dailyLogs' => $dailyLogs,
        ]);
    }
}
