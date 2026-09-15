import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";

import GradeSelector
  from "../../components/GradeSelector";


function Home() {
  const {
    t,
    isArabic,
    tr,
  } = useLanguage();


  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {

    const fetchCourses =
      async () => {

        try {

          const response =
            await api.get(
              "/public/courses"
            );


          setCourses(
            (
              response.data.courses ||
              []
            ).slice(0, 3)
          );

        } catch (error) {

          console.error(error);

        } finally {

          setLoading(false);
        }
      };


    fetchCourses();

  }, []);


  return (
    <div className="public-home">

      {/* Hero */}

      <section className="hero-section">

        <div className="hero-shell">

          <div className="hero-content">

            <span className="hero-badge">
              <Sparkles size={14} />
              {t("home.badge")}
            </span>


            <h1>{tr("Master English.")}<span>
                {" "}
                Build real confidence.
              </span>
            </h1>


            <p>
              {t(
                "home.heroDescription"
              )}
            </p>


            <div className="hero-actions">

              <Link
                to="/courses"
                className="hero-primary-btn"
              >
                {t(
                  "home.exploreCourses"
                )}

                <ArrowRight size={17} />
              </Link>


              <Link
                to="/register"
                className="hero-secondary-btn"
              >
                {t(
                  "home.createAccount"
                )}
              </Link>

            </div>


            <div className="hero-trust-row">

              <span>
                <CheckCircle2 size={15} />{tr("Organized lessons")}</span>

              <span>
                <CheckCircle2 size={15} />{tr("Progress tracking")}</span>

              <span>
                <CheckCircle2 size={15} />{tr("Assessments")}</span>

            </div>

          </div>


          <div className="hero-visual">

            <div className="hero-visual-header">

              <div className="hero-visual-logo">
                <GraduationCap size={27} />
              </div>


              <div>
                <span>{tr("Student Journey")}</span>

                <strong>{tr("Learn. Practice. Improve.")}</strong>
              </div>

            </div>


            <div className="hero-stat-grid">

              <div className="hero-stat">

                <BookOpen size={21} />

                <strong>
                  {t("home.learn")}
                </strong>

                <span>
                  {t(
                    "home.learnDescription"
                  )}
                </span>

              </div>


              <div className="hero-stat">

                <Target size={21} />

                <strong>
                  {t("home.practice")}
                </strong>

                <span>
                  {t(
                    "home.practiceDescription"
                  )}
                </span>

              </div>


              <div className="hero-stat">

                <BarChart3 size={21} />

                <strong>
                  {t("home.track")}
                </strong>

                <span>
                  {t(
                    "home.trackDescription"
                  )}
                </span>

              </div>

            </div>


            <div className="hero-visual-progress">

              <div>
                <span>{tr("Learning progress")}</span>

                <strong>
                  78%
                </strong>
              </div>


              <div className="hero-progress-track">
                <span />
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Grades */}

      <section className="home-grade-section">

        <div className="public-section-heading">

          <span className="public-kicker">{tr("Choose your level")}</span>

          <h2>{tr("Find the right course for your school grade.")}</h2>

          <p>{tr("Select your stage and grade, then explore the available English courses.")}</p>

        </div>


        <GradeSelector />

      </section>


      {/* Why */}

      <section className="public-section">

        <div className="section-heading">

          <span className="public-kicker">
            {t("home.why")}
          </span>


          <h2>
            {t(
              "home.everythingTitle"
            )}
          </h2>


          <p>
            {t(
              "home.everythingDescription"
            )}
          </p>

        </div>


        <div className="feature-grid">

          <article className="feature-card">

            <div className="feature-icon">
              <BookOpen size={22} />
            </div>


            <span className="feature-number">
              01
            </span>


            <h3>
              {t(
                "home.professionalCourses"
              )}
            </h3>


            <p>
              {t(
                "home.professionalCoursesDescription"
              )}
            </p>

          </article>


          <article className="feature-card">

            <div className="feature-icon">
              <Users size={22} />
            </div>


            <span className="feature-number">
              02
            </span>


            <h3>
              {t(
                "home.expertInstructors"
              )}
            </h3>


            <p>
              {t(
                "home.expertInstructorsDescription"
              )}
            </p>

          </article>


          <article className="feature-card">

            <div className="feature-icon">
              <BarChart3 size={22} />
            </div>


            <span className="feature-number">
              03
            </span>


            <h3>
              {t(
                "home.trackProgress"
              )}
            </h3>


            <p>
              {t(
                "home.trackProgressDescription"
              )}
            </p>

          </article>

        </div>

      </section>


      {/* Featured Courses */}

      <section className="public-section courses-section">

        <div className="section-heading section-heading-row">

          <div>

            <span className="public-kicker">
              {t(
                "home.startLearning"
              )}
            </span>


            <h2>
              {t(
                "home.featuredCourses"
              )}
            </h2>

          </div>


          <Link
            to="/courses"
            className="view-all-link"
          >
            {t(
              "home.viewAllCourses"
            )}

            <span>
              {isArabic ? "←" : "→"}
            </span>
          </Link>

        </div>


        {loading ? (

          <div className="public-loader">
            <span />
            {t("common.loading")}
          </div>

        ) : courses.length === 0 ? (

          <div className="public-empty">
            {t(
              "home.noPublishedCourses"
            )}
          </div>

        ) : (

          <div className="public-course-grid">

            {courses.map(
              (course) => (

                <article
                  className="public-course-card"
                  key={course.id}
                >

                  <div className="course-card-accent" />


                  <div className="course-card-top">

                    <span className="course-category">
                      {
                        course.category ||
                        "English"
                      }
                    </span>


                    <span className="course-price">

                      {Number(
                        course.price
                      ) === 0
                        ? t(
                            "common.free"
                          )
                        : `${Number(
                            course.price
                          ).toFixed(2)} EGP`
                      }

                    </span>

                  </div>


                  <div className="course-card-icon">
                    <BookOpen size={22} />
                  </div>


                  <h3>
                    {course.title}
                  </h3>


                  <p className="course-instructor">

                    {t(
                      "admin.instructor"
                    )}:{" "}

                    <strong>
                      {
                        course.instructor
                          ?.name ||
                        "-"
                      }
                    </strong>

                  </p>


                  <div className="course-meta">

                    <span>
                      <BookOpen size={14} />
                      {
                        course.lessons
                      }{" "}
                      {t(
                        "home.lessons"
                      )}
                    </span>


                    <span>
                      <Users size={14} />
                      {
                        course.enrolled
                      }{" "}
                      {t(
                        "home.students"
                      )}
                    </span>

                  </div>


                  <Link
                    to={
                      `/courses/${course.id}`
                    }
                    className="course-details-btn"
                  >
                    {t(
                      "home.viewCourse"
                    )}

                    <ArrowRight size={16} />
                  </Link>

                </article>

              )
            )}

          </div>

        )}

      </section>


      {/* CTA */}

      <section className="home-cta">

        <div>

          <span>
            {t(
              "home.readyToStart"
            )}
          </span>


          <h2>
            {t(
              "home.journeyTitle"
            )}
          </h2>


          <p>
            {t(
              "home.journeyDescription"
            )}
          </p>

        </div>


        <Link
          to="/register"
          className="cta-btn"
        >
          {t(
            "home.getStarted"
          )}

          <ArrowRight size={17} />
        </Link>

      </section>

    </div>
  );
}


export default Home;
