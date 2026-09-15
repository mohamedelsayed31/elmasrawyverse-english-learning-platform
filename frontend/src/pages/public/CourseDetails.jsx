import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  Users,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useLanguage,
} from "../../context/LanguageContext";


function CourseDetails() {
  const {
    id,
  } = useParams();

  const {
    user,
  } = useAuth();

  const {
    t,
    tr,
  } = useLanguage();


  const [
    course,
    setCourse,
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

    const fetchCourse =
      async () => {

        try {

          setLoading(true);
          setError("");


          const response =
            await api.get(
              `/public/courses/${id}`
            );


          setCourse(
            response.data.course
          );

        } catch (error) {

          setError(
            error.response?.data
              ?.message ||
            t(
              "courseDetails.notFound"
            )
          );

        } finally {

          setLoading(false);
        }
      };


    fetchCourse();

  }, [id]);


  if (loading) {

    return (
      <div className="public-loader public-page-loader">
        <span />
        {t(
          "common.loading"
        )}
      </div>
    );
  }


  if (
    error ||
    !course
  ) {

    return (
      <div className="public-section">

        <div className="public-empty">

          <BookOpen size={32} />


          <h2>
            {t(
              "courseDetails.notFound"
            )}
          </h2>


          <Link
            to="/courses"
            className="course-details-btn"
          >
            {t(
              "courseDetails.backToCourses"
            )}
          </Link>

        </div>

      </div>
    );
  }


  const gradeName =
    course.grade?.name;

  const stageName =
    course.grade
      ?.academic_stage
      ?.name;


  return (
    <div className="course-details-page">

      {/* Hero */}

      <section className="course-details-hero">

        <div className="course-details-hero-inner">

          <div className="course-details-copy">

            <Link
              to="/courses"
              className="back-link"
            >
              <ArrowLeft size={16} />

              {t(
                "courseDetails.backToCourses"
              )}
            </Link>


            <div className="course-detail-tags">

              <span className="course-category">
                {
                  course.category ||
                  "English"
                }
              </span>


              {stageName && (
                <span className="course-stage-tag">
                  {stageName}
                  {gradeName
                    ? ` • ${gradeName}`
                    : ""
                  }
                </span>
              )}

            </div>


            <h1>
              {course.title}
            </h1>


            <p>
              {t(
                "courseDetails.learnWith"
              )}{" "}

              <strong>
                {
                  course.instructor
                    ?.name ||
                  "-"
                }
              </strong>

              .{" "}

              {t(
                "courseDetails.courseDescription"
              )}
            </p>


            <div className="course-detail-highlights">

              <span>
                <BookOpen size={16} />
                {course.lessons} lessons
              </span>

              <span>
                <Users size={16} />
                {course.enrolled} students
              </span>

              <span>
                <CheckCircle2 size={16} />{tr("Structured learning")}</span>

            </div>

          </div>


          {/* Summary */}

          <aside className="course-summary-card">

            <div className="course-summary-price">

              <span>
                {t(
                  "courseDetails.price"
                )}
              </span>


              <strong>

                {Number(
                  course.price
                ) === 0
                  ? t(
                      "common.free"
                    )
                  : `${Number(
                      course.price
                    ).toFixed(
                      2
                    )} EGP`
                }

              </strong>

            </div>


            <div className="course-summary-list">

              <div>
                <BookOpen size={17} />

                <span>
                  {t(
                    "courseDetails.lessons"
                  )}
                </span>

                <strong>
                  {course.lessons}
                </strong>
              </div>


              <div>
                <Users size={17} />

                <span>
                  {t(
                    "courseDetails.students"
                  )}
                </span>

                <strong>
                  {course.enrolled}
                </strong>
              </div>


              <div>
                <Layers3 size={17} />

                <span>
                  {t(
                    "courseDetails.status"
                  )}
                </span>

                <strong>
                  {t(
                    `status.${course.status}`
                  )}
                </strong>
              </div>

            </div>


            {user ? (

              <Link
                to={
                  user.role ===
                  "admin"
                    ? "/admin/dashboard"
                    : "/my-courses"
                }
                className="hero-primary-btn course-action"
              >
                {t(
                  "courseDetails.goDashboard"
                )}

                <ArrowRight size={17} />
              </Link>

            ) : (

              <Link
                to="/register"
                className="hero-primary-btn course-action"
              >
                {t(
                  "courseDetails.createAccount"
                )}

                <ArrowRight size={17} />
              </Link>

            )}

          </aside>

        </div>

      </section>


      {/* Information */}

      <section className="public-section">

        <div className="course-information-grid">

          <div className="course-info-main">

            <span className="public-kicker">{tr("Course overview")}</span>


            <h2>
              {t(
                "courseDetails.courseInformation"
              )}
            </h2>


            <div className="course-info-list">

              <div>

                <span>
                  {t(
                    "courseDetails.course"
                  )}
                </span>

                <strong>
                  {course.title}
                </strong>

              </div>


              <div>

                <span>
                  {t(
                    "courseDetails.category"
                  )}
                </span>

                <strong>
                  {
                    course.category ||
                    "-"
                  }
                </strong>

              </div>


              <div>

                <span>
                  {t(
                    "courseDetails.instructor"
                  )}
                </span>

                <strong>
                  {
                    course.instructor
                      ?.name ||
                    "-"
                  }
                </strong>

              </div>


              <div>

                <span>
                  {t(
                    "courseDetails.specialization"
                  )}
                </span>

                <strong>
                  {
                    course.instructor
                      ?.specialization ||
                    "-"
                  }
                </strong>

              </div>

            </div>

          </div>


          <aside className="course-info-side">

            <div className="course-info-side-icon">
              <GraduationCap size={24} />
            </div>


            <h3>
              {t(
                "courseDetails.howWorks"
              )}
            </h3>


            <p>
              {t(
                "courseDetails.howWorksFirst"
              )}
            </p>


            <p>
              {t(
                "courseDetails.howWorksSecond"
              )}
            </p>

          </aside>

        </div>

      </section>

    </div>
  );
}


export default CourseDetails;
