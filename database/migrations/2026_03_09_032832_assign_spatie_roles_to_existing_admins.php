<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $adminRole  = Role::firstOrCreate(['name' => 'admin']);
        $viewerRole = Role::firstOrCreate(['name' => 'viewer']);

        // Assign admin role to existing admins
        User::where('is_admin', true)->each(function (User $user) use ($adminRole) {
            $user->assignRole($adminRole);
        });

        // Assign viewer role to all others
        User::where('is_admin', false)->each(function (User $user) use ($viewerRole) {
            $user->assignRole($viewerRole);
        });
    }

    public function down(): void
    {
        Role::whereIn('name', ['admin', 'viewer'])->delete();
    }
};
