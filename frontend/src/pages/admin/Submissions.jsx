import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Search,
  UserRound,
  X,
} from "lucide-react";

import api
  from "../../services/api";


import {
  useLanguage,
} from "../../context/LanguageContext";


function Submissions() {
  const { tr } = useLanguage();

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

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
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    gradingSubmission,
    setGradingSubmission,
  ] = useState(null);

  const [
    grade,
    setGrade,
  ] = useState("");

  const [
    gradeError,
    setGradeError,
  ] = useState("");

  const [
    savingGrade,
    setSavingGrade,
  ] = useState(false);


  // =====================================
  // Load
  // =====================================

  const fetchSubmissions =
    async () => {

      try {

        setLoading(true);
        setPageError("");


        const response =
          await api.get(
            "/submissions"
          );


        setSubmissions(
          response.data
            .submissions ||
          []
        );

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to load submissions."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchSubmissions();
  }, []);


  // =====================================
  // Filters
  // =====================================

  const filteredSubmissions =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();


      return submissions.filter(
        (submission) => {

          const searchable =
            [
              submission.student
                ?.name,
              submission.assignment
                ?.title,
              submission.assignment
                ?.course
                ?.title,
              submission.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          const matchesSearch =
            !term ||
            searchable.includes(
              term
            );


          const matchesStatus =
            statusFilter === "all" ||
            submission.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      submissions,
      search,
      statusFilter,
    ]);


  const gradedCount =
    submissions.filter(
      (item) =>
        item.status === "Graded"
    ).length;


  const pendingCount =
    submissions.length -
    gradedCount;


  const averageGrade =
    useMemo(() => {

      const graded =
        submissions.filter(
          (item) =>
            item.grade !== null &&
            Number(
              item.assignment
                ?.marks
            ) > 0
        );


      if (graded.length === 0) {
        return null;
      }


      const total =
        graded.reduce(
          (
            sum,
            item
          ) => {

            const max =
              Number(
                item.assignment
                  ?.marks
              ) || 0;


            if (max <= 0) {
              return sum;
            }


            return (
              sum +
              (
                Number(
                  item.grade
                ) /
                max
              ) *
              100
            );
          },
          0
        );


      return Math.round(
        total /
        graded.length
      );

    }, [submissions]);


  // =====================================
  // Grade Drawer
  // =====================================

  const openGradeDrawer =
    (submission) => {

      setGradingSubmission(
        submission
      );


      setGrade(
        submission.grade !== null
          ? submission.grade
          : ""
      );


      setGradeError("");
      setMessage("");
      setPageError("");
    };


  const closeGradeDrawer =
    () => {

      if (savingGrade) {
        return;
      }


      setGradingSubmission(
        null
      );

      setGrade("");
      setGradeError("");
    };


  const handleSaveGrade =
    async () => {

      if (!gradingSubmission) {
        return;
      }


      setGradeError("");
      setMessage("");


      const maxMarks =
        Number(
          gradingSubmission
            .assignment
            ?.marks
        ) || 0;


      if (
        grade === "" ||
        Number.isNaN(
          Number(grade)
        ) ||
        Number(grade) < 0 ||
        Number(grade) > maxMarks
      ) {

        setGradeError(
          `Enter a grade between 0 and ${maxMarks}.`
        );

        return;
      }


      try {

        setSavingGrade(true);


        await api.put(
          `/submissions/${gradingSubmission.id}/grade`,
          {
            grade:
              Number(grade),
          }
        );


        setMessage(
          "Grade saved successfully."
        );


        setGradingSubmission(
          null
        );

        setGrade("");


        await fetchSubmissions();

      } catch (error) {

        if (
          error.response?.status ===
          422
        ) {

          setGradeError(
            error.response?.data
              ?.message ||
            "Invalid grade."
          );

        } else {

          setPageError(
            error.response?.data
              ?.message ||
            "Unable to save grade."
          );
        }

      } finally {

        setSavingGrade(false);
      }
    };


  // =====================================
  // Helpers
  // =====================================

  const getFileUrl =
    (file) => {

      if (!file) {
        return null;
      }


      return `${
        import.meta.env
          .VITE_BACKEND_URL
      }/storage/${file}`;
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


  if (loading) {

    return (
      <div className="premium-admin-loading">

        <span className="premium-spinner" />

        <p>{tr("Loading submissions...")}</p>

      </div>
    );
  }


  return (
    <div className="premium-admin-crud premium-submissions-page">

      {/* Header */}

      <div className="premium-crud-heading">

        <div>

          <span>{tr("Coursework")}</span>


          <h1>{tr("Submissions")}</h1>


          <p>{tr("Review uploaded work and grade students with fewer clicks.")}</p>

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


      {/* Summary */}

      <div className="premium-submission-stats">

        <article>

          <div>
            <FileCheck2 size={18} />
          </div>

          <span>{tr("Total")}</span>

          <strong>
            {submissions.length}
          </strong>

        </article>


        <article>

          <div>
            <Clock3 size={18} />
          </div>

          <span>{tr("Awaiting grade")}</span>

          <strong>
            {pendingCount}
          </strong>

        </article>


        <article>

          <div>
            <CheckCircle2 size={18} />
          </div>

          <span>{tr("Graded")}</span>

          <strong>
            {gradedCount}
          </strong>

        </article>


        <article>

          <div>
            <Award size={18} />
          </div>

          <span>{tr("Avg. score")}</span>

          <strong>
            {
              averageGrade ===
              null
                ? "-"
                : `${averageGrade}%`
            }
          </strong>

        </article>

      </div>


      {/* Toolbar */}

      <div className="premium-submission-toolbar">

        <div className="premium-crud-search">

          <Search size={17} />

          <input
            type="search"
            placeholder={tr("Search student, assignment or course...")}
            value={search}
            onChange={
              (event) =>
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
              "Submitted"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Submitted"
              )
            }
          >{tr("Submitted")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Graded"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Graded"
              )
            }
          >{tr("Graded")}</button>

        </div>


        <div className="premium-result-count">
          {
            filteredSubmissions
              .length
          }
          {" "}
          results
        </div>

      </div>


      {/* Desktop Table */}

      <div className="premium-crud-table-wrap premium-submission-table-wrap">

        {filteredSubmissions.length ===
        0 ? (

          <div className="premium-admin-empty">

            <FileText size={28} />

            <strong>{tr("No submissions found.")}</strong>

            <span>{tr("Student work will appear here after submission.")}</span>

          </div>

        ) : (

          <table className="premium-crud-table premium-submission-table">

            <thead>

              <tr>
                <th>{tr("Student")}</th>
                <th>{tr("Assignment")}</th>
                <th>{tr("Course")}</th>
                <th>{tr("Submitted")}</th>
                <th>{tr("File")}</th>
                <th>{tr("Grade")}</th>
                <th>{tr("Status")}</th>
                <th>{tr("Action")}</th>
              </tr>

            </thead>


            <tbody>

              {filteredSubmissions.map(
                (submission) => {

                  const maxMarks =
                    Number(
                      submission
                        .assignment
                        ?.marks
                    ) || 0;


                  const fileUrl =
                    getFileUrl(
                      submission.file
                    );


                  return (
                    <tr
                      key={
                        submission.id
                      }
                    >

                      <td>

                        <div className="premium-student-cell">

                          <div className="premium-student-avatar">
                            {
                              submission
                                .student
                                ?.name
                                ?.charAt(0)
                                ?.toUpperCase()
                              ||
                              "S"
                            }
                          </div>


                          <div>

                            <strong>
                              {
                                submission
                                  .student
                                  ?.name ||
                                "-"
                              }
                            </strong>

                            <span>
                              Submission #{
                                submission.id
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>

                        <div className="premium-submission-assignment">

                          <FileText size={14} />

                          <strong>
                            {
                              submission
                                .assignment
                                ?.title ||
                              "-"
                            }
                          </strong>

                        </div>

                      </td>


                      <td>

                        <span className="premium-submission-course">
                          {
                            submission
                              .assignment
                              ?.course
                              ?.title ||
                            "-"
                          }
                        </span>

                      </td>


                      <td>

                        <span className="premium-date-cell">
                          {
                            formatDateTime(
                              submission
                                .submitted_at
                            )
                          }
                        </span>

                      </td>


                      <td>

                        {fileUrl ? (

                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="premium-file-button"
                          >
                            <ExternalLink
                              size={13}
                            />{tr("Open")}</a>

                        ) : (

                          <span className="premium-muted-dash">
                            -
                          </span>

                        )}

                      </td>


                      <td>

                        <div className="premium-grade-cell">

                          <strong>
                            {
                              submission.grade !==
                              null
                                ? submission.grade
                                : "-"
                            }
                          </strong>

                          <span>
                            / {maxMarks}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            submission.status ===
                            "Graded"
                              ? "premium-status active"
                              : "premium-status pending"
                          }
                        >
                          {
                            submission
                              .status
                          }
                        </span>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="premium-grade-button"
                          onClick={() =>
                            openGradeDrawer(
                              submission
                            )
                          }
                        >
                          <Award size={14} />
                          {
                            submission
                              .grade !==
                              null
                              ? "Edit grade"
                              : "Grade"
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


      {/* Mobile */}

      <div className="premium-submission-mobile-list">

        {filteredSubmissions.map(
          (submission) => {

            const maxMarks =
              Number(
                submission
                  .assignment
                  ?.marks
              ) || 0;


            const fileUrl =
              getFileUrl(
                submission.file
              );


            return (
              <article
                key={
                  `mobile-${submission.id}`
                }
                className="premium-submission-mobile-card"
              >

                <div className="premium-submission-mobile-head">

                  <div className="premium-student-cell">

                    <div className="premium-student-avatar">
                      {
                        submission
                          .student
                          ?.name
                          ?.charAt(0)
                          ?.toUpperCase()
                        ||
                        "S"
                      }
                    </div>


                    <div>

                      <strong>
                        {
                          submission
                            .student
                            ?.name ||
                          "-"
                        }
                      </strong>

                      <span>
                        {
                          submission
                            .assignment
                            ?.title ||
                          "-"
                        }
                      </span>

                    </div>

                  </div>


                  <span
                    className={
                      submission.status ===
                      "Graded"
                        ? "premium-status active"
                        : "premium-status pending"
                    }
                  >
                    {submission.status}
                  </span>

                </div>


                <div className="premium-submission-mobile-course">

                  <BookOpen size={14} />

                  <span>
                    {
                      submission
                        .assignment
                        ?.course
                        ?.title ||
                      "-"
                    }
                  </span>

                </div>


                <div className="premium-submission-mobile-meta">

                  <span>
                    {
                      formatDateTime(
                        submission
                          .submitted_at
                      )
                    }
                  </span>


                  <strong>
                    {
                      submission.grade !==
                      null
                        ? `${submission.grade} / ${maxMarks}`
                        : `- / ${maxMarks}`
                    }
                  </strong>

                </div>


                <div className="premium-submission-mobile-actions">

                  {fileUrl && (

                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink
                        size={13}
                      />{tr("Open file")}</a>

                  )}


                  <button
                    type="button"
                    onClick={() =>
                      openGradeDrawer(
                        submission
                      )
                    }
                  >
                    <Award size={13} />
                    {
                      submission.grade !==
                      null
                        ? "Edit grade"
                        : "Grade"
                    }
                  </button>

                </div>

              </article>
            );
          }
        )}

      </div>


      {/* Grade Drawer */}

      {gradingSubmission && (

        <>

          <button
            type="button"
            className="premium-drawer-backdrop"
            onClick={closeGradeDrawer}
            aria-label={tr("Close grading panel")}
          />


          <aside className="premium-edit-drawer premium-grade-drawer">

            <div className="premium-drawer-head">

              <div>

                <span>{tr("Submission")}</span>


                <h2>{tr("Grade student work")}</h2>

              </div>


              <button
                type="button"
                onClick={
                  closeGradeDrawer
                }
                aria-label={tr("Close")}
              >
                <X size={18} />
              </button>

            </div>


            <div className="premium-grade-student">

              <div className="premium-drawer-avatar">
                <UserRound size={21} />
              </div>


              <div>

                <strong>
                  {
                    gradingSubmission
                      .student
                      ?.name ||
                    "-"
                  }
                </strong>

                <span>
                  {
                    gradingSubmission
                      .assignment
                      ?.title ||
                    "-"
                  }
                </span>

              </div>

            </div>


            <div className="premium-grade-context">

              <div>

                <span>{tr("Course")}</span>

                <strong>
                  {
                    gradingSubmission
                      .assignment
                      ?.course
                      ?.title ||
                    "-"
                  }
                </strong>

              </div>


              <div>

                <span>{tr("Submitted")}</span>

                <strong>
                  {
                    formatDateTime(
                      gradingSubmission
                        .submitted_at
                    )
                  }
                </strong>

              </div>

            </div>


            {getFileUrl(
              gradingSubmission.file
            ) && (

              <a
                href={
                  getFileUrl(
                    gradingSubmission
                      .file
                  )
                }
                target="_blank"
                rel="noreferrer"
                className="premium-grade-file-link"
              >
                <ExternalLink size={15} />{tr("Open submitted file")}</a>

            )}


            <div className="premium-grade-entry">

              <label>{tr("Grade")}</label>


              <div>

                <input
                  type="number"
                  min="0"
                  max={
                    Number(
                      gradingSubmission
                        .assignment
                        ?.marks
                    ) || 0
                  }
                  step="0.01"
                  value={grade}
                  onChange={
                    (event) =>
                      setGrade(
                        event.target.value
                      )
                  }
                  autoFocus
                />


                <span>
                  /{" "}
                  {
                    gradingSubmission
                      .assignment
                      ?.marks ||
                    0
                  }
                </span>

              </div>


              {gradeError && (
                <span className="field-error">
                  {gradeError}
                </span>
              )}

            </div>


            <div className="premium-grade-scale">

              <span>
                0
              </span>

              <div>
                <span
                  style={{
                    width:
                      gradingSubmission
                        .assignment
                        ?.marks > 0 &&
                      grade !== ""
                        ? `${Math.min(
                            100,
                            Math.max(
                              0,
                              (
                                Number(
                                  grade
                                ) /
                                Number(
                                  gradingSubmission
                                    .assignment
                                    .marks
                                )
                              ) *
                                100
                            )
                          )}%`
                        : "0%",
                  }}
                />
              </div>

              <span>
                {
                  gradingSubmission
                    .assignment
                    ?.marks ||
                  0
                }
              </span>

            </div>


            <div className="premium-drawer-actions">

              <button
                type="button"
                className="premium-cancel-btn"
                onClick={
                  closeGradeDrawer
                }
              >{tr("Cancel")}</button>


              <button
                type="button"
                className="premium-save-btn"
                disabled={
                  savingGrade
                }
                onClick={
                  handleSaveGrade
                }
              >
                {
                  savingGrade
                    ? "Saving..."
                    : "Save grade"
                }
              </button>

            </div>

          </aside>

        </>

      )}

    </div>
  );
}


export default Submissions;
