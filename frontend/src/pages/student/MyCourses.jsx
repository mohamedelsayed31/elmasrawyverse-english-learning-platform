import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Search,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function MyCourses() {
  const navigate =
    useNavigate();

  const { t } =
    useLanguage();


  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    const load =
      async () => {

        try {

          setError("");


          const response =
            await api.get(
              "/my/courses"
            );


          setCourses(
            response.data.courses ||
            response.data.enrollments ||
            []
          );

        } catch (error) {

          setError(
            error.response?.data
              ?.message ||
            t("finalUi.studentCore.loadCoursesError")
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

              description:
                course.description ||
                "",

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


  const filteredCourses =
    normalizedCourses.filter(
      (course) => {

        const term =
          search
            .trim()
            .toLowerCase();


        if (!term) {
          return true;
        }


        return [
          course.title,
          course.stage,
          course.grade,
          course.instructor,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      }
    );


  if (loading) {

    return (
      <div className="premium-student-loading">

        <span className="premium-spinner" />

        <p>
          {t("finalUi.studentCore.loadingCourses")}
        </p>

      </div>
    );
  }


  return (
    <div className="premium-my-courses">

      <div className="premium-page-title">

        <div>

          <span>
            {t("finalUi.studentCore.learning")}
          </span>

          <h1>
            {t("student.myCourses")}
          </h1>

          <p>
            {t("finalUi.studentCore.myCoursesDescription")}
          </p>

        </div>


        <div className="premium-course-count">
          {filteredCourses.length}
          {" "}
          {
            filteredCourses.length ===
            1
              ? t("finalUi.studentCore.course")
              : t("finalUi.studentCore.courses")
          }
        </div>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="premium-course-toolbar">

        <div className="premium-course-search">

          <Search size={17} />

          <input
            type="search"
            placeholder={t("finalUi.studentCore.searchCourses")}
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

      </div>


      {filteredCourses.length ===
      0 ? (

        <div className="premium-student-empty">

          <BookOpen size={27} />

          <strong>
            {
              search
                ? t("finalUi.studentCore.noMatchingCourses")
                : t("finalUi.studentCore.noEnrolledCourses")
            }
          </strong>


          <span>
            {
              search
                ? t("finalUi.studentCore.tryDifferentSearch")
                : t("finalUi.studentCore.enrolledCoursesAppear")
            }
          </span>

        </div>

      ) : (

        <div className="premium-course-grid">

          {filteredCourses.map(
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


              const completed =
                course.status ===
                "Completed";


              return (
                <article
                  className="premium-course-card"
                  key={
                    course.id
                  }
                >

                  <div className="premium-course-card-head">

                    <div className="premium-course-symbol">
                      <BookOpen size={20} />
                    </div>


                    <span
                      className={
                        completed
                          ? "premium-course-state completed"
                          : "premium-course-state"
                      }
                    >

                      {completed && (
                        <CheckCircle2 size={12} />
                      )}

                      {
                        completed
                          ? t("finalUi.studentCore.completed")
                          : course.status
                      }

                    </span>

                  </div>


                  <div className="premium-course-context">

                    {
                      course.stage ||
                      t("finalUi.studentCore.english")
                    }

                    {
                      course.grade
                        ? ` • ${course.grade}`
                        : ""
                    }

                  </div>


                  <h2>
                    {course.title}
                  </h2>


                  <p className="premium-course-teacher">
                    {t("finalUi.studentCore.instructor")}{" "}
                    <strong>
                      {
                        course.instructor
                      }
                    </strong>
                  </p>


                  {course.description && (

                    <p className="premium-course-description">
                      {
                        course.description
                      }
                    </p>

                  )}


                  <div className="premium-course-progress-head">

                    <span>
                      {t("finalUi.studentCore.progress")}
                    </span>

                    <strong>
                      {progress}%
                    </strong>

                  </div>


                  <div className="premium-course-progress">

                    <span
                      style={{
                        width:
                          `${progress}%`,
                      }}
                    />

                  </div>


                  <button
                    type="button"
                    className="premium-course-open"
                    onClick={() =>
                      navigate(
                        `/my-courses/${course.id}`
                      )
                    }
                  >

                    {
                      progress > 0
                        ? t("finalUi.studentCore.continueCourse")
                        : t("finalUi.studentCore.startCourse")
                    }

                    <ArrowRight size={16} />

                  </button>

                </article>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}


export default MyCourses;
