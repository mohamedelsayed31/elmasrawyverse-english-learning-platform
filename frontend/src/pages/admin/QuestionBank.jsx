import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    BookOpenCheck,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleHelp,
    Copy,
    Edit3,
    FileQuestion,
    Filter,
    Layers3,
    Plus,
    RotateCcw,
    Save,
    Search,
    Sparkles,
    Trash2,
    X,
  } from "lucide-react";
  
  import api
    from "../../services/api";
  
  
  const QUESTION_TYPES = [
    {
      value: "mcq",
      label: "Multiple Choice",
    },
    {
      value: "true_false",
      label: "True / False",
    },
    {
      value: "fill_blank",
      label: "Fill Blank",
    },
    {
      value: "short_answer",
      label: "Short Answer",
    },
  ];
  
  
  const makeDefaultOptions = () => [
    {
      option_text: "",
      is_correct: true,
    },
    {
      option_text: "",
      is_correct: false,
    },
    {
      option_text: "",
      is_correct: false,
    },
    {
      option_text: "",
      is_correct: false,
    },
  ];
  
  
  const emptyForm = () => ({
    grade_id: "",
    course_id: "",
    course_section_id: "",
  
    question_text: "",
    type: "mcq",
  
    skill: "",
    topic: "",
    points: 1,
  
    correct_answer: "",
    explanation: "",
  
    status: "Draft",
  
    options: makeDefaultOptions(),
  });
  import {
    useLanguage,
  } from "../../context/LanguageContext";
  

  
  
  function QuestionBank() {
    const { tr } = useLanguage();

    // =====================================
    // State
    // =====================================
  
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
      questions,
      setQuestions,
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
    ] = useState(
      emptyForm()
    );
  
    const [
      editingId,
      setEditingId,
    ] = useState(null);
  
  
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
    // Helpers
    // =====================================
  
    const extractArray = (
      value,
      key
    ) => {
  
      const source =
        key
          ? value?.[key]
          : value;
  
  
      if (
        Array.isArray(source)
      ) {
        return source;
      }
  
  
      if (
        Array.isArray(
          source?.data
        )
      ) {
        return source.data;
      }
  
  
      if (
        Array.isArray(
          value?.data
        )
      ) {
        return value.data;
      }
  
  
      return [];
    };
  
  
    const typeLabel = (
      value
    ) =>
      QUESTION_TYPES.find(
        (item) =>
          item.value === value
      )?.label ||
      value ||
      "Question";
  
  
    const normalizeOptions = (
      options = []
    ) => {
  
      const normalized =
        options.map(
          (option) => ({
            option_text:
              option.option_text ||
              "",
  
            is_correct:
              Boolean(
                option.is_correct
              ),
          })
        );
  
  
      if (
        normalized.length >= 2
      ) {
  
        const hasCorrect =
          normalized.some(
            (option) =>
              option.is_correct
          );
  
  
        if (!hasCorrect) {
          normalized[0].is_correct =
            true;
        }
  
  
        return normalized;
      }
  
  
      return makeDefaultOptions();
    };
  
  
    const scopeText = (
      question
    ) => {
  
      const parts = [
        question.grade
          ?.academic_stage
          ?.name ||
        question.grade
          ?.academicStage
          ?.name,
  
        question.grade
          ?.name,
  
        question.course
          ?.title,
  
        question.section
          ?.title,
      ].filter(Boolean);
  
  
      return (
        parts.join(" • ") ||
        "General Question"
      );
    };
  
  
    // =====================================
    // Derived Academic Data
    // =====================================
  
    const availableGrades =
      useMemo(
        () => {
  
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
  
  
    const availableCourses =
      useMemo(
        () => {
  
          if (
            !selectedGradeId
          ) {
            return [];
          }
  
  
          return courses.filter(
            (course) =>
              Number(
                course.grade_id
              ) ===
              Number(
                selectedGradeId
              )
          );
        },
        [
          courses,
          selectedGradeId,
        ]
      );
  
  
    // =====================================
    // Load Data
    // =====================================
  
    const fetchData =
      async () => {
  
        try {
  
          setLoading(true);
          setPageError("");
  
  
          const [
            academicResponse,
            coursesResponse,
            questionsResponse,
          ] = await Promise.all([
            api.get(
              "/public/academic-structure"
            ),
  
            api.get(
              "/courses"
            ),
  
            api.get(
              "/questions"
            ),
          ]);
  
  
          setStages(
            extractArray(
              academicResponse.data,
              "stages"
            )
          );
  
  
          setCourses(
            extractArray(
              coursesResponse.data,
              "courses"
            )
          );
  
  
          setQuestions(
            extractArray(
              questionsResponse.data,
              "questions"
            )
          );
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to load the question bank."
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
      async (
        courseId
      ) => {
  
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
            extractArray(
              response.data,
              "sections"
            )
          );
  
        } catch (error) {
  
          setSections([]);
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to load course sections."
          );
        }
      };
  
  
    // =====================================
    // Filters
    // =====================================
  
    const filteredQuestions =
      useMemo(
        () => {
  
          const term =
            search
              .trim()
              .toLowerCase();
  
  
          return questions.filter(
            (question) => {
  
              const haystack = [
                question.question_text,
                question.skill,
                question.topic,
                question.type,
                question.status,
                question.grade?.name,
                question.course?.title,
                question.section?.title,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
  
  
              const matchesSearch =
                !term ||
                haystack.includes(term);
  
  
              const matchesType =
                typeFilter ===
                  "all" ||
                question.type ===
                  typeFilter;
  
  
              const matchesStatus =
                statusFilter ===
                  "all" ||
                question.status ===
                  statusFilter;
  
  
              return (
                matchesSearch &&
                matchesType &&
                matchesStatus
              );
            }
          );
        },
        [
          questions,
          search,
          typeFilter,
          statusFilter,
        ]
      );
  
  
    const stats =
      useMemo(
        () => ({
          total:
            questions.length,
  
          published:
            questions.filter(
              (question) =>
                question.status ===
                "Published"
            ).length,
  
          draft:
            questions.filter(
              (question) =>
                question.status ===
                "Draft"
            ).length,
  
          mcq:
            questions.filter(
              (question) =>
                question.type ===
                "mcq"
            ).length,
        }),
        [questions]
      );
  
  
    // =====================================
    // Generic Change
    // =====================================
  
    const handleChange = (
      event
    ) => {
  
      const {
        name,
        value,
      } = event.target;
  
  
      setFormData(
        (current) => ({
          ...current,
  
          [name]:
            name === "points"
              ? value
              : value,
        })
      );
  
  
      setErrors(
        (current) => ({
          ...current,
          [name]: undefined,
        })
      );
    };
  
  
    // =====================================
    // Academic Scope
    // =====================================
  
    const handleStageChange = (
      event
    ) => {
  
      const value =
        event.target.value;
  
  
      setSelectedStageId(
        value
      );
  
      setSelectedGradeId("");
  
      setSections([]);
  
  
      setFormData(
        (current) => ({
          ...current,
  
          grade_id: "",
          course_id: "",
          course_section_id:
            "",
        })
      );
    };
  
  
    const handleGradeChange = (
      event
    ) => {
  
      const value =
        event.target.value;
  
  
      setSelectedGradeId(
        value
      );
  
      setSections([]);
  
  
      setFormData(
        (current) => ({
          ...current,
  
          grade_id:
            value
              ? Number(value)
              : "",
  
          course_id: "",
          course_section_id:
            "",
        })
      );
    };
  
  
    const handleCourseChange =
      async (
        event
      ) => {
  
        const value =
          event.target.value;
  
  
        setFormData(
          (current) => ({
            ...current,
  
            course_id:
              value
                ? Number(value)
                : "",
  
            course_section_id:
              "",
          })
        );
  
  
        await loadSections(
          value
        );
      };
  
  
    // =====================================
    // Question Type
    // =====================================
  
    const handleTypeChange = (
      event
    ) => {
  
      const nextType =
        event.target.value;
  
  
      setFormData(
        (current) => ({
          ...current,
  
          type: nextType,
  
          correct_answer:
            nextType ===
              "true_false"
              ? (
                  current
                    .correct_answer ===
                    "false"
                    ? "false"
                    : "true"
                )
              : (
                  nextType ===
                    "fill_blank"
                    ? current
                        .correct_answer
                    : ""
                ),
  
          options:
            nextType ===
              "mcq"
              ? (
                  current.options
                    ?.length >= 2
                    ? normalizeOptions(
                        current.options
                      )
                    : makeDefaultOptions()
                )
              : [],
        })
      );
    };
  
  
    // =====================================
    // MCQ Options
    // =====================================
  
    const handleOptionText = (
      index,
      value
    ) => {
  
      setFormData(
        (current) => ({
          ...current,
  
          options:
            current.options.map(
              (
                option,
                optionIndex
              ) =>
                optionIndex ===
                index
                  ? {
                      ...option,
                      option_text:
                        value,
                    }
                  : option
            ),
        })
      );
    };
  
  
    const setCorrectOption = (
      index
    ) => {
  
      setFormData(
        (current) => ({
          ...current,
  
          options:
            current.options.map(
              (
                option,
                optionIndex
              ) => ({
                ...option,
  
                is_correct:
                  optionIndex ===
                  index,
              })
            ),
        })
      );
    };
  
  
    const addOption = () => {
  
      setFormData(
        (current) => ({
          ...current,
  
          options: [
            ...current.options,
  
            {
              option_text: "",
              is_correct: false,
            },
          ],
        })
      );
    };
  
  
    const removeOption = (
      index
    ) => {
  
      setFormData(
        (current) => {
  
          if (
            current.options
              .length <= 2
          ) {
            return current;
          }
  
  
          const removedCorrect =
            current.options[index]
              ?.is_correct;
  
  
          const next =
            current.options.filter(
              (
                _,
                optionIndex
              ) =>
                optionIndex !==
                index
            );
  
  
          if (
            removedCorrect &&
            next.length > 0
          ) {
            next[0] = {
              ...next[0],
              is_correct: true,
            };
          }
  
  
          return {
            ...current,
            options: next,
          };
        }
      );
    };
  
  
    // =====================================
    // Reset
    // =====================================
  
    const resetForm = () => {
  
      setEditingId(null);
  
      setSelectedStageId("");
      setSelectedGradeId("");
  
      setSections([]);
  
      setFormData(
        emptyForm()
      );
  
      setErrors({});
      setMessage("");
      setPageError("");
    };
  
  
    // =====================================
    // Edit
    // =====================================
  
    const handleEdit =
      async (
        question
      ) => {
  
        const grade =
          question.grade ||
          question.course
            ?.grade ||
          null;
  
  
        const gradeId =
          question.grade_id ||
          grade?.id ||
          question.course
            ?.grade_id ||
          "";
  
  
        const stageId =
          grade
            ?.academic_stage
            ?.id ||
          grade
            ?.academicStage
            ?.id ||
          "";
  
  
        setEditingId(
          question.id
        );
  
  
        setSelectedStageId(
          stageId
        );
  
        setSelectedGradeId(
          gradeId
        );
  
  
        if (
          question.course_id
        ) {
          await loadSections(
            question.course_id
          );
        } else {
          setSections([]);
        }
  
  
        setFormData({
          grade_id:
            gradeId || "",
  
          course_id:
            question.course_id ||
            "",
  
          course_section_id:
            question
              .course_section_id ||
            "",
  
          question_text:
            question
              .question_text ||
            "",
  
          type:
            question.type ||
            "mcq",
  
          skill:
            question.skill ||
            "",
  
          topic:
            question.topic ||
            "",
  
          points:
            question.points ??
            1,
  
          correct_answer:
            question
              .correct_answer ||
            (
              question.type ===
                "true_false"
                ? "true"
                : ""
            ),
  
          explanation:
            question
              .explanation ||
            "",
  
          status:
            question.status ||
            "Draft",
  
          options:
            question.type ===
              "mcq"
              ? normalizeOptions(
                  question.options
                )
              : [],
        });
  
  
        setErrors({});
        setMessage("");
        setPageError("");
  
  
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      };
  
  
    // =====================================
    // Duplicate
    // =====================================
  
    const handleDuplicate =
      async (
        question
      ) => {
  
        await handleEdit(
          question
        );
  
  
        setEditingId(null);
  
  
        setFormData(
          (current) => ({
            ...current,
  
            question_text:
              current
                .question_text
                ? `${current.question_text} (Copy)`
                : "",
  
            status: "Draft",
          })
        );
  
  
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      };
  
  
    // =====================================
    // Validation Before Submit
    // =====================================
  
    const localValidation =
      () => {
  
        const nextErrors = {};
  
  
        if (
          !formData
            .question_text
            .trim()
        ) {
          nextErrors
            .question_text = [
            "Question text is required.",
          ];
        }
  
  
        if (
          Number(
            formData.points
          ) <= 0
        ) {
          nextErrors.points = [
            "Points must be greater than 0.",
          ];
        }
  
  
        if (
          formData.type ===
          "mcq"
        ) {
  
          const cleanOptions =
            formData.options.filter(
              (option) =>
                option
                  .option_text
                  .trim()
            );
  
  
          if (
            cleanOptions.length < 2
          ) {
            nextErrors.options = [
              "Add at least two answer options.",
            ];
          }
  
  
          const correctCount =
            cleanOptions.filter(
              (option) =>
                option.is_correct
            ).length;
  
  
          if (
            correctCount !== 1
          ) {
            nextErrors.options = [
              "Choose exactly one correct answer.",
            ];
          }
        }
  
  
        if (
          (
            formData.type ===
              "true_false" ||
            formData.type ===
              "fill_blank"
          ) &&
          !String(
            formData
              .correct_answer ||
            ""
          ).trim()
        ) {
          nextErrors
            .correct_answer = [
            "Correct answer is required.",
          ];
        }
  
  
        setErrors(
          nextErrors
        );
  
  
        return (
          Object.keys(
            nextErrors
          ).length === 0
        );
      };
  
  
    // =====================================
    // Submit
    // =====================================
  
    const handleSubmit =
      async (
        event
      ) => {
  
        event.preventDefault();
  
  
        if (
          !localValidation()
        ) {
          return;
        }
  
  
        try {
  
          setSaving(true);
          setMessage("");
          setPageError("");
  
  
          const payload = {
            grade_id:
              formData.grade_id
                ? Number(
                    formData.grade_id
                  )
                : null,
  
            course_id:
              formData.course_id
                ? Number(
                    formData.course_id
                  )
                : null,
  
            course_section_id:
              formData
                .course_section_id
                ? Number(
                    formData
                      .course_section_id
                  )
                : null,
  
            question_text:
              formData
                .question_text
                .trim(),
  
            type:
              formData.type,
  
            skill:
              formData.skill
                .trim() ||
              null,
  
            topic:
              formData.topic
                .trim() ||
              null,
  
            points:
              Number(
                formData.points
              ),
  
            correct_answer:
              (
                formData.type ===
                  "true_false" ||
                formData.type ===
                  "fill_blank"
              )
                ? String(
                    formData
                      .correct_answer
                  ).trim()
                : null,
  
            explanation:
              formData
                .explanation
                .trim() ||
              null,
  
            status:
              formData.status,
  
            options:
              formData.type ===
                "mcq"
                ? formData.options
                    .filter(
                      (option) =>
                        option
                          .option_text
                          .trim()
                    )
                    .map(
                      (option) => ({
                        option_text:
                          option
                            .option_text
                            .trim(),
  
                        is_correct:
                          Boolean(
                            option
                              .is_correct
                          ),
                      })
                    )
                : [],
          };
  
  
          if (editingId) {
  
            await api.put(
              `/questions/${editingId}`,
              payload
            );
  
  
            setMessage(
              "Question updated successfully."
            );
  
          } else {
  
            await api.post(
              "/questions",
              payload
            );
  
  
            setMessage(
              "Question created successfully."
            );
          }
  
  
          setEditingId(null);
  
          setSelectedStageId("");
          setSelectedGradeId("");
  
          setSections([]);
  
          setFormData(
            emptyForm()
          );
  
          setErrors({});
  
  
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
  
            setPageError(
              error.response?.data
                ?.message ||
              "Please review the highlighted fields."
            );
  
          } else {
  
            setPageError(
              error.response?.data
                ?.message ||
              "Unable to save the question."
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
      async (
        question
      ) => {
  
        const confirmed =
          window.confirm(
            `Delete this question?\n\n${question.question_text}`
          );
  
  
        if (!confirmed) {
          return;
        }
  
  
        try {
  
          setMessage("");
          setPageError("");
  
  
          await api.delete(
            `/questions/${question.id}`
          );
  
  
          if (
            Number(editingId) ===
            Number(question.id)
          ) {
            resetForm();
          }
  
  
          setMessage(
            "Question deleted successfully."
          );
  
  
          await fetchData();
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to delete the question."
          );
        }
      };
  
  
    // =====================================
    // UI Helpers
    // =====================================
  
    const renderAnswerPreview = (
      question
    ) => {
  
      if (
        question.type ===
          "mcq" &&
        question.options
          ?.length
      ) {
  
        return (
          <div className="premium-qb-answer-preview">
  
            {question.options
              .slice(0, 5)
              .map(
                (option) => (
  
                  <span
                    key={
                      option.id ||
                      option.option_text
                    }
                    className={
                      option.is_correct
                        ? "correct"
                        : ""
                    }
                  >
  
                    {
                      option.is_correct && (
                        <Check
                          size={11}
                        />
                      )
                    }
  
                    {
                      option.option_text
                    }
  
                  </span>
  
                )
              )}
  
          </div>
        );
      }
  
  
      if (
        question.type ===
        "true_false"
      ) {
  
        return (
          <div className="premium-qb-answer-line">
  
            <span>{tr("Correct answer")}</span>
  
            <strong>
              {
                String(
                  question
                    .correct_answer
                ).toLowerCase() ===
                  "false"
                  ? "False"
                  : "True"
              }
            </strong>
  
          </div>
        );
      }
  
  
      if (
        question.type ===
        "fill_blank"
      ) {
  
        return (
          <div className="premium-qb-answer-line">
  
            <span>{tr("Correct answer")}</span>
  
            <strong>
              {
                question
                  .correct_answer ||
                "—"
              }
            </strong>
  
          </div>
        );
      }
  
  
      return (
        <div className="premium-qb-manual-note">{tr("Manual grading")}</div>
      );
    };
  
  
    if (loading) {
  
      return (
        <div className="premium-admin-loading">
  
          <span className="premium-spinner" />
  
          <p>{tr("Loading question bank...")}</p>
  
        </div>
      );
    }
  
  
    return (
      <div className="premium-question-bank">
  
        {/* =================================
            Page Header
        ================================= */}
  
        <div className="premium-qb-page-head">
  
          <div>
  
            <span className="premium-qb-eyebrow">{tr("Assessment Library")}</span>
  
            <h1>{tr("Question Bank")}</h1>
  
            <p>{tr("Build reusable English questions and attach them to quizzes, homework and exams.")}</p>
  
          </div>
  
  
          <button
            type="button"
            className="premium-qb-new"
            onClick={
              resetForm
            }
          >
            <Plus size={15} />{tr("New Question")}</button>
  
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
            Statistics
        ================================= */}
  
        <div className="premium-qb-stats">
  
          <article>
            <CircleHelp size={17} />
  
            <div>
              <strong>
                {stats.total}
              </strong>
  
              <span>{tr("Total Questions")}</span>
            </div>
          </article>
  
  
          <article>
            <CheckCircle2 size={17} />
  
            <div>
              <strong>
                {stats.published}
              </strong>
  
              <span>{tr("Published")}</span>
            </div>
          </article>
  
  
          <article>
            <FileQuestion size={17} />
  
            <div>
              <strong>
                {stats.draft}
              </strong>
  
              <span>{tr("Drafts")}</span>
            </div>
          </article>
  
  
          <article>
            <Layers3 size={17} />
  
            <div>
              <strong>
                {stats.mcq}
              </strong>
  
              <span>{tr("Multiple Choice")}</span>
            </div>
          </article>
  
        </div>
  
  
        {/* =================================
            Workspace
        ================================= */}
  
        <div className="premium-qb-workspace">
  
          {/* ===============================
              Editor
          =============================== */}
  
          <aside className="premium-qb-editor">
  
            <div className="premium-qb-editor-head">
  
              <div>
  
                <span>
                  {
                    editingId
                      ? "Editing"
                      : "Create"
                  }
                </span>
  
                <h2>
                  {
                    editingId
                      ? `Question #${editingId}`
                      : "New Question"
                  }
                </h2>
  
              </div>
  
  
              {editingId && (
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="premium-qb-icon-btn"
                  title={tr("Cancel editing")}
                >
                  <X size={15} />
                </button>
              )}
  
            </div>
  
  
            <form
              onSubmit={
                handleSubmit
              }
              className="premium-qb-form"
            >
  
              {/* Type */}
  
              <div className="premium-qb-field full">
  
                <label>{tr("Question Type")}</label>
  
  
                <div className="premium-qb-type-grid">
  
                  {QUESTION_TYPES.map(
                    (item) => (
  
                      <button
                        key={
                          item.value
                        }
                        type="button"
                        className={
                          formData.type ===
                          item.value
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          handleTypeChange({
                            target: {
                              value:
                                item.value,
                            },
                          })
                        }
                      >
                        {
                          item.label
                        }
                      </button>
  
                    )
                  )}
  
                </div>
  
              </div>
  
  
              {/* Question */}
  
              <div className="premium-qb-field full">
  
                <label>{tr("Question")}</label>
  
  
                <textarea
                  name="question_text"
                  rows="4"
                  value={
                    formData
                      .question_text
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={tr("Write the question clearly...")}
                />
  
  
                {errors.question_text && (
                  <span className="field-error">
                    {
                      errors
                        .question_text[0]
                    }
                  </span>
                )}
  
              </div>
  
  
              {/* Academic Scope */}
  
              <div className="premium-qb-section-title">
  
                <BookOpenCheck
                  size={14}
                />
  
                <span>{tr("Academic Scope")}</span>
  
              </div>
  
  
              <div className="premium-qb-form-grid">
  
                <div className="premium-qb-field">
  
                  <label>{tr("Stage")}</label>
  
  
                  <select
                    value={
                      selectedStageId
                    }
                    onChange={
                      handleStageChange
                    }
                  >
                    <option value="">{tr("General / Any Stage")}</option>
  
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
                          {
                            stage.name
                          }
                        </option>
                      )
                    )}
                  </select>
  
                </div>
  
  
                <div className="premium-qb-field">
  
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
                    <option value="">{tr("General / Any Grade")}</option>
  
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
                          {
                            grade.name
                          }
                        </option>
                      )
                    )}
                  </select>
  
                </div>
  
  
                <div className="premium-qb-field">
  
                  <label>{tr("Course")}</label>
  
  
                  <select
                    value={
                      formData
                        .course_id
                    }
                    onChange={
                      handleCourseChange
                    }
                    disabled={
                      !selectedGradeId
                    }
                  >
                    <option value="">{tr("General / Any Course")}</option>
  
                    {availableCourses.map(
                      (course) => (
                        <option
                          key={
                            course.id
                          }
                          value={
                            course.id
                          }
                        >
                          {
                            course.title
                          }
                        </option>
                      )
                    )}
                  </select>
  
                </div>
  
  
                <div className="premium-qb-field">
  
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
                    <option value="">{tr("Whole Course")}</option>
  
                    {sections.map(
                      (section) => (
                        <option
                          key={
                            section.id
                          }
                          value={
                            section.id
                          }
                        >
                          {
                            section.title
                          }
                        </option>
                      )
                    )}
                  </select>
  
                </div>
  
              </div>
  
  
              {/* Classification */}
  
              <div className="premium-qb-section-title">
  
                <Sparkles size={14} />
  
                <span>{tr("Classification")}</span>
  
              </div>
  
  
              <div className="premium-qb-form-grid">
  
                <div className="premium-qb-field">
  
                  <label>{tr("Skill")}</label>
  
  
                  <input
                    type="text"
                    name="skill"
                    value={
                      formData.skill
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={tr("Grammar, Reading...")}
                  />
  
                </div>
  
  
                <div className="premium-qb-field">
  
                  <label>{tr("Topic")}</label>
  
  
                  <input
                    type="text"
                    name="topic"
                    value={
                      formData.topic
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={tr("Present Simple...")}
                  />
  
                </div>
  
  
                <div className="premium-qb-field">
  
                  <label>{tr("Default Points")}</label>
  
  
                  <input
                    type="number"
                    name="points"
                    min="0.01"
                    step="0.25"
                    value={
                      formData.points
                    }
                    onChange={
                      handleChange
                    }
                  />
  
  
                  {errors.points && (
                    <span className="field-error">
                      {
                        errors
                          .points[0]
                      }
                    </span>
                  )}
  
                </div>
  
  
                <div className="premium-qb-field">
  
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
  
  
              {/* Answer Builder */}
  
              <div className="premium-qb-section-title">
  
                <CheckCircle2
                  size={14}
                />
  
                <span>{tr("Answer")}</span>
  
              </div>
  
  
              {formData.type ===
              "mcq" && (
  
                <div className="premium-qb-mcq-builder">
  
                  {formData.options.map(
                    (
                      option,
                      index
                    ) => (
  
                      <div
                        className={
                          option.is_correct
                            ? "premium-qb-option-row correct"
                            : "premium-qb-option-row"
                        }
                        key={index}
                      >
  
                        <button
                          type="button"
                          className="premium-qb-correct-radio"
                          onClick={() =>
                            setCorrectOption(
                              index
                            )
                          }
                          title={tr("Mark as correct")}
                        >
                          {
                            option.is_correct
                              ? (
                                <Check
                                  size={13}
                                />
                              )
                              : (
                                <span />
                              )
                          }
                        </button>
  
  
                        <input
                          type="text"
                          value={
                            option
                              .option_text
                          }
                          onChange={
                            (event) =>
                              handleOptionText(
                                index,
                                event
                                  .target
                                  .value
                              )
                          }
                          placeholder={
                            `Option ${index + 1}`
                          }
                        />
  
  
                        <button
                          type="button"
                          className="premium-qb-remove-option"
                          onClick={() =>
                            removeOption(
                              index
                            )
                          }
                          disabled={
                            formData
                              .options
                              .length <= 2
                          }
                          title={tr("Remove option")}
                        >
                          <Trash2
                            size={13}
                          />
                        </button>
  
                      </div>
  
                    )
                  )}
  
  
                  {errors.options && (
                    <span className="field-error">
                      {
                        errors
                          .options[0]
                      }
                    </span>
                  )}
  
  
                  <button
                    type="button"
                    className="premium-qb-add-option"
                    onClick={
                      addOption
                    }
                  >
                    <Plus size={13} />{tr("Add Option")}</button>
  
                </div>
  
              )}
  
  
              {formData.type ===
              "true_false" && (
  
                <div className="premium-qb-true-false">
  
                  <button
                    type="button"
                    className={
                      formData
                        .correct_answer ===
                      "true"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setFormData(
                        (current) => ({
                          ...current,
                          correct_answer:
                            "true",
                        })
                      )
                    }
                  >
                    <CheckCircle2
                      size={16}
                    />{tr("True")}</button>
  
  
                  <button
                    type="button"
                    className={
                      formData
                        .correct_answer ===
                      "false"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setFormData(
                        (current) => ({
                          ...current,
                          correct_answer:
                            "false",
                        })
                      )
                    }
                  >
                    <CircleHelp
                      size={16}
                    />{tr("False")}</button>
  
                </div>
  
              )}
  
  
              {formData.type ===
              "fill_blank" && (
  
                <div className="premium-qb-field full">
  
                  <label>{tr("Correct Answer")}</label>
  
  
                  <input
                    type="text"
                    name="correct_answer"
                    value={
                      formData
                        .correct_answer
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={tr("Exact accepted answer")}
                  />
  
  
                  {errors.correct_answer && (
                    <span className="field-error">
                      {
                        errors
                          .correct_answer[0]
                      }
                    </span>
                  )}
  
                </div>
  
              )}
  
  
              {formData.type ===
              "short_answer" && (
  
                <div className="premium-qb-manual-box">
  
                  <FileQuestion
                    size={18}
                  />
  
                  <div>
                    <strong>{tr("Manual grading")}</strong>
  
                    <span>{tr("Students type a written answer. The teacher grades it after submission.")}</span>
                  </div>
  
                </div>
  
              )}
  
  
              {/* Explanation */}
  
              <div className="premium-qb-field full">
  
                <label>{tr("Explanation")}</label>
  
  
                <textarea
                  name="explanation"
                  rows="3"
                  value={
                    formData
                      .explanation
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={tr("Optional explanation shown when answers are reviewed...")}
                />
  
              </div>
  
  
              {/* Actions */}
  
              <div className="premium-qb-form-actions">
  
                <button
                  type="submit"
                  className="premium-qb-save"
                  disabled={saving}
                >
                  <Save size={14} />
  
                  {
                    saving
                      ? "Saving..."
                      : editingId
                        ? "Update Question"
                        : "Create Question"
                  }
                </button>
  
  
                <button
                  type="button"
                  className="premium-qb-reset"
                  onClick={
                    resetForm
                  }
                >
                  <RotateCcw
                    size={14}
                  />{tr("Reset")}</button>
  
              </div>
  
            </form>
  
          </aside>
  
  
          {/* ===============================
              Library
          =============================== */}
  
          <section className="premium-qb-library">
  
            <div className="premium-qb-library-head">
  
              <div>
  
                <span>{tr("Library")}</span>
  
                <h2>{tr("All Questions")}</h2>
  
              </div>
  
  
              <strong>
                {
                  filteredQuestions
                    .length
                }
              </strong>
  
            </div>
  
  
            <div className="premium-qb-toolbar">
  
              <div className="premium-qb-search">
  
                <Search size={15} />
  
                <input
                  type="search"
                  placeholder={tr("Search question, topic, skill...")}
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                  }
                />
  
              </div>
  
  
              <div className="premium-qb-filter-select">
  
                <Filter size={13} />
  
                <select
                  value={
                    typeFilter
                  }
                  onChange={
                    (event) =>
                      setTypeFilter(
                        event
                          .target
                          .value
                      )
                  }
                >
                  <option value="all">{tr("All Types")}</option>
  
                  {QUESTION_TYPES.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    )
                  )}
                </select>
  
              </div>
  
  
              <div className="premium-qb-filter-select">
  
                <ChevronDown
                  size={13}
                />
  
                <select
                  value={
                    statusFilter
                  }
                  onChange={
                    (event) =>
                      setStatusFilter(
                        event
                          .target
                          .value
                      )
                  }
                >
                  <option value="all">{tr("All Statuses")}</option>
  
                  <option value="Published">{tr("Published")}</option>
  
                  <option value="Draft">{tr("Draft")}</option>
                </select>
  
              </div>
  
            </div>
  
  
            {filteredQuestions.length ===
            0 ? (
  
              <div className="premium-qb-empty">
  
                <CircleHelp
                  size={27}
                />
  
                <h3>{tr("No questions found")}</h3>
  
                <p>{tr("Create a new question or change your filters.")}</p>
  
              </div>
  
            ) : (
  
              <div className="premium-qb-question-list">
  
                {filteredQuestions.map(
                  (question) => (
  
                    <article
                      className={
                        Number(
                          editingId
                        ) ===
                        Number(
                          question.id
                        )
                          ? "premium-qb-card editing"
                          : "premium-qb-card"
                      }
                      key={
                        question.id
                      }
                    >
  
                      <div className="premium-qb-card-top">
  
                        <div className="premium-qb-card-badges">
  
                          <span className="premium-qb-type-badge">
                            {
                              typeLabel(
                                question
                                  .type
                              )
                            }
                          </span>
  
  
                          <span
                            className={
                              question.status ===
                              "Published"
                                ? "premium-qb-status published"
                                : "premium-qb-status draft"
                            }
                          >
                            {
                              question
                                .status ||
                              "Draft"
                            }
                          </span>
  
                        </div>
  
  
                        <span className="premium-qb-points">
                          {
                            Number(
                              question
                                .points ??
                              0
                            )
                          }{" "}
                          pts
                        </span>
  
                      </div>
  
  
                      <h3>
                        {
                          question
                            .question_text
                        }
                      </h3>
  
  
                      <div className="premium-qb-scope">
                        {
                          scopeText(
                            question
                          )
                        }
                      </div>
  
  
                      {
                        (
                          question.skill ||
                          question.topic
                        ) && (
  
                          <div className="premium-qb-tags">
  
                            {
                              question.skill && (
                                <span>
                                  {
                                    question
                                      .skill
                                  }
                                </span>
                              )
                            }
  
  
                            {
                              question.topic && (
                                <span>
                                  {
                                    question
                                      .topic
                                  }
                                </span>
                              )
                            }
  
                          </div>
  
                        )
                      }
  
  
                      {
                        renderAnswerPreview(
                          question
                        )
                      }
  
  
                      {
                        question
                          .explanation && (
  
                          <p className="premium-qb-explanation">
                            {
                              question
                                .explanation
                            }
                          </p>
  
                        )
                      }
  
  
                      <div className="premium-qb-card-actions">
  
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              question
                            )
                          }
                        >
                          <Edit3
                            size={13}
                          />{tr("Edit")}</button>
  
  
                        <button
                          type="button"
                          onClick={() =>
                            handleDuplicate(
                              question
                            )
                          }
                        >
                          <Copy
                            size={13}
                          />{tr("Duplicate")}</button>
  
  
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            handleDelete(
                              question
                            )
                          }
                        >
                          <Trash2
                            size={13}
                          />{tr("Delete")}</button>
  
                      </div>
  
                    </article>
  
                  )
                )}
  
              </div>
  
            )}
  
          </section>
  
        </div>
  
      </div>
    );
  }
  
  
  export default QuestionBank;
  