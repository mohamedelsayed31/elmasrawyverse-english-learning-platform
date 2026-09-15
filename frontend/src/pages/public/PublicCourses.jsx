import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function PublicCourses() {
  const [
    searchParams,
  ] = useSearchParams();


  const selectedGradeId =
    searchParams.get(
      "grade_id"
    );

  const selectedGrade =
    searchParams.get(
      "grade"
    );

  const selectedStage =
    searchParams.get(
      "stage"
    );


  const {
    t,
    tr,
  } = useLanguage();


  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const fetchCategories =
    async () => {

      try {

        const response =
          await api.get(
            "/public/courses"
          );


        const uniqueCategories = [
          ...new Set(
            (
              response.data.courses ||
              []
            )
              .map(
                (course) =>
                  course.category
              )
              .filter(Boolean)
          ),
        ];


        setCategories(
          uniqueCategories
        );

      } catch (error) {

        console.error(error);
      }
    };


  const fetchCourses =
    async () => {

      try {

        setLoading(true);
        setError("");


        const params = {};


        if (selectedGradeId) {

          params.grade_id =
            selectedGradeId;
        }


        if (search.trim()) {

          params.search =
            search.trim();
        }


        if (category) {

          params.category =
            category;
        }


        const response =
          await api.get(
            "/public/courses",
            {
              params,
            }
          );


        setCourses(
          response.data.courses ||
          []
        );

      } catch (error) {

        setError(
          error.response?.data
            ?.message ||
          t(
            "coursesPage.noCourses"
          )
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchCategories();
  }, []);


  useEffect(() => {

    const timer =
      setTimeout(
        fetchCourses,
        300
      );


    return () =>
      clearTimeout(timer);

  }, [
    search,
    category,
    selectedGradeId,
  ]);


  const handleReset = () => {
    setSearch("");
    setCategory("");
  };


  return (
    <div className="public-page">

      {/* Header */}

      <section className="page-banner">

        <div className="page-banner-inner">

          <span className="public-kicker">{tr("Course Library")}</span>


          <h1>
            {t(
              "coursesPage.heading"
            )}
          </h1>


          <p>
            {t(
              "coursesPage.description"
            )}
          </p>


          {selectedGradeId && (

            <div className="selected-grade-badge">

              <span>
                {selectedStage}
              </span>

              <strong>
                {selectedGrade}
              </strong>

            </div>

          )}

        </div>

      </section>


      <section className="public-section">

        {/* Filters */}

        <div className="course-filters">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder={
                t(
                  "coursesPage.searchPlaceholder"
                )
              }
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <div className="category-filter">

            <SlidersHorizontal
              size={16}
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >

              <option value="">
                {t(
                  "coursesPage.allCategories"
                )}
              </option>


              {categories.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                )
              )}

            </select>

          </div>


          {(search || category) && (

            <button
              type="button"
              className="filter-reset"
              onClick={handleReset}
            >
              <X size={15} />
              {t(
                "common.reset"
              )}
            </button>

          )}

        </div>


        {/* Result Header */}

        <div className="courses-result-header">

          <div>

            <span className="public-kicker">{tr("Available now")}</span>


            <h2>
              {t(
                "coursesPage.availableCourses"
              )}
            </h2>

          </div>


          <span className="courses-count">

            {courses.length}{" "}

            {courses.length === 1
              ? t(
                  "coursesPage.course"
                )
              : t(
                  "coursesPage.courses"
                )
            }

          </span>

        </div>


        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        {loading ? (

          <div className="public-loader">
            <span />
            {t(
              "common.loading"
            )}
          </div>

        ) : courses.length === 0 ? (

          <div className="public-empty">

            <BookOpen size={32} />


            <h3>
              {t(
                "coursesPage.noCourses"
              )}
            </h3>


            <p>
              {t(
                "coursesPage.noCoursesDescription"
              )}
            </p>

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
                          ).toFixed(
                            2
                          )} EGP`
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
                      "home.viewDetails"
                    )}

                    <ArrowRight size={16} />
                  </Link>

                </article>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}


export default PublicCourses;
