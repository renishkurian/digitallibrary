<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            {{ __('Manage Comics') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <!-- Upload & Sync Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Upload New Comic</h3>
                    <form action="{{ route('admin.comics.upload') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        <input type="file" name="comic" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4" required>
                        <x-primary-button>Upload PDF</x-primary-button>
                    </form>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col justify-center">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Library Sync</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan the system folder for new PDF files and import them.</p>
                    <form action="{{ route('admin.comics.sync') }}" method="POST">
                        @csrf
                        <x-secondary-button type="submit">Sync Now</x-secondary-button>
                    </form>
                </div>
            </div>

            <!-- Comics Table -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900 dark:text-gray-100">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            @foreach($comics as $comic)
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">{{ $comic->title }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ $comic->path }}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ $comic->is_hidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800' }}">
                                        {{ $comic->is_hidden ? 'Hidden' : 'Public' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <form action="{{ route('admin.comics.toggle-visibility', $comic) }}" method="POST">
                                        @csrf
                                        <button type="submit" class="text-indigo-600 hover:text-indigo-900">
                                            {{ $comic->is_hidden ? 'Show' : 'Hide' }}
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                    <div class="mt-4">
                        {{ $comics->links() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>