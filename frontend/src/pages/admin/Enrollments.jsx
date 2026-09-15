import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import api
  from "../../services/api";


import {
  useLanguage,
} from "../../context/LanguageContext";


function Enrollments() {
  const { tr } = useLanguage();

  const [
    enrollments,
    setEnrollments,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState({
    student_id: "",
    course_id: "",
  });

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
  // Load
  // =====================================

  const fetchData =
    async () => {

      try {

        setLoading(true);
        setPageError("");


        const [
          enrollmentsResponse,
          studentsResponse,
          coursesResponse,
        ] = await Promise.all([
          api.get(
            "/enrollments"
          ),

          api.get(
            "/students"
          ),

          api.get(
            "/courses"
          ),
        ]);


        setEnrollments(
          enrollmentsResponse
            .data
            .enrollments ||
          []
        );


        setStudents(
          studentsResponse
            .data
            .students ||
          []
        );


        setCourses(
          coursesResponse
            .data
            .courses ||
          []
        );

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to load enrollments."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchData();
  }, []);


  // =====================================
  // Derived Data
  // =====================================

  const activeStudents =
    useMemo(
      () =>
        students.filter(
          (student) =>
            student.status ===
              "Active" &&
            (
              student.user ||
              student.user_id
            )
        ),
      [students]
    );


  const normalizedEnrollments =
    useMemo(
      () =>
        enrollments.map(
          (item) => {

            const student =
              item.student ||
              {};

            const course =
              item.course ||
              {};


            return {
              ...item,

              student_name:
                student.name ||
                item.student_name ||
                "-",

              student_email:
                student.email ||
                student.user
                  ?.email ||
                item.student_email ||
                "-",

              course_title:
                course.title ||
                item.course_title ||
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
                Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      item.progress
                    ) || 0
                  )
                ),

              status:
                item.status ||
                "Enrolled",
            };
          }
        ),
      [enrollments]
    );


  const filteredEnrollments =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        return normalizedEnrollments.filter(
          (item) => {

            const matchesSearch =
              !term ||
              [
                item.student_name,
                item.student_email,
                item.course_title,
                item.stage,
                item.grade,
              ]
                .join(" ")
                .toLowerCase()
                .includes(term);


            const matchesStatus =
              statusFilter ===
                "all" ||
              item.status ===
                statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );
      },
      [
        normalizedEnrollments,
        search,
        statusFilter,
      ]
    );


  const completedCount =
    normalizedEnrollments.filter(
      (item) =>
        item.status ===
        "Completed"
    ).length;


  const activeEnrollmentCount =
    normalizedEnrollments.filter(
      (item) =>
        item.status ===
        "Enrolled"
    ).length;


  const selectedStudent =
    activeStudents.find(
      (student) =>
        Number(student.id) ===
        Number(
          formData.student_id
        )
    );


  const selectedCourse =
    courses.find(
      (course) =>
        Number(course.id) ===
        Number(
          formData.course_id
        )
    );


  const duplicatePair =
    formData.student_id &&
    formData.course_id &&
    normalizedEnrollments.some(
      (item) =>
        Number(
          item.student_id ||
          item.student?.id
        ) ===
          Number(
            formData.student_id
          ) &&
        Number(
          item.course_id ||
          item.course?.id
        ) ===
          Number(
            formData.course_id
          )
    );


  // =====================================
  // Drawer
  // =====================================

  const openDrawer = () => {

    setFormData({
      student_id: "",
      course_id: "",
    });

    setErrors({});
    setPageError("");
    setMessage("");

    setDrawerOpen(true);
  };


  const closeDrawer = () => {

    if (saving) {
      return;
    }

    setDrawerOpen(false);
    setErrors({});
  };


  // =====================================
  // Create Enrollment
  // =====================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      if (
        !formData.student_id ||
        !formData.course_id
      ) {

        setErrors({
          form: [
            "Choose a student and a course.",
          ],
        });

        return;
      }


      if (duplicatePair) {

        setErrors({
          form: [
            "This student is already enrolled in this course.",
          ],
        });

        return;
      }


      try {

        setSaving(true);
        setErrors({});
        setPageError("");
        setMessage("");


        await api.post(
          "/enrollments",
          {
            student_id:
              Number(
                formData.student_id
              ),

            course_id:
              Number(
                formData.course_id
              ),
          }
        );


        setDrawerOpen(false);


        setMessage(
          "Student enrolled successfully."
        );


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

        } else {

          setPageError(
            error.response?.data
              ?.message ||
            "Unable to create enrollment."
          );
        }

      } finally {

        setSaving(false);
      }
    };


  // =====================================
  // Helpers
  // =====================================

  const formatDate =
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


      return date.toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    };


  if (loading) {

    return (
      <div className="premium-admin-loading">

        <span className="premium-spinner" />

        <p>{tr("Loading enrollments...")}</p>

      </div>
    );
  }


  return (
    <div className="premium-admin-crud premium-enrollments-page">

      {/* Header */}

      <div className="premium-crud-heading">

        <div>

          <span>{tr("People")}</span>


          <h1>{tr("Enrollments")}</h1>


          <p>{tr("Assign registered students to courses and monitor their real course progress.")}</p>

        </div>


        <button
          type="button"
          className="premium-add-button"
          onClick={openDrawer}
        >
          <Plus size={16} />{tr("New enrollment")}</button>

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

      <div className="premium-enrollment-stats">

        <article>

          <div>
            <GraduationCap size={18} />
          </div>

          <span>{tr("Total enrollments")}</span>

          <strong>
            {
              normalizedEnrollments
                .length
            }
          </strong>

        </article>


        <article>

          <div>
            <BookOpen size={18} />
          </div>

          <span>{tr("In progress")}</span>

          <strong>
            {activeEnrollmentCount}
          </strong>

        </article>


        <article>

          <div>
            <CheckCircle2 size={18} />
          </div>

          <span>{tr("Completed")}</span>

          <strong>
            {completedCount}
          </strong>

        </article>

      </div>


      {/* Toolbar */}

      <div className="premium-crud-toolbar premium-enrollment-toolbar">

        <div className="premium-crud-search">

          <Search size={17} />

          <input
            type="search"
            placeholder={tr("Search student or course...")}
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <div className="premium-crud-filters">

          <button
            type="button"
            className={
              statusFilter ===
              "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "all"
              )
            }
          >{tr("All")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Enrolled"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Enrolled"
              )
            }
          >{tr("Enrolled")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Completed"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Completed"
              )
            }
          >{tr("Completed")}</button>

        </div>


        <div className="premium-result-count">
          {
            filteredEnrollments
              .length
          }
          {" "}
          results
        </div>

      </div>


      {/* Table */}

      <div className="premium-crud-table-wrap premium-enrollment-table-wrap">

        {filteredEnrollments.length ===
        0 ? (

          <div className="premium-admin-empty">

            <GraduationCap size={27} />

            <strong>{tr("No enrollments found.")}</strong>

            <span>{tr("Enroll a student or change your filters.")}</span>

          </div>

        ) : (

          <table className="premium-crud-table">

            <thead>

              <tr>

                <th>{tr("Student")}</th>

                <th>{tr("Course")}</th>

                <th>{tr("Progress")}</th>

                <th>{tr("Status")}</th>

                <th>{tr("Enrolled")}</th>

              </tr>

            </thead>


            <tbody>

              {filteredEnrollments.map(
                (item) => (

                  <tr
                    key={
                      item.id
                    }
                  >

                    <td>

                      <div className="premium-student-cell">

                        <div className="premium-student-avatar">
                          {
                            item
                              .student_name
                              ?.charAt(0)
                              ?.toUpperCase()
                            ||
                            "S"
                          }
                        </div>


                        <div>

                          <strong>
                            {
                              item
                                .student_name
                            }
                          </strong>

                          <span>
                            {
                              item
                                .student_email
                            }
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>

                      <div className="premium-enrollment-course">

                        <BookOpen size={15} />


                        <div>

                          <strong>
                            {
                              item
                                .course_title
                            }
                          </strong>

                          <span>

                            {item.stage}

                            {
                              item.grade
                                ? ` • ${item.grade}`
                                : ""
                            }

                          </span>

                        </div>

                      </div>

                    </td>


                    <td>

                      <div className="premium-table-progress">

                        <div>

                          <span
                            style={{
                              width:
                                `${item.progress}%`,
                            }}
                          />

                        </div>


                        <strong>
                          {
                            item.progress
                          }%
                        </strong>

                      </div>

                    </td>


                    <td>

                      <span
                        className={
                          item.status ===
                          "Completed"
                            ? "premium-status completed"
                            : "premium-status active"
                        }
                      >
                        {
                          item.status
                        }
                      </span>

                    </td>


                    <td>
                      <span className="premium-date-cell">
                        {
                          formatDate(
                            item.enrolled_at ||
                            item.created_at
                          )
                        }
                      </span>
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* Mobile */}

      <div className="premium-enrollment-mobile-list">

        {filteredEnrollments.map(
          (item) => (

            <article
              key={
                `mobile-${item.id}`
              }
              className="premium-enrollment-mobile-card"
            >

              <div className="premium-enrollment-mobile-head">

                <div className="premium-student-cell">

                  <div className="premium-student-avatar">
                    {
                      item
                        .student_name
                        ?.charAt(0)
                        ?.toUpperCase()
                      ||
                      "S"
                    }
                  </div>


                  <div>

                    <strong>
                      {
                        item
                          .student_name
                      }
                    </strong>

                    <span>
                      {
                        item
                          .student_email
                      }
                    </span>

                  </div>

                </div>


                <span
                  className={
                    item.status ===
                    "Completed"
                      ? "premium-status completed"
                      : "premium-status active"
                  }
                >
                  {item.status}
                </span>

              </div>


              <div className="premium-enrollment-mobile-course">

                <BookOpen size={15} />

                <div>

                  <strong>
                    {
                      item
                        .course_title
                    }
                  </strong>

                  <span>
                    {item.stage}

                    {
                      item.grade
                        ? ` • ${item.grade}`
                        : ""
                    }
                  </span>

                </div>

              </div>


              <div className="premium-table-progress">

                <div>
                  <span
                    style={{
                      width:
                        `${item.progress}%`,
                    }}
                  />
                </div>

                <strong>
                  {item.progress}%
                </strong>

              </div>

            </article>

          )
        )}

      </div>


      {/* Create Drawer */}

      {drawerOpen && (

        <>

          <button
            type="button"
            className="premium-drawer-backdrop"
            onClick={closeDrawer}
            aria-label={tr("Close enrollment panel")}
          />


          <aside className="premium-edit-drawer premium-enrollment-drawer">

            <div className="premium-drawer-head">

              <div>

                <span>{tr("Enrollment")}</span>

                <h2>{tr("Add student to course")}</h2>

              </div>


              <button
                type="button"
                onClick={closeDrawer}
                aria-label={tr("Close")}
              >
                <X size={18} />
              </button>

            </div>


            <form
              className="premium-edit-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="premium-enrollment-step">

                <span className="premium-step-number">
                  1
                </span>


                <div>

                  <strong>{tr("Choose student")}</strong>

                  <p>{tr("Only active registered students are shown.")}</p>

                </div>

              </div>


              <div className="premium-field">

                <label>{tr("Student")}</label>


                <select
                  value={
                    formData.student_id
                  }
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        student_id:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                >

                  <option value="">{tr("Select student")}</option>


                  {activeStudents.map(
                    (student) => (

                      <option
                        key={
                          student.id
                        }
                        value={
                          student.id
                        }
                      >
                        {
                          student.name
                        }
                        {" — "}
                        {
                          student.email
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              {selectedStudent && (

                <div className="premium-selection-preview">

                  <UserRound size={17} />

                  <div>

                    <strong>
                      {
                        selectedStudent.name
                      }
                    </strong>

                    <span>
                      {
                        selectedStudent.email
                      }
                    </span>

                  </div>

                </div>

              )}


              <div className="premium-enrollment-step">

                <span className="premium-step-number">
                  2
                </span>


                <div>

                  <strong>{tr("Choose course")}</strong>

                  <p>{tr("The enrollment starts with server-managed progress.")}</p>

                </div>

              </div>


              <div className="premium-field">

                <label>{tr("Course")}</label>


                <select
                  value={
                    formData.course_id
                  }
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        course_id:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                >

                  <option value="">{tr("Select course")}</option>


                  {courses.map(
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


              {selectedCourse && (

                <div className="premium-selection-preview">

                  <BookOpen size={17} />

                  <div>

                    <strong>
                      {
                        selectedCourse.title
                      }
                    </strong>

                    <span>

                      {
                        selectedCourse
                          .grade
                          ?.academic_stage
                          ?.name ||
                        "Course"
                      }

                      {
                        selectedCourse
                          .grade
                          ?.name
                          ? ` • ${selectedCourse.grade.name}`
                          : ""
                      }

                    </span>

                  </div>

                </div>

              )}


              {duplicatePair && (

                <div className="premium-inline-warning">{tr("This student is already enrolled in this course.")}</div>

              )}


              {errors.form && (
                <span className="field-error">
                  {errors.form[0]}
                </span>
              )}


              {errors.student_id && (
                <span className="field-error">
                  {
                    errors
                      .student_id[0]
                  }
                </span>
              )}


              {errors.course_id && (
                <span className="field-error">
                  {
                    errors
                      .course_id[0]
                  }
                </span>
              )}


              <div className="premium-enrollment-review">

                <div>
                  <span>{tr("Student")}</span>

                  <strong>
                    {
                      selectedStudent
                        ?.name ||
                      "Not selected"
                    }
                  </strong>
                </div>


                <ArrowRight size={16} />


                <div>
                  <span>{tr("Course")}</span>

                  <strong>
                    {
                      selectedCourse
                        ?.title ||
                      "Not selected"
                    }
                  </strong>
                </div>

              </div>


              <div className="premium-drawer-actions">

                <button
                  type="button"
                  className="premium-cancel-btn"
                  onClick={closeDrawer}
                >{tr("Cancel")}</button>


                <button
                  type="submit"
                  className="premium-save-btn"
                  disabled={
                    saving ||
                    duplicatePair ||
                    !formData.student_id ||
                    !formData.course_id
                  }
                >

                  {
                    saving
                      ? "Enrolling..."
                      : "Enroll student"
                  }

                </button>

              </div>

            </form>

          </aside>

        </>

      )}

    </div>
  );
}


export default Enrollments;
