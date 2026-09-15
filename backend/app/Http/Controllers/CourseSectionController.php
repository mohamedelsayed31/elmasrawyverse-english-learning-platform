<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\Request;

class CourseSectionController extends Controller
{
    public function index($courseId)
    {
        $course = Course::find($courseId);

        if (!$course) {
            return response()->json([
                'message' => 'Course not found'
            ], 404);
        }

        $sections = $course->sections()
        ->withCount('items')
        ->orderBy('sort_order')
        ->get();

        return response()->json([
            'course' => $course,
            'sections' => $sections
        ]);
    }


    public function store(Request $request, $courseId)
    {
        $course = Course::find($courseId);

        if (!$course) {
            return response()->json([
                'message' => 'Course not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:Draft,Published',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $sortOrder = $validated['sort_order']
            ?? (($course->sections()->max('sort_order') ?? 0) + 1);

        $section = $course->sections()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'sort_order' => $sortOrder,
            'published_at' =>
                $validated['status'] === 'Published'
                    ? now()
                    : null,
        ]);

        return response()->json([
            'message' => 'Section created successfully',
            'section' => $section
        ], 201);
    }


    public function show($courseId, $sectionId)
    {
        $section = CourseSection::where('course_id', $courseId)
            ->find($sectionId);

        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }

        return response()->json([
            'section' => $section
        ]);
    }


    public function update(
        Request $request,
        $courseId,
        $sectionId
    ) {
        $section = CourseSection::where('course_id', $courseId)
            ->find($sectionId);

        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:Draft,Published',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $wasPublished = $section->status === 'Published';

        $section->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'sort_order' =>
                $validated['sort_order']
                ?? $section->sort_order,

            'published_at' =>
                $validated['status'] === 'Published'
                    ? ($wasPublished
                        ? $section->published_at
                        : now())
                    : null,
        ]);

        return response()->json([
            'message' => 'Section updated successfully',
            'section' => $section
        ]);
    }


    public function destroy($courseId, $sectionId)
    {
        $section = CourseSection::where(
            'course_id',
            $courseId
        )
            ->withCount('items')
            ->find($sectionId);
    
    
        if (!$section) {
            return response()->json([
                'message' => 'Section not found'
            ], 404);
        }
    
    
        if ($section->items_count > 0) {
            return response()->json([
                'message' =>
                    'Cannot delete this section because it contains content. Delete the content first.'
            ], 409);
        }
    
    
        $section->delete();
    
    
        return response()->json([
            'message' => 'Section deleted successfully'
        ]);
    }
}