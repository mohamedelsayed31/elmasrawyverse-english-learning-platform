import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Play,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useLanguage,
} from "../../context/LanguageContext";


function StudentDashboard() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const { t } =
    useLanguage();


  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    continueLearning,
    setContinueLearning,
  ] = useState(null);

  const [
    analytics,
    setAnalytics,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const studentName =
    user?.student?.name ||
    user?.name ||
    "Student";


  useEffect(() => {

    const load =
      async () => {

        try {

          setError("");


          const results =
            await Promise.allSettled([
              api.get(
                "/my/courses"
              ),

              api.get(
                "/my/continue-learning"
              ),

              api.get(
                "/my/analytics"
              ),
            ]);


          const [
            coursesResult,
            continueResult,
            analyticsResult,
          ] = results;


          if (
            coursesResult.status ===
            "fulfilled"
          ) {

            const payload =
              coursesResult
                .value
                .data;


            setCourses(
              payload.courses ||
              payload.enrollments ||
              []
            );
          }


          if (
            continueResult.status ===
            "fulfilled"
          ) {

            const payload =
              continueResult
                .value
                .data;


            setContinueLearning(
              payload.continue_learning ||
              payload.item ||
              payload.data ||
              null
            );
          }


          if (
            analyticsResult.status ===
            "fulfilled"
          ) {

            setAnalytics(
              analyticsResult
                .value
                .data
            );
          }


          if (
            results.every(
              (result) =>
                result.status ===
                "rejected"
            )
          ) {

            throw new Error(
              t("student.failedDashboard")
            );
          }

        } catch (error) {

          setError(
            error.response?.data
              ?.message ||
            error.message ||
            t("student.failedDashboard")
          );

        } finally {

          setLoading(false);
        }
      };


    load();

  }, [t]);


  const normalizedCourses =
    useMemo(
      () =>
        courses.map(
          (item) => {

            const course =
              item.course ||
              item;


            return {
              id:
                course.id ||
                item.course_id,

              title:
                course.title ||
                t("finalUi.studentCore.course"),

              instructor:
                course.instructor
                  ?.name ||
                "-",

              stage:
                course.grade
                  ?.academic_stage
                  ?.name ||
                "",

              grade:
                course.grade
                  ?.name ||
                "",

              progress:
                Number(
                  item.pivot?.progress ??
                  course.pivot?.progress ??
                  item.progress ??
                  course.progress ??
                  0
                ),

              status:
                item.pivot?.status ||
                course.pivot?.status ||
                item.status ||
                course.status ||
                "Enrolled",
            };
          }
        ),
      [courses]
    );


  const averageProgress =
    normalizedCourses.length
      ? Math.round(
          normalizedCourses.reduce(
            (
              total,
              course
            ) =>
              total +
              (
                Number(
                  course.progress
                ) || 0
              ),
            0
          )
          /
          normalizedCourses.length
        )
      : 0;


  const summary =
    analytics?.summary ||
    {};


  const continueCourseId =
    continueLearning
      ?.course_id ||
    continueLearning
      ?.course?.id;


  const continueItemId =
    continueLearning
      ?.section_item_id ||
    continueLearning
      ?.item_id ||
    continueLearning
      ?.item?.id;


  const continueTitle =
    continueLearning
      ?.item_title ||
    continueLearning
      ?.title ||
    continueLearning
      ?.item?.title ||
    t("finalUi.studentCore.continueLearning");


  const continueCourseTitle =
    continueLearning
      ?.course_title ||
    continueLearning
      ?.course?.title ||
    t("finalUi.studentCore.yourCourse");


  const openContinue =
    () => {

      if (!continueCourseId) {

        navigate(
          "/my-courses"
        );

        return;
      }


      const query =
        continueItemId
          ? `?item_id=${continueItemId}`
          : "";


      navigate(
        `/my-courses/${continueCourseId}${query}`
      );
    };


  if (loading) {

    return (
      <div className="premium-student-loading">

        <span className="premium-spinner" />

        <p>
          {t("finalUi.studentCore.preparing")}
        </p>

      </div>
    );
  }


  return (
    <div className="premium-student-dashboard">

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="student-dashboard-heading">

        <div>

          <span>
            {t("finalUi.studentCore.myLearning")}
          </span>

          <h1>
            {t("finalUi.studentCore.welcomeName").replace("{name}", studentName)}
          </h1>

          <p>
            {t("finalUi.studentCore.dashboardKeepMoving")}
          </p>

        </div>

      </div>


      <section
        className="student-focus-card"
        onClick={openContinue}
      >

        <div className="student-focus-icon">
          <Play size={21} fill="currentColor" />
        </div>


        <div className="student-focus-copy">

          <span>
            {t("finalUi.studentCore.continueLearning")}
          </span>

          <h2>
            {
              continueLearning
                ? continueTitle
                : t("finalUi.studentCore.openCourses")
            }
          </h2>

          <p>
            {
              continueLearning
                ? continueCourseTitle
                : t("finalUi.studentCore.chooseCourse")
            }
          </p>

        </div>


        <button
          type="button"
          className="student-focus-action"
        >
          {t("finalUi.studentCore.continue")}
          <ArrowRight size={16} />
        </button>

      </section>


      <div className="student-dashboard-metrics">

        <article>

          <BookOpen size={18} />

          <div>
            <strong>
              {
                normalizedCourses
                  .length
              }
            </strong>

            <span>
              {t("finalUi.studentCore.courses")}
            </span>
          </div>

        </article>


        <article>

          <BarChart3 size={18} />

          <div>
            <strong>
              {
                summary
                  .average_course_progress
                ??
                averageProgress
              }%
            </strong>

            <span>
              {t("finalUi.studentCore.averageProgress")}
            </span>
          </div>

        </article>


        <article>

          <CheckCircle2 size={18} />

          <div>
            <strong>
              {
                summary
                  .lessons_completed
                ??
                0
              }
            </strong>

            <span>
              {t("finalUi.studentCore.lessonsCompleted")}
            </span>
          </div>

        </article>

      </div>


      <section className="student-dashboard-section">

        <div className="student-section-heading">

          <div>

            <span>
              {t("finalUi.studentCore.yourCourses")}
            </span>

            <h2>
              {t("finalUi.studentCore.keepLearning")}
            </h2>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/my-courses"
              )
            }
          >
            {t("finalUi.studentCore.viewAll")}
            <ArrowRight size={15} />
          </button>

        </div>


        {normalizedCourses.length ===
        0 ? (

          <div className="premium-student-empty">

            <BookOpen size={24} />

            <strong>
              {t("finalUi.studentCore.noEnrolledYet")}
            </strong>

            <span>
              {t("finalUi.studentCore.yourCourses")} will appear
              here after enrollment.
            </span>

          </div>

        ) : (

          <div className="dashboard-course-list">

            {normalizedCourses
              .slice(0, 3)
              .map(
                (course) => {

                  const progress =
                    Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          course.progress
                        ) || 0
                      )
                    );


                  return (
                    <button
                      type="button"
                      className="dashboard-course-row"
                      key={
                        course.id
                      }
                      onClick={() =>
                        navigate(
                          `/my-courses/${course.id}`
                        )
                      }
                    >

                      <div className="dashboard-course-icon">
                        <BookOpen size={18} />
                      </div>


                      <div className="dashboard-course-info">

                        <span>
                          {
                            course.stage
                          }

                          {
                            course.grade
                              ? ` • ${course.grade}`
                              : ""
                          }
                        </span>


                        <strong>
                          {
                            course.title
                          }
                        </strong>


                        <small>
                          {
                            course.instructor
                          }
                        </small>

                      </div>


                      <div className="dashboard-course-progress">

                        <strong>
                          {progress}%
                        </strong>


                        <div>
                          <span
                            style={{
                              width:
                                `${progress}%`,
                            }}
                          />
                        </div>

                      </div>


                      <ArrowRight
                        size={17}
                        className="dashboard-course-arrow"
                      />

                    </button>
                  );
                }
              )}

          </div>

        )}

      </section>

    </div>
  );
}


export default StudentDashboard;
