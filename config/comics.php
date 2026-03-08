<?php

return [
    'base_dir' => env('COMIC_BASE_DIR', storage_path('app/comics')),
    'thumb_dir' => env('COMIC_THUMB_DIR', public_path('thumbs')),
];
