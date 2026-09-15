import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    BookOpen,
    Check,
    CircleDot,
    HelpCircle,
    Layers3,
    Plus,
    Save,
    Search,
    Trash2,
  } from "lucide-react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import api
    from "../../services/api";
  import {
    useLanguage,
  } from "../../context/LanguageContext";
  

  
  
  function AssessmentQuestions() {
    const { tr } = useLanguage();

    const navigate =
      useNavigate();
  
    const params =
      useParams();
  
    const assessmentId =
      params.assessmentId ||
      params.id;
  
  
    const [
      assessment,
      setAssessment,
    ] = useState(null);
  
    const [
      availableQuestions,
      setAvailableQuestions,
    ] = useState([]);
  
    const [
      selectedQuestions,
      setSelectedQuestions,
    ] = useState([]);
  
    const [
      search,
      setSearch,
    ] = useState("");
  
    const [
      typeFilter,
      setTypeFilter,
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
      message,
      setMessage,
    ] = useState("");
  
    const [
      pageError,
      setPageError,
    ] = useState("");
  
  
    // =====================================
    // Normalize Selected Questions
    // =====================================
  
    const normalizeSelected =
      (questions = []) => {
  
        return [...questions]
          .map(
            (
              question,
              index
            ) => ({
              ...question,
  
              points:
                Number(
                  question.pivot
                    ?.points ??
                  question.points ??
                  1
                ) || 1,
  
              sort_order:
                Number(
                  question.pivot
                    ?.sort_order ??
                  index + 1
                ),
            })
          )
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order
          )
          .map(
            (
              question,
              index
            ) => ({
              ...question,
              sort_order:
                index + 1,
            })
          );
      };
  
  
    // =====================================
    // Load Data
    // =====================================
  
    const fetchData =
      async () => {
  
        if (!assessmentId) {
          setPageError(
            "Assessment ID is missing."
          );
          setLoading(false);
          return;
        }
  
  
        try {
  
          setLoading(true);
          setPageError("");
  
  
          const [
            assessmentResponse,
            availableResponse,
          ] = await Promise.all([
            api.get(
              `/assessments/${assessmentId}`
            ),
  
            api.get(
              `/assessments/${assessmentId}/available-questions`
            ),
          ]);
  
  
          const loadedAssessment =
            assessmentResponse
              .data
              .assessment;
  
  
          setAssessment(
            loadedAssessment
          );
  
  
          setSelectedQuestions(
            normalizeSelected(
              loadedAssessment
                ?.questions ||
              []
            )
          );
  
  
          setAvailableQuestions(
            availableResponse
              .data
              .questions ||
            []
          );
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            "Unable to load assessment questions."
          );
  
        } finally {
  
          setLoading(false);
        }
      };
  
  
    useEffect(() => {
      fetchData();
    }, [assessmentId]);
  
  
    // =====================================
    // Derived Data
    // =====================================
  
    const selectedIds =
      useMemo(
        () =>
          new Set(
            selectedQuestions.map(
              (question) =>
                Number(question.id)
            )
          ),
        [selectedQuestions]
      );
  
  
    const filteredBank =
      useMemo(
        () => {
  
          const term =
            search
              .trim()
              .toLowerCase();
  
  
          return availableQuestions.filter(
            (question) => {
  
              const matchesSearch =
                !term ||
                [
                  question.question_text,
                  question.topic,
                  question.skill,
                  question.type,
                  question.course
                    ?.title,
                  question.section
                    ?.title,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
                  .includes(term);
  
  
              const matchesType =
                typeFilter ===
                  "all" ||
                question.type ===
                  typeFilter;
  
  
              return (
                matchesSearch &&
                matchesType
              );
            }
          );
        },
        [
          availableQuestions,
          search,
          typeFilter,
        ]
      );
  
  
    const totalPoints =
      selectedQuestions.reduce(
        (
          total,
          question
        ) =>
          total +
          (
            Number(
              question.points
            ) || 0
          ),
        0
      );
  
  
    // =====================================
    // Selection
    // =====================================
  
    const addQuestion =
      (question) => {
  
        if (
          selectedIds.has(
            Number(question.id)
          )
        ) {
          return;
        }
  
  
        setSelectedQuestions(
          (current) => [
            ...current,
            {
              ...question,
  
              points:
                Number(
                  question.points
                ) || 1,
  
              sort_order:
                current.length + 1,
            },
          ]
        );
  
  
        setMessage("");
        setPageError("");
      };
  
  
    const removeQuestion =
      (questionId) => {
  
        setSelectedQuestions(
          (current) =>
            current
              .filter(
                (question) =>
                  Number(
                    question.id
                  ) !==
                  Number(
                    questionId
                  )
              )
              .map(
                (
                  question,
                  index
                ) => ({
                  ...question,
                  sort_order:
                    index + 1,
                })
              )
        );
  
  
        setMessage("");
      };
  
  
    const moveQuestion =
      (
        index,
        direction
      ) => {
  
        setSelectedQuestions(
          (current) => {
  
            const next =
              [...current];
  
  
            const target =
              index +
              direction;
  
  
            if (
              target < 0 ||
              target >=
                next.length
            ) {
              return current;
            }
  
  
            [
              next[index],
              next[target],
            ] = [
              next[target],
              next[index],
            ];
  
  
            return next.map(
              (
                question,
                position
              ) => ({
                ...question,
                sort_order:
                  position + 1,
              })
            );
          }
        );
  
  
        setMessage("");
      };
  
  
    const updatePoints =
      (
        questionId,
        value
      ) => {
  
        setSelectedQuestions(
          (current) =>
            current.map(
              (question) =>
                Number(
                  question.id
                ) ===
                Number(
                  questionId
                )
                  ? {
                      ...question,
  
                      points:
                        value === ""
                          ? ""
                          : Number(
                              value
                            ),
                    }
                  : question
            )
        );
  
  
        setMessage("");
      };
  
  
    // =====================================
    // Save
    // =====================================
  
    const handleSave =
      async () => {
  
        const invalid =
          selectedQuestions.find(
            (question) =>
              Number(
                question.points
              ) <= 0
          );
  
  
        if (invalid) {
  
          setPageError(
            "Every selected question must have points greater than 0."
          );
  
          return;
        }
  
  
        try {
  
          setSaving(true);
          setMessage("");
          setPageError("");
  
  
          const payload = {
            questions:
              selectedQuestions.map(
                (
                  question,
                  index
                ) => ({
                  question_id:
                    Number(
                      question.id
                    ),
  
                  points:
                    Number(
                      question.points
                    ),
  
                  sort_order:
                    index + 1,
                })
              ),
          };
  
  
          const response =
            await api.put(
              `/assessments/${assessmentId}/questions`,
              payload
            );
  
  
          const updated =
            response.data
              .assessment;
  
  
          if (
            updated?.questions
          ) {
  
            setSelectedQuestions(
              normalizeSelected(
                updated.questions
              )
            );
          }
  
  
          setMessage(
            "Assessment questions saved successfully."
          );
  
        } catch (error) {
  
          const validationMessage =
            error.response?.data
              ?.errors
              ?.questions?.[0];
  
  
          setPageError(
            validationMessage ||
            error.response?.data
              ?.message ||
            "Unable to save assessment questions."
          );
  
        } finally {
  
          setSaving(false);
        }
      };
  
  
    // =====================================
    // Helpers
    // =====================================
  
    const typeLabel =
      (value) => {
  
        const labels = {
          multiple_choice:
            "Multiple Choice",
  
          true_false:
            "True / False",
  
          fill_blank:
            "Fill Blank",
  
          short_answer:
            "Short Answer",
        };
  
  
        return (
          labels[value] ||
          value ||
          "Question"
        );
      };
  
  
    const questionScope =
      (question) => {
  
        if (
          question.section
            ?.title
        ) {
          return (
            question.section
              .title
          );
        }
  
  
        if (
          question.course
            ?.title
        ) {
          return (
            question.course
              .title
          );
        }
  
  
        return "General";
      };
  
  
    if (loading) {
  
      return (
        <div className="premium-admin-loading">
  
          <span className="premium-spinner" />
  
          <p>{tr("Preparing question manager...")}</p>
  
        </div>
      );
    }
  
  
    return (
      <div className="premium-assessment-question-manager">
  
        {/* Header */}
  
        <div className="premium-aq-header">
  
          <button
            type="button"
            className="premium-aq-back"
            onClick={() =>
              navigate(
                "/admin/assessments"
              )
            }
          >
            <ArrowLeft size={15} />{tr("Assessments")}</button>
  
  
          <div className="premium-aq-title">
  
            <span>{tr("Manage questions")}</span>
  
  
            <h1>
              {
                assessment
                  ?.title ||
                "Assessment"
              }
            </h1>
  
  
            <p>
  
              {
                assessment
                  ?.course
                  ?.title ||
                "-"
              }
  
              {
                assessment
                  ?.section
                  ?.title
                  ? ` • ${assessment.section.title}`
                  : " • Whole Course"
              }
  
            </p>
  
          </div>
  
  
          <button
            type="button"
            className="premium-aq-save"
            onClick={
              handleSave
            }
            disabled={saving}
          >
            <Save size={15} />
  
            {
              saving
                ? "Saving..."
                : "Save questions"
            }
          </button>
  
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
  
  
        {/* Summary */}
  
        <div className="premium-aq-summary">
  
          <article>
  
            <HelpCircle size={17} />
  
            <div>
              <strong>
                {
                  selectedQuestions
                    .length
                }
              </strong>
  
              <span>{tr("Selected")}</span>
            </div>
  
          </article>
  
  
          <article>
  
            <CircleDot size={17} />
  
            <div>
              <strong>
                {
                  totalPoints
                    .toFixed(2)
                }
              </strong>
  
              <span>{tr("Total points")}</span>
            </div>
  
          </article>
  
  
          <article>
  
            <Layers3 size={17} />
  
            <div>
              <strong>
                {
                  availableQuestions
                    .length
                }
              </strong>
  
              <span>{tr("Available")}</span>
            </div>
  
          </article>
  
        </div>
  
  
        {/* Main Workspace */}
  
        <div className="premium-aq-workspace">
  
          {/* Selected */}
  
          <section className="premium-aq-selected-panel">
  
            <div className="premium-aq-panel-head">
  
              <div>
  
                <span>{tr("Assessment")}</span>
  
                <h2>{tr("Selected questions")}</h2>
  
              </div>
  
  
              <strong>
                {
                  selectedQuestions
                    .length
                }
              </strong>
  
            </div>
  
  
            {selectedQuestions.length ===
            0 ? (
  
              <div className="premium-aq-empty">
  
                <HelpCircle size={25} />
  
                <strong>{tr("No questions selected.")}</strong>
  
                <span>{tr("Add questions from the bank on the right.")}</span>
  
              </div>
  
            ) : (
  
              <div className="premium-aq-selected-list">
  
                {selectedQuestions.map(
                  (
                    question,
                    index
                  ) => (
  
                    <article
                      key={
                        question.id
                      }
                      className="premium-aq-selected-card"
                    >
  
                      <div className="premium-aq-order">
                        {index + 1}
                      </div>
  
  
                      <div className="premium-aq-selected-main">
  
                        <div className="premium-aq-question-meta">
  
                          <span>
                            {
                              typeLabel(
                                question.type
                              )
                            }
                          </span>
  
  
                          {
                            question.skill && (
                              <span>
                                {
                                  question.skill
                                }
                              </span>
                            )
                          }
  
  
                          {
                            question.topic && (
                              <span>
                                {
                                  question.topic
                                }
                              </span>
                            )
                          }
  
                        </div>
  
  
                        <h3>
                          {
                            question
                              .question_text
                          }
                        </h3>
  
  
                        <small>
                          {
                            questionScope(
                              question
                            )
                          }
                        </small>
  
  
                        {
                          question.options
                            ?.length > 0 && (
  
                            <div className="premium-aq-option-preview">
  
                              {question.options
                                .slice(0, 4)
                                .map(
                                  (
                                    option
                                  ) => (
  
                                    <span
                                      key={
                                        option.id
                                      }
                                      className={
                                        option.is_correct
                                          ? "correct"
                                          : ""
                                      }
                                    >
                                      {
                                        option
                                          .is_correct && (
                                          <Check
                                            size={11}
                                          />
                                        )
                                      }
  
                                      {
                                        option
                                          .option_text
                                      }
                                    </span>
  
                                  )
                                )}
  
                            </div>
  
                          )
                        }
  
                      </div>
  
  
                      <div className="premium-aq-points">
  
                        <label>{tr("Points")}</label>
  
  
                        <input
                          type="number"
                          min="0.01"
                          step="0.25"
                          value={
                            question.points
                          }
                          onChange={
                            (event) =>
                              updatePoints(
                                question.id,
                                event
                                  .target
                                  .value
                              )
                          }
                        />
  
                      </div>
  
  
                      <div className="premium-aq-reorder">
  
                        <button
                          type="button"
                          disabled={
                            index === 0
                          }
                          onClick={() =>
                            moveQuestion(
                              index,
                              -1
                            )
                          }
                          title={tr("Move up")}
                        >
                          <ArrowUp
                            size={14}
                          />
                        </button>
  
  
                        <button
                          type="button"
                          disabled={
                            index ===
                            selectedQuestions
                              .length -
                              1
                          }
                          onClick={() =>
                            moveQuestion(
                              index,
                              1
                            )
                          }
                          title={tr("Move down")}
                        >
                          <ArrowDown
                            size={14}
                          />
                        </button>
  
  
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            removeQuestion(
                              question.id
                            )
                          }
                          title={tr("Remove question")}
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
  
                      </div>
  
                    </article>
  
                  )
                )}
  
              </div>
  
            )}
  
          </section>
  
  
          {/* Question Bank */}
  
          <aside className="premium-aq-bank-panel">
  
            <div className="premium-aq-panel-head">
  
              <div>
  
                <span>{tr("Question bank")}</span>
  
                <h2>{tr("Available questions")}</h2>
  
              </div>
  
  
              <BookOpen size={17} />
  
            </div>
  
  
            <div className="premium-aq-bank-tools">
  
              <div className="premium-aq-search">
  
                <Search size={15} />
  
                <input
                  type="search"
                  placeholder={tr("Search questions...")}
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
                <option value="all">{tr("All types")}</option>
  
                <option value="multiple_choice">{tr("Multiple Choice")}</option>
  
                <option value="true_false">{tr("True / False")}</option>
  
                <option value="fill_blank">{tr("Fill Blank")}</option>
  
                <option value="short_answer">{tr("Short Answer")}</option>
              </select>
  
            </div>
  
  
            <div className="premium-aq-bank-list">
  
              {filteredBank.length ===
              0 ? (
  
                <div className="premium-aq-empty compact">
  
                  <Search size={22} />
  
                  <strong>{tr("No matching questions.")}</strong>
  
                </div>
  
              ) : (
  
                filteredBank.map(
                  (question) => {
  
                    const selected =
                      selectedIds.has(
                        Number(
                          question.id
                        )
                      );
  
  
                    return (
                      <article
                        className={
                          selected
                            ? "premium-aq-bank-card selected"
                            : "premium-aq-bank-card"
                        }
                        key={
                          question.id
                        }
                      >
  
                        <div className="premium-aq-question-meta">
  
                          <span>
                            {
                              typeLabel(
                                question.type
                              )
                            }
                          </span>
  
  
                          {
                            question.skill && (
                              <span>
                                {
                                  question.skill
                                }
                              </span>
                            )
                          }
  
                        </div>
  
  
                        <h3>
                          {
                            question
                              .question_text
                          }
                        </h3>
  
  
                        <div className="premium-aq-bank-foot">
  
                          <small>
                            {
                              questionScope(
                                question
                              )
                            }
                          </small>
  
  
                          <button
                            type="button"
                            disabled={
                              selected
                            }
                            onClick={() =>
                              addQuestion(
                                question
                              )
                            }
                          >
  
                            {
                              selected
                                ? (
                                  <>
                                    <Check
                                      size={13}
                                    />{tr("Added")}</>
                                )
                                : (
                                  <>
                                    <Plus
                                      size={13}
                                    />{tr("Add")}</>
                                )
                            }
  
                          </button>
  
                        </div>
  
                      </article>
                    );
                  }
                )
  
              )}
  
            </div>
  
          </aside>
  
        </div>
  
      </div>
    );
  }
  
  
  export default AssessmentQuestions;
  