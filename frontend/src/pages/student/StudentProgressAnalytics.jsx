import {
    useEffect,
    useState,
  } from "react";
  
  import {
    Activity,
    AlertTriangle,
    BarChart3,
    BookOpenCheck,
    CheckCircle2,
    Target,
    TrendingUp,
  } from "lucide-react";
  
  import api
    from "../../services/api";

  import {
    useLanguage,
  } from "../../context/LanguageContext";
  
  
  const clampPercent =
    (value) =>
      Math.min(
        100,
        Math.max(
          0,
          Number(value) || 0
        )
      );
  
  
  function StudentProgressAnalytics({
    studentId = null,
    adminMode = false,
  }) {
    const { t } =
      useLanguage();

    const [
      data,
      setData,
    ] = useState(null);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState("");
  
  
    useEffect(() => {
  
      let mounted =
        true;
  
  
      const fetchAnalytics =
        async () => {
  
          try {
  
            setLoading(true);
            setError("");
  
  
            const endpoint =
              studentId
                ? `/admin/students/${studentId}/analytics`
                : "/my/analytics";
  
  
            const response =
              await api.get(
                endpoint
              );
  
  
            if (mounted) {
              setData(
                response.data
              );
            }
  
          } catch (error) {
  
            if (mounted) {
  
              setError(
                error.response?.data
                  ?.message ||
                t("finalUi.studentCore.loadProgressError")
              );
            }
  
          } finally {
  
            if (mounted) {
              setLoading(false);
            }
          }
        };
  
  
      fetchAnalytics();
  
  
      return () => {
        mounted = false;
      };
  
    }, [studentId, t]);
  
  
    if (loading) {
  
      return (
        <div className="student-dashboard-loading">
  
          <span className="ev-loading-orbit" />
  
          <p>
            {t("finalUi.studentCore.loadingProgress")}
          </p>
  
        </div>
      );
    }
  
  
    if (
      error ||
      !data
    ) {
  
      return (
        <div className="error-message">
          {
            error ||
            t("finalUi.studentCore.loadProgressError")
          }
        </div>
      );
    }
  
  
    const summary =
      data.summary ||
      {};
  
    const studentName =
      data.student?.name ||
      "Student";
  
  
    return (
      <div className="premium-progress-page">
  
        <div className="premium-progress-header">
  
          <div>
  
            <span>
              {t("finalUi.studentCore.learningAnalytics")}
            </span>
  
            <h1>
              {
                adminMode
                  ? t("finalUi.studentCore.adminProgressTitle").replace("{name}", studentName)
                  : t("finalUi.studentCore.progressTitle")
              }
            </h1>
  
            <p>
              {
                adminMode
                  ? t("finalUi.studentCore.adminProgressDescription")
                  : t("finalUi.studentCore.progressDescription")
              }
            </p>
  
          </div>
  
        </div>
  
  
        <div className="premium-progress-summary">
  
          <article>
  
            <BookOpenCheck
              size={22}
            />
  
            <span>
              {t("finalUi.studentCore.courseProgress")}
            </span>
  
            <strong>
              {
                summary
                  .average_course_progress
                ?? 0
              }%
            </strong>
  
            <small>
              {
                summary
                  .completed_courses
                ?? 0
              } {t("finalUi.studentCore.completedCourses")}
            </small>
  
          </article>
  
  
          <article>
  
            <CheckCircle2
              size={22}
            />
  
            <span>
              {t("finalUi.studentCore.lessons")}
            </span>
  
            <strong>
              {
                summary
                  .lessons_completed
                ?? 0
              }
              /
              {
                summary
                  .lessons_total
                ?? 0
              }
            </strong>
  
            <small>
              {t("finalUi.studentCore.lessons")} completed
            </small>
  
          </article>
  
  
          <article>
  
            <BarChart3
              size={22}
            />
  
            <span>
              {t("finalUi.studentCore.assessmentAverage")}
            </span>
  
            <strong>
              {
                summary
                  .average_assessment_score
                ?? 0
              }%
            </strong>
  
            <small>
              {
                summary
                  .assessments_taken
                ?? 0
              } {t("finalUi.studentCore.attempts")}
            </small>
  
          </article>
  
  
          <article>
  
            <Target
              size={22}
            />
  
            <span>
              {t("finalUi.studentCore.passRate")}
            </span>
  
            <strong>
              {
                summary.pass_rate
                ?? 0
              }%
            </strong>
  
            <small>
              {t("finalUi.studentCore.gradedAssessments")}
            </small>
  
          </article>
  
        </div>
  
  
        <section className="premium-progress-card">
  
          <div className="premium-progress-card-head">
  
            <div>
  
              <span>
                {t("finalUi.studentCore.coursesLabel")}
              </span>
  
              <h2>
                {t("finalUi.studentCore.courseProgress")}
              </h2>
  
              <p>
                {
                  adminMode
                    ? "Progress across the student's enrolled courses."
                    : t("finalUi.studentCore.yourProgressCourses")
                }
              </p>
  
            </div>
  
  
            <TrendingUp
              size={22}
            />
  
          </div>
  
  
          {!data.courses?.length ? (
  
            <div className="premium-progress-empty">
              {t("finalUi.studentCore.noEnrolledYet")}
            </div>
  
          ) : (
  
            <div className="premium-course-progress-list">
  
              {data.courses.map(
                (course) => {
  
                  const progress =
                    clampPercent(
                      course.progress
                    );
  
  
                  return (
                    <article
                      key={
                        course.course_id
                      }
                    >
  
                      <div className="premium-course-progress-head">
  
                        <div>
  
                          <h3>
                            {
                              course
                                .course_title
                            }
                          </h3>
  
                          <span>
                            {
                              [
                                course.stage,
                                course.grade,
                              ]
                                .filter(Boolean)
                                .join(" • ")
                            }
                          </span>
  
                        </div>
  
  
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
  
  
                      <div className="premium-course-progress-meta">
  
                        <span>
                          {t("finalUi.studentCore.lessons")}{" "}
                          <strong>
                            {
                              course.lessons
                                ?.completed
                              ?? 0
                            }
                            /
                            {
                              course.lessons
                                ?.total
                              ?? 0
                            }
                          </strong>
                        </span>
  
  
                        <span>
                          {t("finalUi.studentCore.requiredExams")}{" "}
                          <strong>
                            {
                              course
                                .required_assessments
                                ?.passed
                              ?? 0
                            }
                            /
                            {
                              course
                                .required_assessments
                                ?.total
                              ?? 0
                            }
                          </strong>
                        </span>
  
  
                        <span>
                          {t("finalUi.studentCore.averageScore")}{" "}
                          <strong>
                            {
                              course
                                .assessment_average
                              ?? "-"
                            }
                            {
                              course
                                .assessment_average !==
                                null &&
                              course
                                .assessment_average !==
                                undefined
                                ? "%"
                                : ""
                            }
                          </strong>
                        </span>
  
                      </div>
  
                    </article>
                  );
                }
              )}
  
            </div>
  
          )}
  
        </section>
  
  
        <div className="premium-progress-two-column">
  
          <section className="premium-progress-card">
  
            <div className="premium-progress-card-head">
  
              <div>
                <span>
                  {t("finalUi.studentCore.skills")}
                </span>
                <h2>
                  {t("finalUi.studentCore.areasImprove")}
                </h2>
                <p>
                  {t("finalUi.studentCore.skillAccuracy")}
                </p>
              </div>
  
              <AlertTriangle
                size={22}
              />
  
            </div>
  
  
            {!data.weak_skills?.length ? (
  
              <div className="premium-progress-empty">
                {t("finalUi.studentCore.noSkillData")}
              </div>
  
            ) : (
  
              <div className="premium-skill-list">
  
                {data.weak_skills.map(
                  (skill) => {
  
                    const accuracy =
                      clampPercent(
                        skill.accuracy
                      );
  
  
                    return (
                      <article
                        key={
                          skill.skill
                        }
                      >
  
                        <div>
                          <strong>
                            {skill.skill}
                          </strong>
  
                          <span>
                            {accuracy}%
                          </span>
                        </div>
  
  
                        <div className="premium-progress-track">
  
                          <span
                            style={{
                              width:
                                `${accuracy}%`,
                            }}
                          />
  
                        </div>
  
  
                        <small>
                          {
                            skill.correct
                            ?? 0
                          } {t("finalUi.studentCore.correctFrom")}{" "}
                          {
                            skill.total
                            ?? 0
                          }
                        </small>
  
                      </article>
                    );
                  }
                )}
  
              </div>
  
            )}
  
          </section>
  
  
          <section className="premium-progress-card">
  
            <div className="premium-progress-card-head">
  
              <div>
                <span>
                  {t("finalUi.studentCore.timeline")}
                </span>
                <h2>
                  {t("finalUi.studentCore.recentActivity")}
                </h2>
                <p>
                  {t("finalUi.studentCore.recentDescription")}
                </p>
              </div>
  
              <Activity
                size={22}
              />
  
            </div>
  
  
            {!data
              .recent_activity
              ?.length ? (
  
              <div className="premium-progress-empty">
                {t("finalUi.studentCore.noRecentActivity")}
              </div>
  
            ) : (
  
              <div className="premium-activity-list">
  
                {data
                  .recent_activity
                  .map(
                    (
                      activity,
                      index
                    ) => (
  
                      <article
                        key={
                          `${activity.type}-${index}`
                        }
                      >
  
                        <div
                          className={
                            `premium-activity-icon ${activity.type}`
                          }
                        >
                          {
                            activity.type ===
                            "assessment"
                              ? (
                                <BarChart3
                                  size={17}
                                />
                              )
                              : (
                                <BookOpenCheck
                                  size={17}
                                />
                              )
                          }
                        </div>
  
  
                        <div>
  
                          <strong>
                            {
                              activity.title
                              || "-"
                            }
                          </strong>
  
                          <span>
                            {
                              activity.course
                              || "-"
                            }
                          </span>
  
                        </div>
  
  
                        <strong className="premium-activity-result">
                          {
                            activity.type ===
                              "assessment" &&
                            activity.percentage !==
                              null &&
                            activity.percentage !==
                              undefined
                              ? `${activity.percentage}%`
                              : activity.status
                          }
                        </strong>
  
                      </article>
  
                    )
                  )}
  
              </div>
  
            )}
  
          </section>
  
        </div>
  
  
        <section className="premium-progress-card">
  
          <div className="premium-progress-card-head">
  
            <div>
              <span>
                {t("finalUi.studentCore.performance")}
              </span>
              <h2>
                {t("finalUi.studentCore.assessmentPerformance")}
              </h2>
              <p>
                {t("finalUi.studentCore.latestResults")}
              </p>
            </div>
  
            <BarChart3
              size={22}
            />
  
          </div>
  
  
          {!data
            .performance_trend
            ?.length ? (
  
            <div className="premium-progress-empty">
              {t("finalUi.studentCore.noResultsYet")}
            </div>
  
          ) : (
  
            <div className="premium-performance-list">
  
              {data
                .performance_trend
                .map(
                  (item) => {
  
                    const score =
                      clampPercent(
                        item.percentage
                      );
  
  
                    return (
                      <article
                        key={
                          item.attempt_id
                        }
                      >
  
                        <div>
  
                          <strong>
                            {
                              item.assessment
                              || "-"
                            }
                          </strong>
  
                          <span>
                            {
                              item.course
                              || "-"
                            }
                          </span>
  
                        </div>
  
  
                        <div className="premium-progress-track">
  
                          <span
                            style={{
                              width:
                                `${score}%`,
                            }}
                          />
  
                        </div>
  
  
                        <strong>
                          {score}%
                        </strong>
  
                      </article>
                    );
                  }
                )}
  
            </div>
  
          )}
  
        </section>
  
      </div>
    );
  }
  
  
  export default StudentProgressAnalytics;
  