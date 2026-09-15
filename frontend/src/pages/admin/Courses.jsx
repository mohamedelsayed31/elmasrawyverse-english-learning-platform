import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  FileText,
  GraduationCap,
  Layers3,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../services/api";


const emptyForm = {
  title: "",
  instructor_id: "",
  grade_id: "",
  category: "",
  status: "Published",
  lessons: 0,
  price: 0,
};


import {
  useLanguage,
} from "../../context/LanguageContext";


function Courses() {
  const { tr } = useLanguage();

  const navigate =
    useNavigate();


  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    instructors,
    setInstructors,
  ] = useState([]);

  const [
    stages,
    setStages,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    stageFilter,
    setStageFilter,
  ] = useState("all");

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    editingCourse,
    setEditingCourse,
  ] = useState(null);

  const [
    selectedStageId,
    setSelectedStageId,
  ] = useState("");

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    pageError,
    setPageError,
  ] = useState("");


  // =====================================
  // Load Data
  // =====================================

  const fetchData =
    async () => {

      try {

        setLoading(true);
        setPageError("");


        const [
          coursesResult,
          instructorsResult,
          academicResult,
        ] = await Promise.allSettled([
          api.get("/courses"),
          api.get("/instructors"),
          api.get(
            "/public/academic-structure"
          ),
        ]);


        if (
          coursesResult.status ===
          "rejected"
        ) {
          throw coursesResult.reason;
        }


        if (
          instructorsResult.status ===
          "rejected"
        ) {
          throw instructorsResult.reason;
        }


        setCourses(
          coursesResult.value
            .data
            .courses ||
          []
        );


        setInstructors(
          instructorsResult.value
            .data
            .instructors ||
          []
        );


        if (
          academicResult.status ===
          "fulfilled"
        ) {

          setStages(
            academicResult.value
              .data
              .stages ||
            []
          );

        } else {

          // Older backend snapshots did not
          // expose the academic hierarchy here.
          // The page still works without it.
          setStages([]);
        }

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to load courses."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchData();
  }, []);


  // =====================================
  // Academic Helpers
  // =====================================

  const availableGrades =
    useMemo(
      () => {

        if (!selectedStageId) {
          return [];
        }


        const stage =
          stages.find(
            (item) =>
              Number(item.id) ===
              Number(
                selectedStageId
              )
          );


        return (
          stage?.grades ||
          []
        );
      },
      [
        stages,
        selectedStageId,
      ]
    );


  const findStageForGrade =
    (gradeId) => {

      if (!gradeId) {
        return "";
      }


      const stage =
        stages.find(
          (item) =>
            item.grades?.some(
              (grade) =>
                Number(grade.id) ===
                Number(gradeId)
            )
        );


      return (
        stage?.id ||
        ""
      );
    };


  const courseStageId =
    (course) => {

      return (
        course?.grade
          ?.academic_stage
          ?.id ||
        course?.grade
          ?.academicStage
          ?.id ||
        findStageForGrade(
          course?.grade_id
        )
      );
    };


  const courseStageName =
    (course) => {

      return (
        course?.grade
          ?.academic_stage
          ?.name ||
        course?.grade
          ?.academicStage
          ?.name ||
        ""
      );
    };


  // =====================================
  // Normalize / Filter
  // =====================================

  const normalizedCourses =
    useMemo(
      () =>
        courses.map(
          (course) => ({
            ...course,

            instructorName:
              course.instructor
                ?.name ||
              "-",

            stageName:
              courseStageName(
                course
              ),

            stageId:
              courseStageId(
                course
              ),

            gradeName:
              course.grade
                ?.name ||
              "",

            enrolledCount:
              Number(
                course.enrolled ??
                course
                  .enrollments_count ??
                course
                  .students_count ??
                0
              ) || 0,

            lessonsCount:
              Number(
                course.lessons ??
                course
                  .lessons_count ??
                0
              ) || 0,

            numericPrice:
              Number(
                course.price
              ) || 0,
          })
        ),
      [
        courses,
        stages,
      ]
    );


  const filteredCourses =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        return normalizedCourses.filter(
          (course) => {

            const matchesSearch =
              !term ||
              [
                course.title,
                course.instructorName,
                course.category,
                course.stageName,
                course.gradeName,
              ]
                .join(" ")
                .toLowerCase()
                .includes(term);


            const matchesStatus =
              statusFilter ===
                "all" ||
              course.status ===
                statusFilter;


            const matchesStage =
              stageFilter ===
                "all" ||
              Number(
                course.stageId
              ) ===
                Number(
                  stageFilter
                );


            return (
              matchesSearch &&
              matchesStatus &&
              matchesStage
            );
          }
        );
      },
      [
        normalizedCourses,
        search,
        statusFilter,
        stageFilter,
      ]
    );


  // =====================================
  // Summary
  // =====================================

  const publishedCount =
    normalizedCourses.filter(
      (course) =>
        course.status ===
        "Published"
    ).length;


  const draftCount =
    normalizedCourses.filter(
      (course) =>
        course.status ===
        "Draft"
    ).length;


  const totalEnrolled =
    normalizedCourses.reduce(
      (
        total,
        course
      ) =>
        total +
        course.enrolledCount,
      0
    );


  // =====================================
  // Drawer
  // =====================================

  const openCreate =
    () => {

      setEditingCourse(null);

      setSelectedStageId("");

      setFormData({
        ...emptyForm,
      });

      setErrors({});
      setMessage("");
      setPageError("");

      setDrawerOpen(true);
    };


  const openEdit =
    (course) => {

      const gradeId =
        course.grade_id ||
        course.grade?.id ||
        "";


      const stageId =
        courseStageId(
          course
        );


      setEditingCourse(
        course
      );

      setSelectedStageId(
        stageId
      );


      setFormData({
        title:
          course.title ||
          "",

        instructor_id:
          course.instructor_id ||
          course.instructor?.id ||
          "",

        grade_id:
          gradeId,

        category:
          course.category ||
          "",

        status:
          course.status ||
          "Published",

        lessons:
          Number(
            course.lessons ??
            course.lessons_count ??
            0
          ) || 0,

        price:
          Number(
            course.price
          ) || 0,
      });


      setErrors({});
      setMessage("");
      setPageError("");

      setDrawerOpen(true);
    };


  const closeDrawer =
    () => {

      if (saving) {
        return;
      }


      setDrawerOpen(false);

      setEditingCourse(null);

      setSelectedStageId("");

      setFormData({
        ...emptyForm,
      });

      setErrors({});
    };


  // =====================================
  // Form
  // =====================================

  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      const numericFields = [
        "lessons",
        "price",
      ];


      setFormData(
        (current) => ({
          ...current,

          [name]:
            numericFields.includes(
              name
            )
              ? Number(value)
              : value,
        })
      );
    };


  const handleStageChange =
    (event) => {

      const value =
        event.target.value;


      setSelectedStageId(
        value
      );


      setFormData(
        (current) => ({
          ...current,
          grade_id: "",
        })
      );
    };


  const buildPayload =
    () => {

      const payload = {
        title:
          formData.title
            .trim(),

        instructor_id:
          Number(
            formData
              .instructor_id
          ),

        category:
          formData.category
            .trim(),

        status:
          formData.status,

        lessons:
          Number(
            formData.lessons
          ) || 0,

        price:
          Number(
            formData.price
          ) || 0,
      };


      /*
       * Current ElmasrawyVerse courses
       * use the Stage → Grade hierarchy.
       *
       * Older backend snapshots simply ignore
       * this extra request field.
       */
      if (
        formData.grade_id !==
          "" &&
        formData.grade_id !==
          null
      ) {

        payload.grade_id =
          Number(
            formData.grade_id
          );
      }


      return payload;
    };


  const handleSubmit =
    async (event) => {

      event.preventDefault();


      const localErrors = {};


      if (
        !formData.title.trim()
      ) {
        localErrors.title = [
          "Course title is required.",
        ];
      }


      if (
        !formData.instructor_id
      ) {
        localErrors.instructor_id = [
          "Choose an instructor.",
        ];
      }


      if (
        !formData.category.trim()
      ) {
        localErrors.category = [
          "Category is required.",
        ];
      }


      if (
        stages.length > 0 &&
        !formData.grade_id
      ) {
        localErrors.grade_id = [
          "Choose the academic grade.",
        ];
      }


      if (
        Object.keys(
          localErrors
        ).length > 0
      ) {

        setErrors(
          localErrors
        );

        return;
      }


      try {

        setSaving(true);
        setErrors({});
        setMessage("");
        setPageError("");


        const payload =
          buildPayload();


        if (editingCourse) {

          await api.put(
            `/courses/${editingCourse.id}`,
            payload
          );


          setMessage(
            "Course updated successfully."
          );

        } else {

          await api.post(
            "/courses",
            payload
          );


          setMessage(
            "Course created successfully."
          );
        }


        setDrawerOpen(false);

        setEditingCourse(null);

        setSelectedStageId("");

        setFormData({
          ...emptyForm,
        });


        await fetchData();

      } catch (error) {

        if (
          error.response?.status ===
          422
        ) {

          setErrors(
            error.response
              .data
              .errors ||
            {}
          );

        } else {

          setPageError(
            error.response?.data
              ?.message ||
            "Unable to save course."
          );
        }

      } finally {

        setSaving(false);
      }
    };


  // =====================================
  // Delete
  // =====================================

  const handleDelete =
    async (course) => {

      const confirmed =
        window.confirm(
          `Delete "${course.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          course.id
        );

        setMessage("");
        setPageError("");


        await api.delete(
          `/courses/${course.id}`
        );


        setMessage(
          "Course deleted successfully."
        );


        await fetchData();

      } catch (error) {

        /*
         * Backend intentionally blocks
         * deleting courses that already
         * have enrollments or assignments.
         */
        setPageError(
          error.response?.data
            ?.message ||
          "Unable to delete course."
        );

      } finally {

        setDeletingId(null);
      }
    };


  // =====================================
  // Helpers
  // =====================================

  const formatPrice =
    (value) => {

      const amount =
        Number(value) || 0;


      if (amount === 0) {
        return "Free";
      }


      return `${amount.toFixed(2)} EGP`;
    };


  if (loading) {

    return (
      <div className="premium-admin-loading">

        <span className="premium-spinner" />

        <p>{tr("Loading courses...")}</p>

      </div>
    );
  }


  return (
    <div className="premium-admin-crud premium-courses-page">

      {/* =================================
          Header
      ================================= */}

      <div className="premium-crud-heading">

        <div>

          <span>{tr("Learning")}</span>


          <h1>{tr("Courses")}</h1>


          <p>{tr("Create, organize and publish English courses by academic stage and grade.")}</p>

        </div>


        <button
          type="button"
          className="premium-add-button"
          onClick={openCreate}
        >
          <Plus size={16} />{tr("New course")}</button>

      </div>


      {message && (
        <div className="success-message">
          {message}
        </div>
      )}


      {pageError && (
        <div className="error-message">
          {pageError}
        </div>
      )}


      {/* =================================
          Summary
      ================================= */}

      <div className="premium-course-stats">

        <article>

          <div>
            <BookOpen size={18} />
          </div>

          <span>{tr("Total courses")}</span>

          <strong>
            {
              normalizedCourses
                .length
            }
          </strong>

        </article>


        <article>

          <div>
            <CheckCircle2 size={18} />
          </div>

          <span>{tr("Published")}</span>

          <strong>
            {publishedCount}
          </strong>

        </article>


        <article>

          <div>
            <FileText size={18} />
          </div>

          <span>{tr("Drafts")}</span>

          <strong>
            {draftCount}
          </strong>

        </article>


        <article>

          <div>
            <Users size={18} />
          </div>

          <span>{tr("Enrolled students")}</span>

          <strong>
            {totalEnrolled}
          </strong>

        </article>

      </div>


      {/* =================================
          Toolbar
      ================================= */}

      <div className="premium-course-toolbar">

        <div className="premium-crud-search">

          <Search size={17} />

          <input
            type="search"
            placeholder={tr("Search courses...")}
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        {stages.length > 0 && (

          <select
            className="premium-course-stage-filter"
            value={stageFilter}
            onChange={(event) =>
              setStageFilter(
                event.target.value
              )
            }
          >

            <option value="all">{tr("All stages")}</option>


            {stages.map(
              (stage) => (

                <option
                  key={stage.id}
                  value={stage.id}
                >
                  {stage.name}
                </option>

              )
            )}

          </select>

        )}


        <div className="premium-crud-filters">

          <button
            type="button"
            className={
              statusFilter ===
              "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "all"
              )
            }
          >{tr("All")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Published"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Published"
              )
            }
          >{tr("Published")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Draft"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Draft"
              )
            }
          >{tr("Draft")}</button>

        </div>


        <div className="premium-result-count">
          {
            filteredCourses
              .length
          }
          {" "}
          results
        </div>

      </div>


      {/* =================================
          Course Grid
      ================================= */}

      {filteredCourses.length ===
      0 ? (

        <div className="premium-admin-empty premium-course-empty">

          <BookOpen size={29} />

          <strong>{tr("No courses found.")}</strong>

          <span>{tr("Create a course or change your filters.")}</span>

        </div>

      ) : (

        <div className="premium-course-grid">

          {filteredCourses.map(
            (course) => (

              <article
                key={course.id}
                className="premium-course-card"
              >

                <div className="premium-course-card-top">

                  <div className="premium-course-icon">
                    <BookOpen size={20} />
                  </div>


                  <span
                    className={
                      course.status ===
                      "Published"
                        ? "premium-status active"
                        : "premium-status draft"
                    }
                  >
                    {course.status}
                  </span>

                </div>


                <div className="premium-course-academic">

                  {
                    course.stageName ||
                    course.gradeName
                      ? (
                        <>
                          {
                            course.stageName
                          }

                          {
                            course.gradeName
                              ? ` • ${course.gradeName}`
                              : ""
                          }
                        </>
                      )
                      : (
                        course.category ||
                        "English Course"
                      )
                  }

                </div>


                <h2>
                  {course.title}
                </h2>


                <div className="premium-course-instructor">

                  <UserRound size={14} />

                  <span>
                    {
                      course
                        .instructorName
                    }
                  </span>

                </div>


                <div className="premium-course-meta-grid">

                  <div>

                    <Layers3 size={15} />

                    <span>{tr("Lessons")}</span>

                    <strong>
                      {
                        course
                          .lessonsCount
                      }
                    </strong>

                  </div>


                  <div>

                    <Users size={15} />

                    <span>{tr("Students")}</span>

                    <strong>
                      {
                        course
                          .enrolledCount
                      }
                    </strong>

                  </div>


                  <div>

                    <CircleDollarSign
                      size={15}
                    />

                    <span>{tr("Price")}</span>

                    <strong>
                      {
                        formatPrice(
                          course
                            .numericPrice
                        )
                      }
                    </strong>

                  </div>

                </div>


                <div className="premium-course-category">

                  <span>{tr("Category")}</span>

                  <strong>
                    {
                      course.category ||
                      "-"
                    }
                  </strong>

                </div>


                <div className="premium-course-actions">

                  <button
                    type="button"
                    className="premium-course-content-btn"
                    onClick={() =>
                      navigate(
                        `/admin/courses/${course.id}/content`
                      )
                    }
                  >
                    <BookOpen size={14} />{tr("Content")}</button>


                  <button
                    type="button"
                    className="premium-course-edit-btn"
                    onClick={() =>
                      openEdit(
                        course
                      )
                    }
                  >
                    <Edit3 size={14} />{tr("Edit")}</button>


                  <button
                    type="button"
                    className="premium-course-delete-btn"
                    onClick={() =>
                      handleDelete(
                        course
                      )
                    }
                    disabled={
                      deletingId ===
                      course.id
                    }
                    aria-label={`Delete ${course.title}`}
                  >
                    <Trash2 size={14} />

                    {
                      deletingId ===
                      course.id
                        ? "..."
                        : ""
                    }

                  </button>

                </div>

              </article>

            )
          )}

        </div>

      )}


      {/* =================================
          Create / Edit Drawer
      ================================= */}

      {drawerOpen && (

        <>

          <button
            type="button"
            className="premium-drawer-backdrop"
            onClick={closeDrawer}
            aria-label={tr("Close course panel")}
          />


          <aside className="premium-edit-drawer premium-course-drawer">

            <div className="premium-drawer-head">

              <div>

                <span>{tr("Course")}</span>


                <h2>
                  {
                    editingCourse
                      ? "Edit course"
                      : "Create new course"
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={closeDrawer}
                aria-label={tr("Close")}
              >
                <X size={18} />
              </button>

            </div>


            <form
              className="premium-edit-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="premium-course-form-section">

                <div className="premium-course-form-section-title">

                  <BookOpen size={16} />

                  <div>

                    <strong>{tr("Course details")}</strong>

                    <span>{tr("Basic information students will see.")}</span>

                  </div>

                </div>


                <div className="premium-field">

                  <label>{tr("Course title")}</label>


                  <input
                    type="text"
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={tr("Example: English Grade 3")}
                  />


                  {errors.title && (
                    <span className="field-error">
                      {errors.title[0]}
                    </span>
                  )}

                </div>


                <div className="premium-field">

                  <label>{tr("Instructor")}</label>


                  <select
                    name="instructor_id"
                    value={
                      formData
                        .instructor_id
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">{tr("Select instructor")}</option>


                    {instructors.map(
                      (instructor) => (

                        <option
                          key={
                            instructor.id
                          }
                          value={
                            instructor.id
                          }
                        >
                          {
                            instructor.name
                          }
                        </option>

                      )
                    )}

                  </select>


                  {errors.instructor_id && (
                    <span className="field-error">
                      {
                        errors
                          .instructor_id[0]
                      }
                    </span>
                  )}

                </div>

              </div>


              {stages.length > 0 && (

                <div className="premium-course-form-section">

                  <div className="premium-course-form-section-title">

                    <GraduationCap
                      size={16}
                    />

                    <div>

                      <strong>{tr("Academic placement")}</strong>

                      <span>{tr("Choose the school stage and grade.")}</span>

                    </div>

                  </div>


                  <div className="premium-field">

                    <label>{tr("Academic stage")}</label>


                    <select
                      value={
                        selectedStageId
                      }
                      onChange={
                        handleStageChange
                      }
                    >

                      <option value="">{tr("Select stage")}</option>


                      {stages.map(
                        (stage) => (

                          <option
                            key={
                              stage.id
                            }
                            value={
                              stage.id
                            }
                          >
                            {stage.name}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="premium-field">

                    <label>{tr("Grade")}</label>


                    <select
                      name="grade_id"
                      value={
                        formData.grade_id
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        !selectedStageId
                      }
                    >

                      <option value="">{tr("Select grade")}</option>


                      {availableGrades.map(
                        (grade) => (

                          <option
                            key={
                              grade.id
                            }
                            value={
                              grade.id
                            }
                          >
                            {grade.name}
                          </option>

                        )
                      )}

                    </select>


                    {errors.grade_id && (
                      <span className="field-error">
                        {
                          errors
                            .grade_id[0]
                        }
                      </span>
                    )}

                  </div>

                </div>

              )}


              <div className="premium-course-form-section">

                <div className="premium-course-form-section-title">

                  <Layers3 size={16} />

                  <div>

                    <strong>{tr("Publishing")}</strong>

                    <span>{tr("Category, status and course metadata.")}</span>

                  </div>

                </div>


                <div className="premium-field">

                  <label>{tr("Category")}</label>


                  <input
                    type="text"
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={tr("Example: English")}
                  />


                  {errors.category && (
                    <span className="field-error">
                      {
                        errors
                          .category[0]
                      }
                    </span>
                  )}

                </div>


                <div className="premium-course-form-two">

                  <div className="premium-field">

                    <label>{tr("Lessons")}</label>


                    <input
                      type="number"
                      name="lessons"
                      min="0"
                      value={
                        formData.lessons
                      }
                      onChange={
                        handleChange
                      }
                    />


                    {errors.lessons && (
                      <span className="field-error">
                        {
                          errors
                            .lessons[0]
                        }
                      </span>
                    )}

                  </div>


                  <div className="premium-field">

                    <label>{tr("Price (EGP)")}</label>


                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={
                        formData.price
                      }
                      onChange={
                        handleChange
                      }
                    />


                    {errors.price && (
                      <span className="field-error">
                        {
                          errors
                            .price[0]
                        }
                      </span>
                    )}

                  </div>

                </div>


                <div className="premium-field">

                  <label>{tr("Status")}</label>


                  <div className="premium-course-status-picker">

                    <button
                      type="button"
                      className={
                        formData.status ===
                        "Published"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setFormData(
                          (current) => ({
                            ...current,
                            status:
                              "Published",
                          })
                        )
                      }
                    >
                      <CheckCircle2
                        size={14}
                      />{tr("Published")}</button>


                    <button
                      type="button"
                      className={
                        formData.status ===
                        "Draft"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setFormData(
                          (current) => ({
                            ...current,
                            status:
                              "Draft",
                          })
                        )
                      }
                    >
                      <FileText
                        size={14}
                      />{tr("Draft")}</button>

                  </div>


                  {errors.status && (
                    <span className="field-error">
                      {errors.status[0]}
                    </span>
                  )}

                </div>

              </div>


              <div className="premium-course-form-preview">

                <div className="premium-course-preview-icon">
                  <BookOpen size={18} />
                </div>


                <div>

                  <span>{tr("Preview")}</span>

                  <strong>
                    {
                      formData.title ||
                      "Untitled course"
                    }
                  </strong>

                  <small>

                    {
                      instructors.find(
                        (item) =>
                          Number(
                            item.id
                          ) ===
                          Number(
                            formData
                              .instructor_id
                          )
                      )?.name ||
                      "No instructor"
                    }

                    {" • "}

                    {
                      formData.status
                    }

                  </small>

                </div>

              </div>


              <div className="premium-drawer-actions">

                <button
                  type="button"
                  className="premium-cancel-btn"
                  onClick={closeDrawer}
                >{tr("Cancel")}</button>


                <button
                  type="submit"
                  className="premium-save-btn"
                  disabled={saving}
                >
                  {
                    saving
                      ? "Saving..."
                      : editingCourse
                        ? "Save changes"
                        : "Create course"
                  }
                </button>

              </div>

            </form>

          </aside>

        </>

      )}

    </div>
  );
}


export default Courses;
