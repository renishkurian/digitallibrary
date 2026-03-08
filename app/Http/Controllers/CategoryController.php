<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    public function show(Category $category)
    {
        $comics = $category->comics()
            ->visible()
            ->latest()
            ->paginate(28)
            ->through(fn($comic) => [
                'id' => $comic->id,
                'title' => $comic->title,
                'thumbnail' => $comic->thumbnail,
                'is_read' => Auth::check() ? $comic->isReadBy(Auth::user()) : false,
            ]);

        return Inertia::render('Categories/Show', [
            'category' => $category,
            'comics' => $comics,
            'breadcrumbs' => $this->getBreadcrumbs($category),
        ]);
    }

    public function adminIndex()
    {
        $categories = Category::with('parent')->orderBy('parent_id')->orderBy('sort_order')->get();
        $parentCategories = Category::whereNull('parent_id')->get();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        Category::create($request->all());

        return back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        $category->update($request->all());

        return back()->with('success', 'Category updated successfully.');
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
