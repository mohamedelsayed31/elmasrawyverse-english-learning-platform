<?php

namespace App\Http\Controllers;

use App\Models\CourseSection;
use App\Models\SectionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class SectionItemController extends Controller
{
    // =====================================
    // List Section Items
    // =====================================

    public function index($courseId, $sectionId)
    {
        $section = CourseSection::where(
            'course_id',
            $courseId
        )
            ->where('id', $sectionId)
            ->first();


        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }


        $items = $section->items()
            ->orderBy('sort_order')
            ->get();


        return response()->json([
            'section' => $section,
            'items' => $items
        ]);
    }


    // =====================================
    // Create Section Item
    // =====================================

    public function store(
        Request $request,
        $courseId,
        $sectionId
    ) {
        $section = CourseSection::where(
            'course_id',
            $courseId
        )
            ->where('id', $sectionId)
            ->first();


        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }


        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255'
            ],

            'type' => [
                'required',
                'in:video,pdf,text,audio,link'
            ],

            'description' => [
                'nullable',
                'string'
            ],

            'content' => [
                'nullable',
                'string'
            ],

            'resource_url' => [
                'nullable',
                'url',
                'max:2048'
            ],

            'file' => [
                'nullable',
                'file',
                'max:51200',
                'mimes:pdf,mp3,wav,m4a,aac,ogg'
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0'
            ],

            'status' => [
                'required',
                'in:Draft,Published'
            ],

            'is_preview' => [
                'nullable',
                'boolean'
            ],
        ]);


        $this->validateItemContent(
            $request,
            $validated['type']
        );


        $filePath = null;


        if ($request->hasFile('file')) {

            $filePath = $request
                ->file('file')
                ->store(
                    "course-content/course-{$courseId}/section-{$sectionId}",
                    'public'
                );
        }


        $sortOrder =
            $validated['sort_order']
            ?? (
                ($section->items()
                    ->max('sort_order') ?? 0)
                + 1
            );


        $item = $section->items()->create([
            'title' =>
                $validated['title'],

            'type' =>
                $validated['type'],

            'description' =>
                $validated['description']
                ?? null,

            'content' =>
                $validated['type'] === 'text'
                    ? ($validated['content'] ?? null)
                    : null,

            'resource_url' =>
                in_array(
                    $validated['type'],
                    ['video', 'audio', 'link']
                )
                    ? ($validated['resource_url'] ?? null)
                    : null,

            'file_path' =>
                $filePath,

            'sort_order' =>
                $sortOrder,

            'status' =>
                $validated['status'],

            'is_preview' =>
                (bool) (
                    $validated['is_preview']
                    ?? false
                ),

            'published_at' =>
                $validated['status'] === 'Published'
                    ? now()
                    : null,
        ]);


        return response()->json([
            'message' =>
                'Content added successfully',

            'item' => $item
        ], 201);
    }


    // =====================================
    // Show Item
    // =====================================

    public function show(
        $courseId,
        $sectionId,
        $itemId
    ) {
        $section = $this->findSection(
            $courseId,
            $sectionId
        );


        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }


        $item = SectionItem::where(
            'course_section_id',
            $section->id
        )
            ->where('id', $itemId)
            ->first();


        if (!$item) {
            return response()->json([
                'message' => 'Content not found'
            ], 404);
        }


        return response()->json([
            'item' => $item
        ]);
    }


    // =====================================
    // Update Item
    // =====================================

    public function update(
        Request $request,
        $courseId,
        $sectionId,
        $itemId
    ) {
        $section = $this->findSection(
            $courseId,
            $sectionId
        );


        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }


        $item = SectionItem::where(
            'course_section_id',
            $section->id
        )
            ->where('id', $itemId)
            ->first();


        if (!$item) {
            return response()->json([
                'message' => 'Content not found'
            ], 404);
        }


        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255'
            ],

            'type' => [
                'required',
                'in:video,pdf,text,audio,link'
            ],

            'description' => [
                'nullable',
                'string'
            ],

            'content' => [
                'nullable',
                'string'
            ],

            'resource_url' => [
                'nullable',
                'url',
                'max:2048'
            ],

            'file' => [
                'nullable',
                'file',
                'max:51200',
                'mimes:pdf,mp3,wav,m4a,aac,ogg'
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0'
            ],

            'status' => [
                'required',
                'in:Draft,Published'
            ],

            'is_preview' => [
                'nullable',
                'boolean'
            ],
        ]);


        $this->validateItemContent(
            $request,
            $validated['type'],
            $item
        );


        $filePath = $item->file_path;


        /*
        |--------------------------------------------------------------------------
        | Remove old file when changing to
        | non-file content.
        |--------------------------------------------------------------------------
        */

        if (
            !in_array(
                $validated['type'],
                ['pdf', 'audio']
            )
        ) {

            if ($filePath) {

                Storage::disk('public')
                    ->delete($filePath);

                $filePath = null;
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Replace uploaded file
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('file')) {

            if ($filePath) {

                Storage::disk('public')
                    ->delete($filePath);
            }


            $filePath = $request
                ->file('file')
                ->store(
                    "course-content/course-{$courseId}/section-{$sectionId}",
                    'public'
                );
        }


        $wasPublished =
            $item->status === 'Published';


        $item->update([
            'title' =>
                $validated['title'],

            'type' =>
                $validated['type'],

            'description' =>
                $validated['description']
                ?? null,

            'content' =>
                $validated['type'] === 'text'
                    ? ($validated['content'] ?? null)
                    : null,

            'resource_url' =>
                in_array(
                    $validated['type'],
                    ['video', 'audio', 'link']
                )
                    ? ($validated['resource_url'] ?? null)
                    : null,

            'file_path' =>
                $filePath,

            'sort_order' =>
                $validated['sort_order']
                ?? $item->sort_order,

            'status' =>
                $validated['status'],

            'is_preview' =>
                (bool) (
                    $validated['is_preview']
                    ?? false
                ),

            'published_at' =>
                $validated['status'] === 'Published'
                    ? (
                        $wasPublished
                            ? $item->published_at
                            : now()
                    )
                    : null,
        ]);


        return response()->json([
            'message' =>
                'Content updated successfully',

            'item' => $item->fresh()
        ]);
    }


    // =====================================
    // Delete Item
    // =====================================

    public function destroy(
        $courseId,
        $sectionId,
        $itemId
    ) {
        $section = $this->findSection(
            $courseId,
            $sectionId
        );


        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }


        $item = SectionItem::where(
            'course_section_id',
            $section->id
        )
            ->where('id', $itemId)
            ->first();


        if (!$item) {
            return response()->json([
                'message' => 'Content not found'
            ], 404);
        }


        if ($item->file_path) {

            Storage::disk('public')
                ->delete($item->file_path);
        }


        $item->delete();


        return response()->json([
            'message' =>
                'Content deleted successfully'
        ]);
    }


    // =====================================
    // Helpers
    // =====================================

    private function findSection(
        $courseId,
        $sectionId
    ) {
        return CourseSection::where(
            'course_id',
            $courseId
        )
            ->where('id', $sectionId)
            ->first();
    }


    private function validateItemContent(
        Request $request,
        string $type,
        ?SectionItem $existingItem = null
    ): void {

        /*
        |--------------------------------------------------------------------------
        | Text
        |--------------------------------------------------------------------------
        */

        if (
            $type === 'text'
            && !$request->filled('content')
        ) {

            throw ValidationException::withMessages([
                'content' =>
                    ['Text content is required.']
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Video / External Link
        |--------------------------------------------------------------------------
        */

        if (
            in_array(
                $type,
                ['video', 'link']
            )
            && !$request->filled(
                'resource_url'
            )
        ) {

            throw ValidationException::withMessages([
                'resource_url' =>
                    ['A valid URL is required.']
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | PDF
        |--------------------------------------------------------------------------
        */

        if ($type === 'pdf') {

            $hasExistingPdf =
                $existingItem
                && $existingItem->type === 'pdf'
                && $existingItem->file_path;


            if (
                !$request->hasFile('file')
                && !$hasExistingPdf
            ) {

                throw ValidationException::withMessages([
                    'file' =>
                        ['A PDF file is required.']
                ]);
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Audio
        |--------------------------------------------------------------------------
        */

        if ($type === 'audio') {

            $hasExistingAudio =
                $existingItem
                && $existingItem->type === 'audio'
                && $existingItem->file_path;


            if (
                !$request->hasFile('file')
                && !$request->filled(
                    'resource_url'
                )
                && !$hasExistingAudio
            ) {

                throw ValidationException::withMessages([
                    'file' => [
                        'Upload an audio file or provide an audio URL.'
                    ]
                ]);
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Prevent files on unsupported types
        |--------------------------------------------------------------------------
        */

        if (
            $request->hasFile('file')
            && !in_array(
                $type,
                ['pdf', 'audio']
            )
        ) {

            throw ValidationException::withMessages([
                'file' => [
                    'File upload is only available for PDF and audio content.'
                ]
            ]);
        }
    }
}