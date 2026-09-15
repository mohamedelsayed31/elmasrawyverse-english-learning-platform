import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Edit3,
    FileText,
    Gauge,
    HelpCircle,
    Layers3,
    Plus,
    Search,
    Shuffle,
    Trash2,
    X,
  } from "lucide-react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import api
    from "../../services/api";
  
  
  const emptyForm = {
    course_id: "",
    course_section_id: "",
  
    title: "",
    description: "",
  
    type: "quiz",
  
    duration_minutes: "",
    passing_score: 70,
    max_attempts: "",
  
    shuffle_questions: false,
    show_answers_after_submit: true,
  
    status: "Draft",
  };
  import {
    useLanguage,
  } from "../../context/LanguageContext";
  

  
  
  function Assessments() {
    const { tr } = useLanguage();

    const navigate =
      useNavigate();
  
  
    const [
      stages,
      setStages,
    ] = useState([]);
  
    const [
      courses,
      setCourses,
    ] = useState([]);
  
    const [
      sections,
      setSections,
    ] = useState([]);
  
    const [
      assessments,
      setAssessments,
    ] = useState([]);
  
  
    const [
      selectedStageId,
      setSelectedStageId,
    ] = useState("");
  
    const [
      selectedGradeId,
      setSelectedGradeId,
    ] = useState("");
  
  
    const [
      formData,
      setFormData,
    ] = useState(emptyForm);
  
    const [
      editingId,
      setEditingId,
    ] = useState(null);
  
    const [
      drawerOpen,
      setDrawerOpen,
    ] = useState(false);
  
  
    const [
      search,
      setSearch,
    ] = useState("");
  
    const [
      typeFilter,
      setTypeFilter,
    ] = useState("all");
  
    const [
      statusFilter,
      setStatusFilter,
    ] = useState("all");
  
  
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
    // Grades
    // =====================================
  
    const availableGrades =
      useMemo(() => {
  
        const stage =
          stages.find(
            (item) =>
              Number(item.id) ===
              Number(
                selectedStageId
              )
          );
  
  
        return stage?.grades || [];
  
      }, [
        stages,
        selectedStageId,
      ]);
  
  
    // =====================================
    // Courses
    // =====================================
  
    const availableCourses =
      useMemo(() => {
  
        if (!selectedGradeId) {
          return [];
        }
  
  
        return courses.filter(
          (course) =>
            Number(course.grade_id) ===
            Number(
              selectedGradeId
            )
        );
  
      }, [
        courses,
        selectedGradeId,
      ]);
  
  
    // =====================================
    // Fetch Data
    // =====================================
  
    const fetchData =
      async () => {
  
        try {
  
          setLoading(true);
          setPageError("");
  
  
          const [
            academicResponse,
            coursesResponse,
            assessmentsResponse,
          ] = await Promise.all([
  
            api.get(
              "/public/academic-structure"
            ),
  
            api.get(
              "/courses"
            ),
  
            api.get(
              "/assessments"
            ),
  
          ]);
  
  
          setStages(
            academicResponse
              .data
              .stages ||
            []
          );
  
  
          setCourses(
            coursesResponse
              .data
              .courses ||
            []
          );
  
  
          setAssessments(
            assessmentsResponse
              .data
              .assessments ||
            []
          );
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to load assessments."
          );
  
        } finally {
  
          setLoading(false);
        }
      };
  
  
    useEffect(() => {
      fetchData();
    }, []);
  
  
    // =====================================
    // Load Sections
    // =====================================
  
    const loadSections =
      async (courseId) => {
  
        if (!courseId) {
  
          setSections([]);
          return;
        }
  
  
        try {
  
          const response =
            await api.get(
              `/courses/${courseId}/sections`
            );
  
  
          setSections(
            response.data
              .sections ||
            []
          );
  
        } catch (error) {
  
          setSections([]);
  
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to load sections."
          );
        }
      };
  
  
    // =====================================
    // Filters
    // =====================================
  
    const filteredAssessments =
      useMemo(() => {
  
        const term =
          search
            .trim()
            .toLowerCase();
  
  
        return assessments.filter(
          (assessment) => {
  
            const searchable =
              [
                assessment.title,
                assessment.type,
                assessment.status,
                assessment.course
                  ?.title,
                assessment.section
                  ?.title,
                assessment.course
                  ?.grade
                  ?.name,
                assessment.course
                  ?.grade
                  ?.academic_stage
                  ?.name,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
  
  
            const matchesSearch =
              !term ||
              searchable.includes(
                term
              );
  
  
            const matchesType =
              typeFilter === "all" ||
              assessment.type ===
                typeFilter;
  
  
            const matchesStatus =
              statusFilter === "all" ||
              assessment.status ===
                statusFilter;
  
  
            return (
              matchesSearch &&
              matchesType &&
              matchesStatus
            );
          }
        );
  
      }, [
        assessments,
        search,
        typeFilter,
        statusFilter,
      ]);
  
  
    // =====================================
    // Summary
    // =====================================
  
    const publishedCount =
      assessments.filter(
        (item) =>
          item.status ===
          "Published"
      ).length;
  
  
    const examCount =
      assessments.filter(
        (item) =>
          item.type === "exam"
      ).length;
  
  
    const questionCount =
      assessments.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.questions_count ||
            0
          ),
        0
      );
  
  
    // =====================================
    // Drawer
    // =====================================
  
    const openCreate =
      () => {
  
        setEditingId(null);
  
        setSelectedStageId("");
        setSelectedGradeId("");
  
        setSections([]);
  
        setFormData({
          ...emptyForm,
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
  
        setEditingId(null);
  
        setSelectedStageId("");
        setSelectedGradeId("");
  
        setSections([]);
  
        setFormData({
          ...emptyForm,
        });
  
        setErrors({});
      };
  
  
    // =====================================
    // Changes
    // =====================================
  
    const handleChange =
      (e) => {
  
        const {
          name,
          value,
          type,
          checked,
        } = e.target;
  
  
        setFormData(
          (current) => ({
            ...current,
  
            [name]:
              type === "checkbox"
                ? checked
                : value,
          })
        );
      };
  
  
    const handleStageChange =
      (e) => {
  
        setSelectedStageId(
          e.target.value
        );
  
        setSelectedGradeId("");
  
        setSections([]);
  
  
        setFormData(
          (current) => ({
            ...current,
            course_id: "",
            course_section_id: "",
          })
        );
      };
  
  
    const handleGradeChange =
      (e) => {
  
        setSelectedGradeId(
          e.target.value
        );
  
        setSections([]);
  
  
        setFormData(
          (current) => ({
            ...current,
            course_id: "",
            course_section_id: "",
          })
        );
      };
  
  
    const handleCourseChange =
      async (e) => {
  
        const courseId =
          e.target.value;
  
  
        setFormData(
          (current) => ({
            ...current,
  
            course_id:
              courseId
                ? Number(courseId)
                : "",
  
            course_section_id:
              "",
          })
        );
  
  
        await loadSections(
          courseId
        );
      };
  
  
    // =====================================
    // Submit
    // =====================================
  
    const handleSubmit =
      async (e) => {
  
        e.preventDefault();
  
  
        setSaving(true);
  
        setErrors({});
        setMessage("");
        setPageError("");
  
  
        try {
  
          const payload = {
            course_id:
              Number(
                formData.course_id
              ),
  
            course_section_id:
              formData
                .course_section_id
                ? Number(
                    formData
                      .course_section_id
                  )
                : null,
  
            title:
              formData.title,
  
            description:
              formData.description ||
              null,
  
            type:
              formData.type,
  
            duration_minutes:
              formData
                .duration_minutes
                ? Number(
                    formData
                      .duration_minutes
                  )
                : null,
  
            passing_score:
              formData
                .passing_score !== ""
                ? Number(
                    formData
                      .passing_score
                  )
                : null,
  
            max_attempts:
              formData
                .max_attempts
                ? Number(
                    formData
                      .max_attempts
                  )
                : null,
  
            shuffle_questions:
              formData
                .shuffle_questions,
  
            show_answers_after_submit:
              formData
                .show_answers_after_submit,
  
            status:
              formData.status,
          };
  
  
          if (editingId) {
  
            await api.put(
              `/assessments/${editingId}`,
              payload
            );
  
  
            setMessage(
              "Assessment updated successfully."
            );
  
          } else {
  
            await api.post(
              "/assessments",
              payload
            );
  
  
            setMessage(
              "Assessment created successfully."
            );
          }
  
  
          setDrawerOpen(false);
  
          setEditingId(null);
  
          setSelectedStageId("");
          setSelectedGradeId("");
  
          setSections([]);
  
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
              "Something went wrong."
            );
          }
  
        } finally {
  
          setSaving(false);
        }
      };
  
  
    // =====================================
    // Edit
    // =====================================
  
    const handleEdit =
      async (assessment) => {
  
        const course =
          assessment.course;
  
  
        const stageId =
          course?.grade
            ?.academic_stage
            ?.id ||
          "";
  
  
        const gradeId =
          course?.grade_id ||
          "";
  
  
        setSelectedStageId(
          stageId
        );
  
  
        setSelectedGradeId(
          gradeId
        );
  
  
        if (course?.id) {
  
          await loadSections(
            course.id
          );
        }
  
  
        setEditingId(
          assessment.id
        );
  
  
        setFormData({
          course_id:
            assessment.course_id,
  
          course_section_id:
            assessment
              .course_section_id ||
            "",
  
          title:
            assessment.title ||
            "",
  
          description:
            assessment.description ||
            "",
  
          type:
            assessment.type ||
            "quiz",
  
          duration_minutes:
            assessment
              .duration_minutes ??
            "",
  
          passing_score:
            assessment
              .passing_score ??
            70,
  
          max_attempts:
            assessment
              .max_attempts ??
            "",
  
          shuffle_questions:
            Boolean(
              assessment
                .shuffle_questions
            ),
  
          show_answers_after_submit:
            Boolean(
              assessment
                .show_answers_after_submit
            ),
  
          status:
            assessment.status ||
            "Draft",
        });
  
  
        setErrors({});
        setPageError("");
        setMessage("");
  
        setDrawerOpen(true);
      };
  
  
    // =====================================
    // Delete
    // =====================================
  
    const handleDelete =
      async (assessment) => {
  
        const confirmed =
          window.confirm(
            `Delete "${assessment.title}"?`
          );
  
  
        if (!confirmed) {
          return;
        }
  
  
        try {
  
          setDeletingId(
            assessment.id
          );
  
          setMessage("");
          setPageError("");
  
  
          await api.delete(
            `/assessments/${assessment.id}`
          );
  
  
          setMessage(
            "Assessment deleted successfully."
          );
  
  
          await fetchData();
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to delete assessment."
          );
  
        } finally {
  
          setDeletingId(null);
        }
      };
  
  
    // =====================================
    // Helpers
    // =====================================
  
    const typeLabel =
      (value) => {
  
        if (!value) {
          return "-";
        }
  
  
        return (
          value.charAt(0)
            .toUpperCase() +
          value.slice(1)
        );
      };
  
  
    if (loading) {
  
      return (
        <div className="premium-admin-loading">
  
          <span className="premium-spinner" />
  
          <p>{tr("Loading assessments...")}</p>
  
        </div>
      );
    }
  
  
    return (
      <div className="premium-admin-crud premium-assessments-page">
  
        {/* =================================
            Header
        ================================= */}
  
        <div className="premium-crud-heading">
  
          <div>
  
            <span>{tr("Evaluation")}</span>
  
  
            <h1>{tr("Assessments")}</h1>
  
  
            <p>{tr("Manage practice, quizzes, homework and exams without clutter.")}</p>
  
          </div>
  
  
          <button
            type="button"
            className="premium-add-button"
            onClick={openCreate}
          >
            <Plus size={16} />{tr("New assessment")}</button>
  
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
  
        <div className="premium-assessment-stats">
  
          <article>
  
            <div>
              <ClipboardCheck
                size={18}
              />
            </div>
  
            <span>{tr("Total")}</span>
  
            <strong>
              {
                assessments
                  .length
              }
            </strong>
  
          </article>
  
  
          <article>
  
            <div>
              <CheckCircle2
                size={18}
              />
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
  
            <span>{tr("Exams")}</span>
  
            <strong>
              {examCount}
            </strong>
  
          </article>
  
  
          <article>
  
            <div>
              <HelpCircle size={18} />
            </div>
  
            <span>{tr("Questions")}</span>
  
            <strong>
              {questionCount}
            </strong>
  
          </article>
  
        </div>
  
  
        {/* =================================
            Toolbar
        ================================= */}
  
        <div className="premium-assessment-toolbar">
  
          <div className="premium-crud-search">
  
            <Search size={17} />
  
            <input
              type="search"
              placeholder={tr("Search assessments...")}
              value={search}
              onChange={
                (e) =>
                  setSearch(
                    e.target.value
                  )
              }
            />
  
          </div>
  
  
          <select
            value={typeFilter}
            onChange={
              (e) =>
                setTypeFilter(
                  e.target.value
                )
            }
          >
            <option value="all">{tr("All types")}</option>
  
            <option value="practice">{tr("Practice")}</option>
  
            <option value="quiz">{tr("Quiz")}</option>
  
            <option value="homework">{tr("Homework")}</option>
  
            <option value="exam">{tr("Exam")}</option>
          </select>
  
  
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
              filteredAssessments
                .length
            }
            {" "}
            results
          </div>
  
        </div>
  
  
        {/* =================================
            Cards
        ================================= */}
  
        {filteredAssessments.length ===
        0 ? (
  
          <div className="premium-admin-empty premium-assessment-empty">
  
            <ClipboardCheck
              size={30}
            />
  
            <strong>{tr("No assessments found.")}</strong>
  
            <span>{tr("Create one or change your filters.")}</span>
  
          </div>
  
        ) : (
  
          <div className="premium-assessment-grid">
  
            {filteredAssessments.map(
              (assessment) => (
  
                <article
                  key={
                    assessment.id
                  }
                  className="premium-assessment-card"
                >
  
                  <div className="premium-assessment-card-top">
  
                    <div className="premium-assessment-type-icon">
                      <ClipboardCheck
                        size={19}
                      />
                    </div>
  
  
                    <div className="premium-assessment-badges">
  
                      <span className={`premium-assessment-type type-${assessment.type}`}>
                        {
                          typeLabel(
                            assessment.type
                          )
                        }
                      </span>
  
  
                      <span
                        className={
                          assessment.status ===
                          "Published"
                            ? "premium-status active"
                            : "premium-status draft"
                        }
                      >
                        {
                          assessment
                            .status
                        }
                      </span>
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-assessment-academic">
  
                    {
                      assessment
                        .course
                        ?.grade
                        ?.academic_stage
                        ?.name ||
                      "Course Assessment"
                    }
  
  
                    {
                      assessment
                        .course
                        ?.grade
                        ?.name
                        ? ` • ${assessment.course.grade.name}`
                        : ""
                    }
  
                  </div>
  
  
                  <h2>
                    {
                      assessment.title
                    }
                  </h2>
  
  
                  <p className="premium-assessment-course">
                    {
                      assessment.course
                        ?.title ||
                      "-"
                    }
                  </p>
  
  
                  <div className="premium-assessment-meta">
  
                    <div>
                      <Layers3
                        size={15}
                      />
                      <span>{tr("Section")}</span>
                      <strong>
                        {
                          assessment
                            .section
                            ?.title ||
                          "Whole Course"
                        }
                      </strong>
                    </div>
  
  
                    <div>
                      <HelpCircle
                        size={15}
                      />
                      <span>{tr("Questions")}</span>
                      <strong>
                        {
                          assessment
                            .questions_count ||
                          0
                        }
                      </strong>
                    </div>
  
  
                    <div>
                      <Clock3
                        size={15}
                      />
                      <span>{tr("Duration")}</span>
                      <strong>
                        {
                          assessment
                            .duration_minutes
                            ? `${assessment.duration_minutes} min`
                            : "Unlimited"
                        }
                      </strong>
                    </div>
  
  
                    <div>
                      <Gauge size={15} />
                      <span>{tr("Pass mark")}</span>
                      <strong>
                        {
                          assessment
                            .passing_score ??
                          "-"
                        }
                        {
                          assessment
                            .passing_score !==
                            null
                            ? "%"
                            : ""
                        }
                      </strong>
                    </div>
  
                  </div>
  
  
                  {assessment.description && (
  
                    <p className="premium-assessment-description">
                      {
                        assessment
                          .description
                      }
                    </p>
  
                  )}
  
  
                  <div className="premium-assessment-actions">
  
                    <button
                      type="button"
                      className="premium-assessment-questions-btn"
                      onClick={() =>
                        navigate(
                          `/admin/assessments/${assessment.id}/questions`
                        )
                      }
                    >
                      <HelpCircle
                        size={14}
                      />{tr("Questions")}</button>
  
  
                    <button
                      type="button"
                      className="premium-assessment-edit-btn"
                      onClick={() =>
                        handleEdit(
                          assessment
                        )
                      }
                    >
                      <Edit3 size={14} />{tr("Edit")}</button>
  
  
                    <button
                      type="button"
                      className="premium-assessment-delete-btn"
                      onClick={() =>
                        handleDelete(
                          assessment
                        )
                      }
                      disabled={
                        deletingId ===
                        assessment.id
                      }
                      aria-label={`Delete ${assessment.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
  
                  </div>
  
                </article>
  
              )
            )}
  
          </div>
  
        )}
  
  
        {/* =================================
            Drawer
        ================================= */}
  
        {drawerOpen && (
  
          <>
  
            <button
              type="button"
              className="premium-drawer-backdrop"
              onClick={closeDrawer}
              aria-label={tr("Close assessment panel")}
            />
  
  
            <aside className="premium-edit-drawer premium-assessment-drawer">
  
              <div className="premium-drawer-head">
  
                <div>
  
                  <span>{tr("Assessment")}</span>
  
  
                  <h2>
                    {
                      editingId
                        ? "Edit assessment"
                        : "Create assessment"
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
  
                {/* Academic placement */}
  
                <section className="premium-assessment-form-section">
  
                  <div className="premium-assessment-form-title">
  
                    <BookOpenCheck
                      size={16}
                    />
  
                    <div>
  
                      <strong>{tr("Academic placement")}</strong>
  
                      <span>{tr("Select stage, grade, course and section.")}</span>
  
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
                            key={stage.id}
                            value={stage.id}
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
                      value={
                        selectedGradeId
                      }
                      onChange={
                        handleGradeChange
                      }
                      disabled={
                        !selectedStageId
                      }
                    >
                      <option value="">{tr("Select grade")}</option>
  
                      {availableGrades.map(
                        (grade) => (
                          <option
                            key={grade.id}
                            value={grade.id}
                          >
                            {grade.name}
                          </option>
                        )
                      )}
                    </select>
  
                  </div>
  
  
                  <div className="premium-field">
  
                    <label>{tr("Course")}</label>
  
  
                    <select
                      value={
                        formData.course_id
                      }
                      onChange={
                        handleCourseChange
                      }
                      disabled={
                        !selectedGradeId
                      }
                    >
                      <option value="">{tr("Select course")}</option>
  
                      {availableCourses.map(
                        (course) => (
                          <option
                            key={course.id}
                            value={course.id}
                          >
                            {course.title}
                          </option>
                        )
                      )}
                    </select>
  
  
                    {errors.course_id && (
                      <span className="field-error">
                        {
                          errors
                            .course_id[0]
                        }
                      </span>
                    )}
  
                  </div>
  
  
                  <div className="premium-field">
  
                    <label>{tr("Section")}</label>
  
  
                    <select
                      name="course_section_id"
                      value={
                        formData
                          .course_section_id
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        !formData
                          .course_id
                      }
                    >
                      <option value="">{tr("Whole Course / General")}</option>
  
                      {sections.map(
                        (section) => (
                          <option
                            key={section.id}
                            value={section.id}
                          >
                            {section.title}
                          </option>
                        )
                      )}
                    </select>
  
                  </div>
  
                </section>
  
  
                {/* Main details */}
  
                <section className="premium-assessment-form-section">
  
                  <div className="premium-assessment-form-title">
  
                    <ClipboardCheck
                      size={16}
                    />
  
                    <div>
  
                      <strong>{tr("Assessment details")}</strong>
  
                      <span>{tr("Name, type and student instructions.")}</span>
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-assessment-form-two">
  
                    <div className="premium-field">
  
                      <label>{tr("Type")}</label>
  
  
                      <select
                        name="type"
                        value={
                          formData.type
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="practice">{tr("Practice")}</option>
  
                        <option value="quiz">{tr("Quiz")}</option>
  
                        <option value="homework">{tr("Homework")}</option>
  
                        <option value="exam">{tr("Exam")}</option>
                      </select>
  
                    </div>
  
  
                    <div className="premium-field">
  
                      <label>{tr("Status")}</label>
  
  
                      <select
                        name="status"
                        value={
                          formData.status
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="Draft">{tr("Draft")}</option>
  
                        <option value="Published">{tr("Published")}</option>
                      </select>
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-field">
  
                    <label>{tr("Title")}</label>
  
  
                    <input
                      type="text"
                      name="title"
                      value={
                        formData.title
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={tr("Example: Unit 1 Quiz")}
                    />
  
  
                    {errors.title && (
                      <span className="field-error">
                        {errors.title[0]}
                      </span>
                    )}
  
                  </div>
  
  
                  <div className="premium-field">
  
                    <label>{tr("Description")}</label>
  
  
                    <textarea
                      name="description"
                      rows="3"
                      value={
                        formData
                          .description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={tr("Optional instructions...")}
                    />
  
                  </div>
  
                </section>
  
  
                {/* Rules */}
  
                <section className="premium-assessment-form-section">
  
                  <div className="premium-assessment-form-title">
  
                    <Gauge size={16} />
  
                    <div>
  
                      <strong>{tr("Rules")}</strong>
  
                      <span>{tr("Duration, pass mark and attempt behavior.")}</span>
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-assessment-form-two">
  
                    <div className="premium-field">
  
                      <label>{tr("Duration")}</label>
  
  
                      <input
                        type="number"
                        min="1"
                        name="duration_minutes"
                        value={
                          formData
                            .duration_minutes
                        }
                        onChange={
                          handleChange
                        }
                        placeholder={tr("Unlimited")}
                      />
  
                    </div>
  
  
                    <div className="premium-field">
  
                      <label>{tr("Passing score %")}</label>
  
  
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="passing_score"
                        value={
                          formData
                            .passing_score
                        }
                        onChange={
                          handleChange
                        }
                      />
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-field">
  
                    <label>{tr("Maximum attempts")}</label>
  
  
                    <input
                      type="number"
                      min="1"
                      name="max_attempts"
                      value={
                        formData
                          .max_attempts
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={tr("Unlimited")}
                    />
  
                  </div>
  
  
                  <label className="premium-assessment-toggle">
  
                    <input
                      type="checkbox"
                      name="shuffle_questions"
                      checked={
                        formData
                          .shuffle_questions
                      }
                      onChange={
                        handleChange
                      }
                    />
  
  
                    <span>
                      <Shuffle size={15} />
                    </span>
  
  
                    <div>
                      <strong>{tr("Shuffle questions")}</strong>
  
                      <small>{tr("Present questions in a different order.")}</small>
                    </div>
  
                  </label>
  
  
                  <label className="premium-assessment-toggle">
  
                    <input
                      type="checkbox"
                      name="show_answers_after_submit"
                      checked={
                        formData
                          .show_answers_after_submit
                      }
                      onChange={
                        handleChange
                      }
                    />
  
  
                    <span>
                      <CheckCircle2
                        size={15}
                      />
                    </span>
  
  
                    <div>
                      <strong>{tr("Show answers after submit")}</strong>
  
                      <small>{tr("Allow students to review correct answers.")}</small>
                    </div>
  
                  </label>
  
                </section>
  
  
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
                        : editingId
                          ? "Save changes"
                          : "Create assessment"
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
  
  
  export default Assessments;
  