import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    Circle,
    ClipboardCheck,
    ExternalLink,
    FileText,
    Headphones,
    Link as LinkIcon,
    PlayCircle,
  } from "lucide-react";
  
  import {
    useNavigate,
    useParams,
    useSearchParams,
  } from "react-router-dom";
  
  import api
    from "../../services/api";

  import {
    useLanguage,
  } from "../../context/LanguageContext";
  
  
  function CourseLearning() {
    const {
      courseId,
    } = useParams();
  
    const navigate =
      useNavigate();

    const { t } =
      useLanguage();
  
    const [
      searchParams,
    ] = useSearchParams();
  
  
    const [
      course,
      setCourse,
    ] = useState(null);
  
    const [
      enrollment,
      setEnrollment,
    ] = useState(null);
  
    const [
      selectedSectionId,
      setSelectedSectionId,
    ] = useState(null);
  
    const [
      selectedItem,
      setSelectedItem,
    ] = useState(null);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      startingAssessment,
      setStartingAssessment,
    ] = useState(null);
  
    const [
      updatingProgress,
      setUpdatingProgress,
    ] = useState(false);
  
    const [
      error,
      setError,
    ] = useState("");
  
  
    // =====================================
    // Load Course
    // =====================================
  
    const fetchCourse =
      async () => {
  
        try {
  
          setLoading(true);
          setError("");
  
  
          const response =
            await api.get(
              `/my/courses/${courseId}/content`
            );
  
  
          const loadedCourse =
            response.data.course;
  
  
          setCourse(
            loadedCourse
          );
  
  
          setEnrollment(
            response.data.enrollment
          );
  
  
          const requestedItemId =
            searchParams.get(
              "item_id"
            );
  
  
          let initialSection =
            loadedCourse
              .sections?.[0] ||
            null;
  
  
          let initialItem =
            initialSection
              ?.items?.[0] ||
            null;
  
  
          if (requestedItemId) {
  
            for (
              const section
              of loadedCourse.sections || []
            ) {
  
              const found =
                section.items?.find(
                  (item) =>
                    Number(item.id) ===
                    Number(
                      requestedItemId
                    )
                );
  
  
              if (found) {
  
                initialSection =
                  section;
  
                initialItem =
                  found;
  
                break;
              }
            }
          }
  
  
          if (initialSection) {
  
            setSelectedSectionId(
              initialSection.id
            );
          }
  
  
          if (initialItem) {
  
            setSelectedItem(
              initialItem
            );
  
            trackOpen(
              initialItem
            );
          }
  
        } catch (error) {
  
          setError(
            error.response?.data
              ?.message ||
            t("finalUi.courseLearning.loadError")
          );
  
        } finally {
  
          setLoading(false);
        }
      };
  
  
    useEffect(() => {
      fetchCourse();
    }, [courseId, t]);
  
  
    // =====================================
    // Current Section
    // =====================================
  
    const selectedSection =
      useMemo(
        () =>
          course?.sections?.find(
            (section) =>
              Number(section.id) ===
              Number(
                selectedSectionId
              )
          ),
        [
          course,
          selectedSectionId,
        ]
      );
  
  
    // =====================================
    // Select Section
    // =====================================
  
    const selectSection =
      async (section) => {
  
        setSelectedSectionId(
          section.id
        );
  
  
        const firstItem =
          section.items?.[0] ||
          null;
  
  
        setSelectedItem(
          firstItem
        );
  
  
        if (firstItem) {
  
          await trackOpen(
            firstItem
          );
        }
      };
  
  
    // =====================================
    // Flatten Lessons
    // =====================================
  
    const allLessons =
      useMemo(
        () =>
          (
            course?.sections || []
          ).flatMap(
            (section) =>
              (
                section.items || []
              ).map(
                (item) => ({
                  ...item,
                  sectionId:
                    section.id,
                })
              )
          ),
        [course]
      );
  
  
    const selectedIndex =
      allLessons.findIndex(
        (item) =>
          Number(item.id) ===
          Number(
            selectedItem?.id
          )
      );
  
  
    const previousLesson =
      selectedIndex > 0
        ? allLessons[
            selectedIndex - 1
          ]
        : null;
  
  
    const nextLesson =
      selectedIndex >= 0 &&
      selectedIndex <
        allLessons.length - 1
        ? allLessons[
            selectedIndex + 1
          ]
        : null;
  
  
    // =====================================
    // Track Open
    // =====================================
  
    const trackOpen =
      async (item) => {
  
        if (!item?.id) {
          return;
        }
  
  
        try {
  
          await api.post(
            `/my/course-items/${item.id}/open`
          );
  
        } catch (error) {
  
          console.error(
            "Could not track lesson opening",
            error
          );
        }
      };
  
  
    // =====================================
    // Open Lesson
    // =====================================
  
    const openItem =
      async (
        section,
        item
      ) => {
  
        setSelectedSectionId(
          section.id
        );
  
  
        setSelectedItem(
          item
        );
  
  
        await trackOpen(
          item
        );
      };
  
  
    const openFlatLesson =
      async (item) => {
  
        if (!item) {
          return;
        }
  
  
        const section =
          course.sections.find(
            (candidate) =>
              Number(
                candidate.id
              ) ===
              Number(
                item.sectionId
              )
          );
  
  
        if (!section) {
          return;
        }
  
  
        await openItem(
          section,
          item
        );
      };
  
  
    // =====================================
    // Toggle Completed
    // =====================================
  
    const toggleCompleted =
      async () => {
  
        if (
          !selectedItem ||
          updatingProgress
        ) {
          return;
        }
  
  
        const completed =
          selectedItem
            .student_progress
            ?.completed === true;
  
  
        try {
  
          setUpdatingProgress(true);
          setError("");
  
  
          const endpoint =
            completed
              ? `/my/course-items/${selectedItem.id}/uncomplete`
              : `/my/course-items/${selectedItem.id}/complete`;
  
  
          const response =
            await api.put(
              endpoint
            );
  
  
          const newCompleted =
            !completed;
  
  
          setCourse(
            (current) => {
  
              if (!current) {
                return current;
              }
  
  
              return {
                ...current,
  
                sections:
                  current.sections.map(
                    (section) => ({
                      ...section,
  
                      items:
                        section.items.map(
                          (item) => {
  
                            if (
                              Number(
                                item.id
                              ) !==
                              Number(
                                selectedItem.id
                              )
                            ) {
                              return item;
                            }
  
  
                            return {
                              ...item,
  
                              student_progress: {
                                ...item
                                  .student_progress,
  
                                status:
                                  newCompleted
                                    ? "completed"
                                    : "started",
  
                                completed:
                                  newCompleted,
  
                                completed_at:
                                  newCompleted
                                    ? new Date()
                                        .toISOString()
                                    : null,
                              },
                            };
                          }
                        ),
                    })
                  ),
              };
            }
          );
  
  
          setSelectedItem(
            (current) => {
  
              if (!current) {
                return current;
              }
  
  
              return {
                ...current,
  
                student_progress: {
                  ...current
                    .student_progress,
  
                  status:
                    newCompleted
                      ? "completed"
                      : "started",
  
                  completed:
                    newCompleted,
  
                  completed_at:
                    newCompleted
                      ? new Date()
                          .toISOString()
                      : null,
                },
              };
            }
          );
  
  
          setEnrollment(
            (current) => ({
              ...current,
  
              progress:
                response.data
                  .course_progress ??
                0,
            })
          );
  
        } catch (error) {
  
          setError(
            error.response?.data
              ?.message ||
            t("finalUi.courseLearning.updateProgressError")
          );
  
        } finally {
  
          setUpdatingProgress(false);
        }
      };
  
  
    // =====================================
    // Assessments
    // =====================================
  
    const startAssessment =
      async (assessment) => {
  
        try {
  
          setStartingAssessment(
            assessment.id
          );
  
          setError("");
  
  
          const response =
            await api.post(
              `/my/assessments/${assessment.id}/start`
            );
  
  
          navigate(
            `/student/assessment-attempts/${response.data.attempt.id}`
          );
  
        } catch (error) {
  
          setError(
            error.response?.data
              ?.message ||
            t("finalUi.courseLearning.startAssessmentError")
          );
  
        } finally {
  
          setStartingAssessment(
            null
          );
        }
      };
  
  
    // =====================================
    // Helpers
    // =====================================
  
    const getYoutubeEmbedUrl =
      (url) => {
  
        if (!url) {
          return null;
        }
  
  
        try {
  
          const parsed =
            new URL(url);
  
  
          if (
            parsed.hostname.includes(
              "youtu.be"
            )
          ) {
  
            const id =
              parsed.pathname
                .replace("/", "")
                .split("?")[0];
  
  
            return (
              `https://www.youtube.com/embed/${id}`
            );
          }
  
  
          if (
            parsed.hostname.includes(
              "youtube.com"
            )
          ) {
  
            const id =
              parsed.searchParams.get(
                "v"
              );
  
  
            if (id) {
  
              return (
                `https://www.youtube.com/embed/${id}`
              );
            }
  
  
            if (
              parsed.pathname.includes(
                "/embed/"
              )
            ) {
              return url;
            }
          }
  
        } catch {
          return null;
        }
  
  
        return null;
      };
  
  
    const itemIcon =
      (type) => {
  
        switch (type) {
  
          case "video":
            return (
              <PlayCircle size={16} />
            );
  
          case "pdf":
            return (
              <FileText size={16} />
            );
  
          case "audio":
            return (
              <Headphones size={16} />
            );
  
          case "link":
            return (
              <LinkIcon size={16} />
            );
  
          default:
            return (
              <BookOpen size={16} />
            );
        }
      };
  
  
    // =====================================
    // Render Content
    // =====================================
  
    const renderItem = () => {
  
      if (!selectedItem) {
  
        return (
          <div className="premium-learning-empty">
  
            <BookOpen size={28} />
  
            <strong>
              {t("finalUi.courseLearning.chooseLesson")}
            </strong>
  
            <span>
              {t("finalUi.courseLearning.selectLesson")}
            </span>
  
          </div>
        );
      }
  
  
      const resource =
        selectedItem.file_url ||
        selectedItem.resource_url;
  
  
      if (
        selectedItem.type ===
        "video"
      ) {
  
        const youtube =
          getYoutubeEmbedUrl(
            selectedItem.resource_url
          );
  
  
        if (youtube) {
  
          return (
            <div className="premium-video-frame">
  
              <iframe
                src={youtube}
                title={
                  selectedItem.title
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
  
            </div>
          );
        }
  
  
        return (
          <video
            className="premium-native-video"
            controls
            src={resource}
            onEnded={() => {
  
              if (
                !selectedItem
                  ?.student_progress
                  ?.completed
              ) {
                toggleCompleted();
              }
            }}
          >
            {t("finalUi.courseLearning.browserVideo")}
          </video>
        );
      }
  
  
      if (
        selectedItem.type ===
        "pdf"
      ) {
  
        return (
          <div className="premium-pdf-wrap">
  
            <iframe
              className="premium-learning-pdf"
              src={resource}
              title={
                selectedItem.title
              }
            />
  
  
            <a
              href={resource}
              target="_blank"
              rel="noreferrer"
              className="premium-resource-link"
            >
              <ExternalLink size={15} />
              {t("finalUi.courseLearning.openPdf")}
            </a>
  
          </div>
        );
      }
  
  
      if (
        selectedItem.type ===
        "audio"
      ) {
  
        return (
          <div className="premium-audio-wrap">
  
            <div className="premium-audio-icon">
              <Headphones size={28} />
            </div>
  
  
            <audio
              controls
              src={resource}
              onEnded={() => {
  
                if (
                  !selectedItem
                    ?.student_progress
                    ?.completed
                ) {
                  toggleCompleted();
                }
              }}
            />
  
          </div>
        );
      }
  
  
      if (
        selectedItem.type ===
        "link"
      ) {
  
        return (
          <div className="premium-external-resource">
  
            <LinkIcon size={28} />
  
  
            <strong>
              {t("finalUi.courseLearning.externalResource")}
            </strong>
  
  
            <span>
              {t("finalUi.courseLearning.externalDescription")}
            </span>
  
  
            <a
              href={
                selectedItem
                  .resource_url
              }
              target="_blank"
              rel="noreferrer"
              className="primary-btn"
            >
              {t("finalUi.courseLearning.openResource")}
              <ExternalLink size={15} />
            </a>
  
          </div>
        );
      }
  
  
      return (
        <div className="premium-text-lesson">
          {selectedItem.content}
        </div>
      );
    };
  
  
    // =====================================
    // Loading / Error
    // =====================================
  
    if (loading) {
  
      return (
        <div className="premium-student-loading">
  
          <span className="premium-spinner" />
  
          <p>
            {t("finalUi.courseLearning.loadingCourse")}
          </p>
  
        </div>
      );
    }
  
  
    if (
      error &&
      !course
    ) {
  
      return (
        <div className="error-message">
          {error}
        </div>
      );
    }
  
  
    const progress =
      Math.min(
        100,
        Math.max(
          0,
          Number(
            enrollment?.progress
          ) || 0
        )
      );
  
  
    return (
      <div className="premium-learning-page">
  
        <header className="premium-learning-header">
  
          <button
            type="button"
            className="premium-back-button"
            onClick={() =>
              navigate(
                "/my-courses"
              )
            }
          >
            <ArrowLeft size={16} />
            {t("finalUi.courseLearning.myCourses")}
          </button>
  
  
          <div className="premium-learning-title">
  
            <span>
  
              {
                course?.grade
                  ?.academic_stage
                  ?.name
              }
  
              {
                course?.grade?.name
                  ? ` • ${course.grade.name}`
                  : ""
              }
  
            </span>
  
  
            <h1>
              {course?.title}
            </h1>
  
  
            <p>
              {t("finalUi.courseLearning.instructor")}:{" "}
              <strong>
                {
                  course?.instructor
                    ?.name ||
                  "-"
                }
              </strong>
            </p>
  
          </div>
  
  
          <div className="premium-learning-progress">
  
            <div>
  
              <span>
                {t("finalUi.courseLearning.progress")}
              </span>
  
              <strong>
                {progress}%
              </strong>
  
            </div>
  
  
            <div className="premium-progress-track">
  
              <span
                style={{
                  width:
                    `${progress}%`,
                }}
              />
  
            </div>
  
          </div>
  
        </header>
  
  
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
  
  
        <div className="premium-learning-layout">
  
          <aside className="premium-course-outline">
  
            <div className="premium-outline-head">
  
              <span>
                {t("finalUi.courseLearning.courseOutline")}
              </span>
  
              <strong>
                {
                  allLessons.length
                } {t("finalUi.courseLearning.lessons")}
              </strong>
  
            </div>
  
  
            {
              course?.sections?.length ===
              0
                ? (
                  <div className="premium-outline-empty">
                    {t("finalUi.courseLearning.noPublishedContent")}
                  </div>
                )
                : course.sections.map(
                    (
                      section,
                      sectionIndex
                    ) => {
  
                      const active =
                        Number(
                          selectedSectionId
                        ) ===
                        Number(
                          section.id
                        );
  
  
                      return (
                        <section
                          className={
                            active
                              ? "premium-outline-section active"
                              : "premium-outline-section"
                          }
                          key={
                            section.id
                          }
                        >
  
                          <button
                            type="button"
                            className="premium-outline-section-btn"
                            onClick={() =>
                              selectSection(
                                section
                              )
                            }
                          >
  
                            <span className="premium-section-number">
                              {
                                sectionIndex + 1
                              }
                            </span>
  
  
                            <strong>
                              {
                                section.title
                              }
                            </strong>
  
  
                            <ChevronDown
                              size={15}
                            />
  
                          </button>
  
  
                          <div className="premium-outline-items">
  
                            {
                              section.items?.map(
                                (item) => {
  
                                  const selected =
                                    Number(
                                      selectedItem
                                        ?.id
                                    ) ===
                                    Number(
                                      item.id
                                    );
  
  
                                  return (
                                    <button
                                      type="button"
                                      key={
                                        item.id
                                      }
                                      className={
                                        selected
                                          ? "premium-outline-item active"
                                          : "premium-outline-item"
                                      }
                                      onClick={() =>
                                        openItem(
                                          section,
                                          item
                                        )
                                      }
                                    >
  
                                      <span className="premium-item-icon">
                                        {
                                          itemIcon(
                                            item.type
                                          )
                                        }
                                      </span>
  
  
                                      <span className="premium-item-title">
                                        {
                                          item.title
                                        }
                                      </span>
  
  
                                      {
                                        item
                                          .student_progress
                                          ?.completed
                                          ? (
                                            <Check
                                              size={14}
                                              className="premium-item-done"
                                            />
                                          )
                                          : (
                                            <Circle
                                              size={12}
                                              className="premium-item-pending"
                                            />
                                          )
                                      }
  
                                    </button>
                                  );
                                }
                              )
                            }
  
  
                            {
                              section
                                .assessments
                                ?.map(
                                  (assessment) => (
  
                                    <button
                                      key={
                                        `assessment-${assessment.id}`
                                      }
                                      type="button"
                                      className="premium-outline-item assessment"
                                      disabled={
                                        startingAssessment ===
                                        assessment.id
                                      }
                                      onClick={() =>
                                        startAssessment(
                                          assessment
                                        )
                                      }
                                    >
  
                                      <span className="premium-item-icon">
                                        <ClipboardCheck size={16} />
                                      </span>
  
  
                                      <span className="premium-item-title">
                                        {
                                          startingAssessment ===
                                          assessment.id
                                            ? t("finalUi.courseLearning.starting")
                                            : assessment.title
                                        }
                                      </span>
  
                                    </button>
  
                                  )
                                )
                            }
  
                          </div>
  
                        </section>
                      );
                    }
                  )
            }
  
  
            {
              course?.assessments
                ?.length > 0 && (
  
                <div className="premium-course-assessments">
  
                  <span>
                    {t("finalUi.courseLearning.courseAssessments")}
                  </span>
  
  
                  {
                    course.assessments.map(
                      (assessment) => (
  
                        <button
                          key={
                            assessment.id
                          }
                          type="button"
                          className="premium-outline-item assessment"
                          disabled={
                            startingAssessment ===
                            assessment.id
                          }
                          onClick={() =>
                            startAssessment(
                              assessment
                            )
                          }
                        >
  
                          <span className="premium-item-icon">
                            <ClipboardCheck size={16} />
                          </span>
  
  
                          <span className="premium-item-title">
                            {
                              startingAssessment ===
                              assessment.id
                                ? t("finalUi.courseLearning.starting")
                                : assessment.title
                            }
                          </span>
  
                        </button>
  
                      )
                    )
                  }
  
                </div>
  
              )
            }
  
          </aside>
  
  
          <main className="premium-lesson-panel">
  
            {
              selectedItem && (
  
                <div className="premium-lesson-heading">
  
                  <div>
  
                    <span className="premium-lesson-type">
                      {
                        selectedItem.type
                      }
                    </span>
  
  
                    <h2>
                      {
                        selectedItem.title
                      }
                    </h2>
  
  
                    {
                      selectedItem.description && (
  
                        <p>
                          {
                            selectedItem
                              .description
                          }
                        </p>
  
                      )
                    }
  
                  </div>
  
  
                  <span
                    className={
                      selectedItem
                        .student_progress
                        ?.completed
                        ? "premium-completion-chip completed"
                        : "premium-completion-chip"
                    }
                  >
  
                    {
                      selectedItem
                        .student_progress
                        ?.completed
                        ? (
                          <>
                            <CheckCircle2 size={14} />
                            {t("finalUi.courseLearning.completed")}
                          </>
                        )
                        : t("finalUi.courseLearning.inProgress")
                    }
  
                  </span>
  
                </div>
  
              )
            }
  
  
            <div className="premium-lesson-content">
              {renderItem()}
            </div>
  
  
            {
              selectedItem && (
  
                <div className="premium-lesson-actions">
  
                  <button
                    type="button"
                    className="premium-nav-lesson-btn"
                    disabled={
                      !previousLesson
                    }
                    onClick={() =>
                      openFlatLesson(
                        previousLesson
                      )
                    }
                  >
                    <ArrowLeft size={15} />
                    {t("finalUi.courseLearning.previous")}
                  </button>
  
  
                  <button
                    type="button"
                    className={
                      selectedItem
                        .student_progress
                        ?.completed
                        ? "premium-complete-btn done"
                        : "premium-complete-btn"
                    }
                    disabled={
                      updatingProgress
                    }
                    onClick={
                      toggleCompleted
                    }
                  >
  
                    {
                      updatingProgress
                        ? t("finalUi.courseLearning.updating")
                        : selectedItem
                            .student_progress
                            ?.completed
                          ? (
                            <>
                              <CheckCircle2 size={16} />
                              {t("finalUi.courseLearning.completed")}
                            </>
                          )
                          : (
                            <>
                              <Check size={16} />
                              {t("finalUi.courseLearning.markComplete")}
                            </>
                          )
                    }
  
                  </button>
  
  
                  <button
                    type="button"
                    className="premium-nav-lesson-btn next"
                    disabled={
                      !nextLesson
                    }
                    onClick={() =>
                      openFlatLesson(
                        nextLesson
                      )
                    }
                  >
                    {t("finalUi.courseLearning.nextLesson")}
                    <ArrowRight size={15} />
                  </button>
  
                </div>
  
              )
            }
  
  
            {
              selectedSection
                ?.assessments
                ?.length > 0 && (
  
                <section className="premium-practice">
  
                  <div className="premium-practice-heading">
  
                    <span>
                      {t("finalUi.courseLearning.practice")}
                    </span>
  
                    <h3>
                      {t("finalUi.courseLearning.testLearned")}
                    </h3>
  
                  </div>
  
  
                  <div className="premium-practice-grid">
  
                    {
                      selectedSection
                        .assessments
                        .map(
                          (assessment) => (
  
                            <article
                              key={
                                assessment.id
                              }
                              className="premium-practice-card"
                            >
  
                              <ClipboardCheck size={19} />
  
  
                              <div>
  
                                <span>
                                  {
                                    assessment.type
                                  }
                                </span>
  
                                <strong>
                                  {
                                    assessment.title
                                  }
                                </strong>
  
                                <small>
  
                                  {
                                    assessment
                                      .questions_count
                                    ??
                                    0
                                  } {t("finalUi.courseLearning.questions")}
  
                                  {" • "}
  
                                  {
                                    assessment
                                      .duration_minutes
                                      ? `${assessment.duration_minutes} ${t("finalUi.courseLearning.minutesShort")}`
                                      : t("finalUi.courseLearning.noTimeLimit")
                                  }
  
                                </small>
  
                              </div>
  
  
                              <button
                                type="button"
                                disabled={
                                  startingAssessment ===
                                  assessment.id
                                }
                                onClick={() =>
                                  startAssessment(
                                    assessment
                                  )
                                }
                              >
                                {
                                  startingAssessment ===
                                  assessment.id
                                    ? t("finalUi.courseLearning.starting")
                                    : "Start"
                                }
                              </button>
  
                            </article>
  
                          )
                        )
                    }
  
                  </div>
  
                </section>
  
              )
            }
  
          </main>
  
        </div>
  
      </div>
    );
  }
  
  
  export default CourseLearning;
  