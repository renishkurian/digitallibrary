<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class CategoryController extends Controller
{
    public function show(Category $category)
    {
        $comics = $category->comics()
            ->withCount('readers')
            ->visible()
            ->latest()
            ->paginate(28)
            ->through(fn($comic) => [
                'id' => $comic->id,
                'title' => $comic->title,
                'thumbnail' => $comic->thumbnail,
                'is_read' => Auth::check() ? $comic->isReadBy(Auth::user()) : false,
                'readers_count' => $comic->readers_count,
                'share_url' => $comic->share_url,
                'rating' => $comic->rating,
                'tags' => $comic->tags,
            ]);

        return Inertia::render('Categories/Show', [
            'category' => $category,
            'comics' => $comics,
            'breadcrumbs' => $this->getBreadcrumbs($category),
        ]);
    }

    public function adminIndex()
    {
        $categories = Category::with(['parent', 'sharedUsers', 'sharedRoles', 'user'])
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->get();
        $parentCategories = Category::whereNull('parent_id')->get();
        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $roles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_common' => 'boolean',
        ]);

        Category::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_common' => $request->boolean('is_common', true),
            'user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_common' => 'boolean',
        ]);

        $category->update([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_common' => $request->is_common,
        ]);

        return back()->with('success', 'Category updated successfully.');
    }

    public function shareWithUser(Request $request, Category $category)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $category->sharedUsers()->syncWithoutDetaching([$request->user_id]);
        return back()->with('success', 'Category shared with user.');
    }

    public function shareWithRole(Request $request, Category $category)
    {
        $request->validate(['role_id' => 'required|exists:roles,id']);
        $category->sharedRoles()->syncWithoutDetaching([$request->role_id]);
        return back()->with('success', 'Category shared with role.');
    }

    public function revokeUserShare(Category $category, User $user)
    {
        $category->sharedUsers()->detach($user->id);
        return back()->with('success', 'User access revoked.');
    }

    public function revokeRoleShare(Category $category, $roleId)
    {
        $category->sharedRoles()->detach($roleId);
        return back()->with('success', 'Role access revoked.');
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return back()->with('success', 'Category deleted successfully.');
    }

    protected function getBreadcrumbs(Category $category)
    {
        $breadcrumbs = [];
        $current = $category;

        while ($current) {
            array_unshift($breadcrumbs, [
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }
}
