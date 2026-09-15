import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    Award,
    BarChart3,
    BookOpen,
    CheckCircle2,
    Clock3,
    FileCheck2,
    Search,
    ShieldCheck,
    UserRound,
    X,
    XCircle,
  } from "lucide-react";
  
  import api
    from "../../services/api";

  import {
    useLanguage,
  } from "../../context/LanguageContext";
  
  
  function AssessmentResults() {
    const { t,
    tr,
  } =
      useLanguage();

    const [
      attempts,
      setAttempts,
    ] = useState([]);
  
    const [
      search,
      setSearch,
    ] = useState("");
  
    const [
      filter,
      setFilter,
    ] = useState("all");
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      pageError,
      setPageError,
    ] = useState("");
  
    const [
      message,
      setMessage,
    ] = useState("");
  
    const [
      reviewOpen,
      setReviewOpen,
    ] = useState(false);
  
    const [
      selectedAttempt,
      setSelectedAttempt,
    ] = useState(null);
  
    const [
      reviewAnswers,
      setReviewAnswers,
    ] = useState([]);
  
    const [
      gradeForm,
      setGradeForm,
    ] = useState({});
  
    const [
      loadingReview,
      setLoadingReview,
    ] = useState(false);
  
    const [
      savingReview,
      setSavingReview,
    ] = useState(false);
  
  
    // =====================================
    // Response Helpers
    // =====================================
  
    const extractList =
      (payload) => {
  
        if (
          Array.isArray(payload)
        ) {
          return payload;
        }
  
  
        const candidates = [
          payload?.attempts,
          payload?.data,
          payload?.results,
          payload?.assessment_attempts,
        ];
  
  
        for (
          const candidate
          of candidates
        ) {
  
          if (
            Array.isArray(
              candidate
            )
          ) {
            return candidate;
          }
  
  
          if (
            Array.isArray(
              candidate?.data
            )
          ) {
            return candidate.data;
          }
        }
  
  
        return [];
      };
  
  
    const normalizeAttempt =
      (attempt) => {
  
        const assessment =
          attempt.assessment ||
          {};
  
        const student =
          attempt.student ||
          {};
  
  
        const answers =
          attempt.answers ||
          [];
  
  
        const pendingManual =
          attempt.grading_status ===
            "pending_manual" ||
          Number(
            attempt.pending_manual_count ||
            0
          ) > 0 ||
          answers.some(
            (answer) =>
              Boolean(
                answer
                  .requires_manual_grading
              )
          );
  
  
        return {
          ...attempt,
  
          studentName:
            student.name ||
            attempt.student_name ||
            "-",
  
          studentEmail:
            student.email ||
            student.user?.email ||
            attempt.student_email ||
            "",
  
          assessmentTitle:
            assessment.title ||
            attempt.assessment_title ||
            "-",
  
          courseTitle:
            assessment.course
              ?.title ||
            attempt.course?.title ||
            attempt.course_title ||
            "-",
  
          score:
            Number(
              attempt.score
            ) || 0,
  
          maxScore:
            Number(
              attempt.max_score
            ) || 0,
  
          percentage:
            Number(
              attempt.percentage
            ) || 0,
  
          pendingManual,
        };
      };
  
  
    // =====================================
    // Load Attempt List
    // =====================================
  
    const fetchAttempts =
      async () => {
  
        try {
  
          setLoading(true);
          setPageError("");
  
  
          const response =
            await api.get(
              "/assessment-attempts"
            );
  
  
          setAttempts(
            extractList(
              response.data
            ).map(
              normalizeAttempt
            )
          );
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            t("finalUi.adminResults.loadError")
          );
  
        } finally {
  
          setLoading(false);
        }
      };
  
  
    useEffect(() => {
      fetchAttempts();
    }, [t]);
  
  
    // =====================================
    // Derived List
    // =====================================
  
    const filteredAttempts =
      useMemo(
        () => {
  
          const term =
            search
              .trim()
              .toLowerCase();
  
  
          return attempts.filter(
            (attempt) => {
  
              const matchesSearch =
                !term ||
                [
                  attempt.studentName,
                  attempt.studentEmail,
                  attempt.assessmentTitle,
                  attempt.courseTitle,
                  attempt.attempt_number,
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(term);
  
  
              let matchesFilter =
                true;
  
  
              if (
                filter ===
                "pending"
              ) {
  
                matchesFilter =
                  attempt.pendingManual;
  
              } else if (
                filter ===
                "completed"
              ) {
  
                matchesFilter =
                  !attempt.pendingManual;
  
              } else if (
                filter ===
                "passed"
              ) {
  
                matchesFilter =
                  !attempt.pendingManual &&
                  attempt.passed ===
                    true;
  
              } else if (
                filter ===
                "failed"
              ) {
  
                matchesFilter =
                  !attempt.pendingManual &&
                  attempt.passed ===
                    false;
              }
  
  
              return (
                matchesSearch &&
                matchesFilter
              );
            }
          );
        },
        [
          attempts,
          search,
          filter,
        ]
      );
  
  
    const pendingCount =
      attempts.filter(
        (attempt) =>
          attempt.pendingManual
      ).length;
  
  
    const completedAttempts =
      attempts.filter(
        (attempt) =>
          !attempt.pendingManual
      );
  
  
    const passedCount =
      completedAttempts.filter(
        (attempt) =>
          attempt.passed ===
          true
      ).length;
  
  
    const averageScore =
      completedAttempts.length >
      0
        ? Math.round(
            completedAttempts.reduce(
              (
                total,
                attempt
              ) =>
                total +
                attempt.percentage,
              0
            ) /
            completedAttempts.length
          )
        : 0;
  
  
    // =====================================
    // Review Helpers
    // =====================================
  
    const possiblePoints =
      (answer) => {
  
        return Number(
          answer.points ??
          answer.question
            ?.pivot
            ?.points ??
          answer.question
            ?.points ??
          0
        ) || 0;
      };
  
  
    const answerType =
      (answer) => {
  
        return (
          answer.type ||
          answer.question?.type ||
          "question"
        );
      };
  
  
    const questionText =
      (answer) => {
  
        return (
          answer.question_text ||
          answer.question
            ?.question_text ||
          t("finalUi.adminResults.question")
        );
      };
  
  
    const studentAnswerText =
      (answer) => {
  
        return (
          answer.student_answer
            ?.selected_option_text ||
          answer.selected_option
            ?.option_text ||
          answer.selectedOption
            ?.option_text ||
          answer.student_answer
            ?.answer_text ||
          answer.answer_text ||
          t("finalUi.adminResults.noAnswer")
        );
      };
  
  
    const isShortAnswer =
      (answer) =>
        answerType(answer) ===
        "short_answer";
  
  
    const buildGradeForm =
      (answers) => {
  
        const next = {};
  
  
        answers.forEach(
          (answer) => {
  
            if (
              !isShortAnswer(
                answer
              )
            ) {
              return;
            }
  
  
            next[answer.id] = {
              awarded_points:
                answer.awarded_points ??
                0,
  
              teacher_feedback:
                answer.teacher_feedback ||
                "",
            };
          }
        );
  
  
        return next;
      };
  
  
    // =====================================
    // Open Review
    // =====================================
  
    const openReview =
      async (attempt) => {
  
        try {
  
          setReviewOpen(true);
          setLoadingReview(true);
  
          setSelectedAttempt(
            attempt
          );
  
          setReviewAnswers([]);
  
          setGradeForm({});
  
          setPageError("");
          setMessage("");
  
  
          const response =
            await api.get(
              `/assessment-attempts/${attempt.id}`
            );
  
  
          const payload =
            response.data;
  
  
          const detail =
            normalizeAttempt(
              payload.attempt ||
              payload.result ||
              payload
            );
  
  
          const answers =
            payload.answers ||
            payload.review ||
            payload.attempt
              ?.answers ||
            payload.result
              ?.answers ||
            [];
  
  
          setSelectedAttempt(
            detail
          );
  
          setReviewAnswers(
            answers
          );
  
          setGradeForm(
            buildGradeForm(
              answers
            )
          );
  
        } catch (error) {
  
          setReviewOpen(false);
  
  
          setPageError(
            error.response?.data
              ?.message ||
            t("finalUi.adminResults.loadAttemptError")
          );
  
        } finally {
  
          setLoadingReview(false);
        }
      };
  
  
    const closeReview =
      () => {
  
        if (savingReview) {
          return;
        }
  
  
        setReviewOpen(false);
        setSelectedAttempt(null);
        setReviewAnswers([]);
        setGradeForm({});
      };
  
  
    // =====================================
    // Manual Grade Fields
    // =====================================
  
    const updateGradeField =
      (
        answerId,
        field,
        value
      ) => {
  
        setGradeForm(
          (current) => ({
            ...current,
  
            [answerId]: {
              ...current[
                answerId
              ],
  
              [field]:
                value,
            },
          })
        );
      };
  
  
    // =====================================
    // Save Manual Review
    // =====================================
  
    const saveReview =
      async () => {
  
        if (!selectedAttempt) {
          return;
        }
  
  
        const manualAnswers =
          reviewAnswers.filter(
            isShortAnswer
          );
  
  
        if (
          manualAnswers.length ===
          0
        ) {
  
          setMessage(
            t("finalUi.adminResults.noManual")
          );
  
          return;
        }
  
  
        for (
          const answer
          of manualAnswers
        ) {
  
          const value =
            Number(
              gradeForm[
                answer.id
              ]?.awarded_points
            );
  
  
          const max =
            possiblePoints(
              answer
            );
  
  
          if (
            Number.isNaN(value) ||
            value < 0 ||
            value > max
          ) {
  
            setPageError(
              t("finalUi.adminResults.pointsRange")
                .replace("{question}", questionText(answer))
                .replace("{max}", max)
            );
  
            return;
          }
        }
  
  
        try {
  
          setSavingReview(true);
          setPageError("");
          setMessage("");
  
  
          /*
           * Save sequentially so the backend
           * can recalculate the attempt after
           * each manually graded answer.
           */
          for (
            const answer
            of manualAnswers
          ) {
  
            const form =
              gradeForm[
                answer.id
              ] || {};
  
  
            await api.put(
              `/assessment-attempts/${selectedAttempt.id}/answers/${answer.id}/grade`,
              {
                awarded_points:
                  Number(
                    form
                      .awarded_points
                  ),
  
                teacher_feedback:
                  form
                    .teacher_feedback
                    ?.trim() ||
                  null,
              }
            );
          }
  
  
          setMessage(
            t("finalUi.adminResults.saved")
          );
  
  
          /*
           * Refresh list and current drawer,
           * because the server recalculates
           * score / percentage / pass status.
           */
          await fetchAttempts();
  
  
          const refreshed =
            await api.get(
              `/assessment-attempts/${selectedAttempt.id}`
            );
  
  
          const payload =
            refreshed.data;
  
  
          const detail =
            normalizeAttempt(
              payload.attempt ||
              payload.result ||
              payload
            );
  
  
          const answers =
            payload.answers ||
            payload.review ||
            payload.attempt
              ?.answers ||
            payload.result
              ?.answers ||
            [];
  
  
          setSelectedAttempt(
            detail
          );
  
          setReviewAnswers(
            answers
          );
  
          setGradeForm(
            buildGradeForm(
              answers
            )
          );
  
        } catch (error) {
  
          setPageError(
            error.response?.data
              ?.message ||
            t("finalUi.adminResults.saveError")
          );
  
        } finally {
  
          setSavingReview(false);
        }
      };
  
  
    // =====================================
    // Presentation Helpers
    // =====================================
  
    const statusInfo =
      (attempt) => {
  
        if (
          attempt.pendingManual
        ) {
          return {
            label:
              t("finalUi.adminResults.pendingReview"),
            className:
              "pending",
          };
        }
  
  
        if (
          attempt.passed ===
          true
        ) {
          return {
            label: t("finalUi.adminResults.passed"),
            className:
              "passed",
          };
        }
  
  
        if (
          attempt.passed ===
          false
        ) {
          return {
            label: t("finalUi.adminResults.failed"),
            className:
              "failed",
          };
        }
  
  
        return {
          label: t("finalUi.adminResults.completed"),
          className:
            "completed",
        };
      };
  
  
    const formatDateTime =
      (value) => {
  
        if (!value) {
          return "-";
        }
  
  
        const date =
          new Date(value);
  
  
        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return "-";
        }
  
  
        return date.toLocaleString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );
      };
  
  
    const formatType =
      (type) => {
  
        const labels = {
          mcq:
            t("finalUi.adminResults.multipleChoice"),
          true_false:
            t("finalUi.adminResults.trueFalse"),
          fill_blank:
            t("finalUi.adminResults.fillBlank"),
          short_answer:
            t("finalUi.adminResults.shortAnswer"),
        };
  
  
        return (
          labels[type] ||
          type ||
          t("finalUi.adminResults.question")
        );
      };
  
  
    if (loading) {
  
      return (
        <div className="premium-admin-loading">
  
          <span className="premium-spinner" />
  
          <p>
            {t("finalUi.adminResults.loading")}
          </p>
  
        </div>
      );
    }
  
  
    return (
      <div className="premium-admin-crud premium-results-page">
  
        {/* =================================
            Header
        ================================= */}
  
        <div className="premium-crud-heading">
  
          <div>
  
            <span>
              {t("finalUi.adminResults.eyebrow")}
            </span>
  
  
            <h1>
              {t("finalUi.adminResults.title")}
            </h1>
  
  
            <p>
              {t("finalUi.adminResults.description")}
            </p>
  
          </div>
  
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
            Stats
        ================================= */}
  
        <div className="premium-result-stats">
  
          <article>
  
            <div>
              <FileCheck2 size={20} />
            </div>
  
            <span>
              {t("finalUi.adminResults.totalAttempts")}
            </span>
  
            <strong>
              {attempts.length}
            </strong>
  
          </article>
  
  
          <article className="review">
  
            <div>
              <Clock3 size={20} />
            </div>
  
            <span>
              {t("finalUi.adminResults.pendingReview")}
            </span>
  
            <strong>
              {pendingCount}
            </strong>
  
          </article>
  
  
          <article className="passed">
  
            <div>
              <ShieldCheck size={20} />
            </div>
  
            <span>
              {t("finalUi.adminResults.passed")}
            </span>
  
            <strong>
              {passedCount}
            </strong>
  
          </article>
  
  
          <article>
  
            <div>
              <BarChart3 size={20} />
            </div>
  
            <span>
              {t("finalUi.adminResults.averageScore")}
            </span>
  
            <strong>
              {averageScore}%
            </strong>
  
          </article>
  
        </div>
  
  
        {/* =================================
            Toolbar
        ================================= */}
  
        <div className="premium-result-toolbar">
  
          <div className="premium-crud-search">
  
            <Search size={18} />
  
            <input
              type="search"
              placeholder={t("finalUi.adminResults.search")}
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
            />
  
          </div>
  
  
          <div className="premium-result-filters">
  
            {[
              ["all", t("finalUi.adminResults.all")],
              [
                "pending",
                t("finalUi.adminResults.pendingReview"),
              ],
              [
                "completed",
                t("finalUi.adminResults.completed"),
              ],
              ["passed", t("finalUi.adminResults.passed")],
              ["failed", t("finalUi.adminResults.failed")],
            ].map(
              ([
                value,
                label,
              ]) => (
  
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      value
                    )
                  }
                >
                  {label}
                </button>
  
              )
            )}
  
          </div>
  
  
          <span className="premium-result-count">
            {
              filteredAttempts
                .length
            }
            {" "}
            {t("finalUi.adminResults.results")}
          </span>
  
        </div>
  
  
        {/* =================================
            Results Table
        ================================= */}
  
        <div className="premium-crud-table-wrap premium-results-table-wrap">
  
          {filteredAttempts.length ===
          0 ? (
  
            <div className="premium-admin-empty">
  
              <FileCheck2 size={29} />
  
              <strong>
                {t("finalUi.adminResults.noResults")}
              </strong>
  
              <span>
                {t("finalUi.adminResults.noResultsDescription")}
              </span>
  
            </div>
  
          ) : (
  
            <table className="premium-crud-table premium-results-table">
  
              <thead>
  
                <tr>
                  <th>{t("finalUi.adminResults.student")}</th>
                  <th>{t("finalUi.adminResults.assessment")}</th>
                  <th>{t("finalUi.adminResults.course")}</th>
                  <th>{t("finalUi.adminResults.attempt")}</th>
                  <th>{t("finalUi.adminResults.score")}</th>
                  <th>{t("finalUi.adminResults.status")}</th>
                  <th>{t("finalUi.adminResults.submitted")}</th>
                  <th>{t("finalUi.adminResults.review")}</th>
                </tr>
  
              </thead>
  
  
              <tbody>
  
                {filteredAttempts.map(
                  (attempt) => {
  
                    const status =
                      statusInfo(
                        attempt
                      );
  
  
                    return (
                      <tr
                        key={
                          attempt.id
                        }
                      >
  
                        <td>
  
                          <div className="premium-student-cell">
  
                            <div className="premium-student-avatar">
                              {
                                attempt
                                  .studentName
                                  ?.charAt(0)
                                  ?.toUpperCase()
                                ||
                                "S"
                              }
                            </div>
  
  
                            <div>
  
                              <strong>
                                {
                                  attempt
                                    .studentName
                                }
                              </strong>
  
                              <span>
                                {
                                  attempt
                                    .studentEmail ||
                                  `Student #${attempt.student_id || "-"}`
                                }
                              </span>
  
                            </div>
  
                          </div>
  
                        </td>
  
  
                        <td>
  
                          <div className="premium-result-assessment">
  
                            <Award size={16} />
  
                            <strong>
                              {
                                attempt
                                  .assessmentTitle
                              }
                            </strong>
  
                          </div>
  
                        </td>
  
  
                        <td>
  
                          <div className="premium-result-course">
  
                            <BookOpen size={15} />
  
                            <span>
                              {
                                attempt
                                  .courseTitle
                              }
                            </span>
  
                          </div>
  
                        </td>
  
  
                        <td>
  
                          <span className="premium-attempt-number">
                            #{
                              attempt
                                .attempt_number ||
                              1
                            }
                          </span>
  
                        </td>
  
  
                        <td>
  
                          <div className="premium-result-score">
  
                            <strong>
                              {
                                attempt
                                  .percentage
                                  .toFixed(0)
                              }%
                            </strong>
  
                            <span>
                              {
                                attempt.score
                              }
                              {" / "}
                              {
                                attempt
                                  .maxScore
                              }
                            </span>
  
                          </div>
  
                        </td>
  
  
                        <td>
  
                          <span
                            className={`premium-result-status ${status.className}`}
                          >
                            {
                              status.label
                            }
                          </span>
  
                        </td>
  
  
                        <td>
  
                          <span className="premium-date-cell">
                            {
                              formatDateTime(
                                attempt
                                  .submitted_at
                              )
                            }
                          </span>
  
                        </td>
  
  
                        <td>
  
                          <button
                            type="button"
                            className={
                              attempt
                                .pendingManual
                                ? "premium-review-btn urgent"
                                : "premium-review-btn"
                            }
                            onClick={() =>
                              openReview(
                                attempt
                              )
                            }
                          >
                            <FileCheck2 size={15} />
  
                            {
                              attempt
                                .pendingManual
                                ? t("finalUi.adminResults.grade")
                                : t("finalUi.adminResults.review")
                            }
                          </button>
  
                        </td>
  
                      </tr>
                    );
                  }
                )}
  
              </tbody>
  
            </table>
  
          )}
  
        </div>
  
  
        {/* =================================
            Mobile Results
        ================================= */}
  
        <div className="premium-results-mobile">
  
          {filteredAttempts.map(
            (attempt) => {
  
              const status =
                statusInfo(
                  attempt
                );
  
  
              return (
                <article
                  key={
                    `mobile-${attempt.id}`
                  }
                  className="premium-result-mobile-card"
                >
  
                  <div className="premium-result-mobile-head">
  
                    <div className="premium-student-cell">
  
                      <div className="premium-student-avatar">
                        {
                          attempt
                            .studentName
                            ?.charAt(0)
                            ?.toUpperCase()
                          ||
                          "S"
                        }
                      </div>
  
  
                      <div>
  
                        <strong>
                          {
                            attempt
                              .studentName
                          }
                        </strong>
  
                        <span>
                          {
                            attempt
                              .assessmentTitle
                          }
                        </span>
  
                      </div>
  
                    </div>
  
  
                    <span
                      className={`premium-result-status ${status.className}`}
                    >
                      {
                        status.label
                      }
                    </span>
  
                  </div>
  
  
                  <div className="premium-result-mobile-course">
  
                    <BookOpen size={14} />
  
                    {
                      attempt
                        .courseTitle
                    }
  
                  </div>
  
  
                  <div className="premium-result-mobile-meta">
  
                    <div>
                      <span>{t("finalUi.adminResults.attempt")}</span>
                      <strong>
                        #{
                          attempt
                            .attempt_number ||
                          1
                        }
                      </strong>
                    </div>
  
  
                    <div>
                      <span>{t("finalUi.adminResults.score")}</span>
                      <strong>
                        {
                          attempt
                            .percentage
                            .toFixed(0)
                        }%
                      </strong>
                    </div>
  
  
                    <div>
                      <span>{t("finalUi.adminResults.points")}</span>
                      <strong>
                        {
                          attempt.score
                        }
                        /
                        {
                          attempt
                            .maxScore
                        }
                      </strong>
                    </div>
  
                  </div>
  
  
                  <button
                    type="button"
                    className={
                      attempt
                        .pendingManual
                        ? "premium-review-btn urgent"
                        : "premium-review-btn"
                    }
                    onClick={() =>
                      openReview(
                        attempt
                      )
                    }
                  >
                    <FileCheck2 size={15} />
  
                    {
                      attempt
                        .pendingManual
                        ? t("finalUi.adminResults.gradeAttempt")
                        : t("finalUi.adminResults.reviewAttempt")
                    }
                  </button>
  
                </article>
              );
            }
          )}
  
        </div>
  
  
        {/* =================================
            Review Drawer
        ================================= */}
  
        {reviewOpen && (
  
          <>
  
            <button
              type="button"
              className="premium-drawer-backdrop"
              onClick={closeReview}
              aria-label={t("finalUi.adminResults.close")}
            />
  
  
            <aside className="premium-edit-drawer premium-result-drawer">
  
              <div className="premium-drawer-head">
  
                <div>
  
                  <span>
                    {t("finalUi.adminResults.attemptReview")}
                  </span>
  
  
                  <h2>
                    {
                      selectedAttempt
                        ?.assessmentTitle ||
                      t("finalUi.adminResults.assessment")
                    }
                  </h2>
  
                </div>
  
  
                <button
                  type="button"
                  onClick={
                    closeReview
                  }
                  aria-label={t("finalUi.adminResults.close")}
                >
                  <X size={19} />
                </button>
  
              </div>
  
  
              {loadingReview ? (
  
                <div className="premium-result-drawer-loading">
  
                  <span className="premium-spinner" />
  
                  <p>
                    {t("finalUi.adminResults.loadingAttempt")}
                  </p>
  
                </div>
  
              ) : selectedAttempt ? (
  
                <>
  
                  <div className="premium-result-student-summary">
  
                    <div className="premium-drawer-avatar">
                      <UserRound size={23} />
                    </div>
  
  
                    <div>
  
                      <strong>
                        {
                          selectedAttempt
                            .studentName
                        }
                      </strong>
  
                      <span>
                        {
                          selectedAttempt
                            .courseTitle
                        }
                      </span>
  
                    </div>
  
  
                    <div className="premium-result-drawer-score">
  
                      <strong>
                        {
                          selectedAttempt
                            .percentage
                            .toFixed(0)
                        }%
                      </strong>
  
                      <span>
                        {
                          selectedAttempt
                            .score
                        }
                        {" / "}
                        {
                          selectedAttempt
                            .maxScore
                        }
                      </span>
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-result-review-summary">
  
                    <div>
  
                      <span>
                        {t("finalUi.adminResults.attempt")}
                      </span>
  
                      <strong>
                        #{
                          selectedAttempt
                            .attempt_number ||
                          1
                        }
                      </strong>
  
                    </div>
  
  
                    <div>
  
                      <span>
                        {t("finalUi.adminResults.submitted")}
                      </span>
  
                      <strong>
                        {
                          formatDateTime(
                            selectedAttempt
                              .submitted_at
                          )
                        }
                      </strong>
  
                    </div>
  
                  </div>
  
  
                  <div className="premium-result-question-list">
  
                    {reviewAnswers.length ===
                    0 ? (
  
                      <div className="premium-admin-empty">
  
                        <FileCheck2 size={25} />
  
                        <strong>
                          {t("finalUi.adminResults.noAnswerDetails")}
                        </strong>
  
                      </div>
  
                    ) : (
  
                      reviewAnswers.map(
                        (
                          answer,
                          index
                        ) => {
  
                          const manual =
                            isShortAnswer(
                              answer
                            );
  
  
                          const maxPoints =
                            possiblePoints(
                              answer
                            );
  
  
                          const awarded =
                            Number(
                              answer
                                .awarded_points
                            ) || 0;
  
  
                          const autoCorrect =
                            answer.is_correct ===
                            true;
  
  
                          return (
                            <article
                              key={
                                answer.id ||
                                answer.question_id ||
                                index
                              }
                              className={
                                manual
                                  ? "premium-result-question manual"
                                  : autoCorrect
                                    ? "premium-result-question correct"
                                    : "premium-result-question incorrect"
                              }
                            >
  
                              <div className="premium-result-question-head">
  
                                <span className="premium-result-question-number">
                                  {index + 1}
                                </span>
  
  
                                <div>
  
                                  <span>
                                    {
                                      formatType(
                                        answerType(
                                          answer
                                        )
                                      )
                                    }
                                  </span>
  
                                  <h3>
                                    {
                                      questionText(
                                        answer
                                      )
                                    }
                                  </h3>
  
                                </div>
  
  
                                <span className="premium-result-question-points">
                                  {
                                    manual
                                      ? `${gradeForm[answer.id]?.awarded_points ?? awarded} / ${maxPoints}`
                                      : `${awarded} / ${maxPoints}`
                                  }
                                </span>
  
                              </div>
  
  
                              <div className="premium-result-answer-box">
  
                                <span>
                                  {t("finalUi.adminResults.studentAnswer")}
                                </span>
  
                                <strong>
                                  {
                                    studentAnswerText(
                                      answer
                                    )
                                  }
                                </strong>
  
                              </div>
  
  
                              {!manual && (
  
                                <div
                                  className={
                                    autoCorrect
                                      ? "premium-auto-grade correct"
                                      : "premium-auto-grade incorrect"
                                  }
                                >
  
                                  {
                                    autoCorrect
                                      ? (
                                        <CheckCircle2 size={16} />
                                      )
                                      : (
                                        <XCircle size={16} />
                                      )
                                  }
  
  
                                  <span>
                                    {t("finalUi.adminResults.autoGraded")}
                                  </span>
  
  
                                  <strong>
                                    {
                                      awarded
                                    }
                                    {" / "}
                                    {
                                      maxPoints
                                    }
                                  </strong>
  
                                </div>
  
                              )}
  
  
                              {manual && (
  
                                <div className="premium-manual-grade-box">
  
                                  <div className="premium-manual-grade-title">
  
                                    <Award size={16} />
  
                                    <div>
  
                                      <strong>
                                        {t("finalUi.adminResults.teacherGrading")}
                                      </strong>
  
                                      <span>
                                        {t("finalUi.adminResults.teacherGradingDescription")}
                                      </span>
  
                                    </div>
  
                                  </div>
  
  
                                  <div className="premium-manual-grade-row">
  
                                    <label>
  
                                      <span>
                                        {t("finalUi.adminResults.points")}
                                      </span>
  
  
                                      <div className="premium-points-input">
  
                                        <input
                                          type="number"
                                          min="0"
                                          max={
                                            maxPoints
                                          }
                                          step="0.25"
                                          value={
                                            gradeForm[
                                              answer.id
                                            ]?.awarded_points ??
                                            0
                                          }
                                          onChange={
                                            (event) =>
                                              updateGradeField(
                                                answer.id,
                                                "awarded_points",
                                                event.target.value
                                              )
                                          }
                                        />
  
  
                                        <strong>
                                          / {maxPoints}
                                        </strong>
  
                                      </div>
  
                                    </label>
  
                                  </div>
  
  
                                  <label className="premium-feedback-field">
  
                                    <span>
                                      {t("finalUi.adminResults.feedback")}
                                    </span>
  
  
                                    <textarea
                                      rows="3"
                                      value={
                                        gradeForm[
                                          answer.id
                                        ]?.teacher_feedback ||
                                        ""
                                      }
                                      onChange={
                                        (event) =>
                                          updateGradeField(
                                            answer.id,
                                            "teacher_feedback",
                                            event.target.value
                                          )
                                      }
                                      placeholder={t("finalUi.adminResults.feedbackPlaceholder")}
                                    />
  
                                  </label>
  
                                </div>
  
                              )}
  
                            </article>
                          );
                        }
                      )
  
                    )}
  
                  </div>
  
  
                  {reviewAnswers.some(
                    isShortAnswer
                  ) && (
  
                    <div className="premium-result-drawer-actions">
  
                      <button
                        type="button"
                        className="premium-cancel-btn"
                        onClick={
                          closeReview
                        }
                      >
                        {t("finalUi.adminResults.close")}
                      </button>
  
  
                      <button
                        type="button"
                        className="premium-save-btn"
                        onClick={
                          saveReview
                        }
                        disabled={
                          savingReview
                        }
                      >
                        {
                          savingReview
                            ? t("finalUi.adminResults.savingGrades")
                            : t("finalUi.adminResults.saveManual")
                        }
                      </button>
  
                    </div>
  
                  )}
  
                </>
  
              ) : null}
  
            </aside>
  
          </>
  
        )}
  
      </div>
    );
  }
  
  
  export default AssessmentResults;
  