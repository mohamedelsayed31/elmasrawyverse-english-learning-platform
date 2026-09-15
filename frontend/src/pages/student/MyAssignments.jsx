import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileUp,
  LockKeyhole,
  Search,
  Upload,
  UserRound,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function MyAssignments() {
  const {
    t,
    language,
    tr,
  } = useLanguage();


  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState({});

  const [
    uploadingId,
    setUploadingId,
  ] = useState(null);

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
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  const fetchData =
    async () => {

      try {

        setLoading(true);
        setError("");


        const [
          assignmentsResponse,
          submissionsResponse,
        ] = await Promise.all([
          api.get(
            "/my/assignments"
          ),
          api.get(
            "/my/submissions"
          ),
        ]);


        setAssignments(
          assignmentsResponse
            .data
            .assignments ||
          []
        );

        setSubmissions(
          submissionsResponse
            .data
            .submissions ||
          []
        );

      } catch (error) {

        console.error(
          error
        );

        setError(
          t(
            "student.failedAssignments"
          )
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchData();
  }, []);


  const submissionMap =
    useMemo(
      () =>
        new Map(
          submissions.map(
            (submission) => [
              Number(
                submission
                  .assignment_id
              ),
              submission,
            ]
          )
        ),
      [submissions]
    );


  const filtered =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        return assignments.filter(
          (assignment) => {

            const submission =
              submissionMap.get(
                Number(
                  assignment.id
                )
              );


            const matchesSearch =
              !term ||
              [
                assignment.title,
                assignment.course
                  ?.title,
                assignment.course
                  ?.instructor
                  ?.name,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(term);


            let matchesFilter =
              true;


            if (
              filter ===
              "submitted"
            ) {

              matchesFilter =
                Boolean(
                  submission
                );

            } else if (
              filter ===
              "open"
            ) {

              matchesFilter =
                !submission &&
                assignment.status ===
                  "Open";

            } else if (
              filter ===
              "closed"
            ) {

              matchesFilter =
                !submission &&
                assignment.status !==
                  "Open";
            }


            return (
              matchesSearch &&
              matchesFilter
            );
          }
        );

      },
      [
        assignments,
        submissionMap,
        search,
        filter,
      ]
    );


  const submittedCount =
    assignments.filter(
      (assignment) =>
        submissionMap.has(
          Number(
            assignment.id
          )
        )
    ).length;


  const openCount =
    assignments.filter(
      (assignment) =>
        assignment.status ===
          "Open" &&
        !submissionMap.has(
          Number(
            assignment.id
          )
        )
    ).length;


  const handleFileChange =
    (
      assignmentId,
      file
    ) => {

      setSelectedFile(
        (current) => ({
          ...current,
          [assignmentId]:
            file || null,
        })
      );
    };


  const handleSubmit =
    async (
      assignmentId
    ) => {

      const file =
        selectedFile[
          assignmentId
        ];


      if (!file) {

        setError(
          t(
            "student.selectFile"
          )
        );

        return;
      }


      try {

        setUploadingId(
          assignmentId
        );

        setError("");
        setMessage("");


        const formData =
          new FormData();


        formData.append(
          "file",
          file
        );


        await api.post(
          `/assignments/${assignmentId}/submit`,
          formData
        );


        setMessage(
          t(
            "student.submissionSuccess"
          )
        );


        setSelectedFile(
          (current) => ({
            ...current,
            [assignmentId]:
              null,
          })
        );


        await fetchData();

      } catch (error) {

        console.error(
          error
        );


        if (
          language === "ar"
        ) {

          setError(
            t(
              "student.submissionFailed"
            )
          );

        } else {

          setError(
            error.response?.data
              ?.errors?.file?.[0] ||
            error.response?.data
              ?.message ||
            t(
              "student.submissionFailed"
            )
          );
        }

      } finally {

        setUploadingId(
          null
        );
      }
    };


  const translateStatus =
    (status) => {

      if (!status) {
        return "-";
      }


      const translated =
        t(
          `status.${status}`
        );


      return (
        translated ===
          `status.${status}`
          ? status
          : translated
      );
    };


  const formatDate =
    (value) => {

      if (!value) {
        return "-";
      }


      return new Date(
        value
      ).toLocaleDateString(
        language === "ar"
          ? "ar-EG"
          : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    };


  if (loading) {

    return (
      <div className="student-dashboard-loading">

        <span className="ev-loading-orbit" />

        <p>
          {
            t(
              "student.loadingAssignments"
            )
          }
        </p>

      </div>
    );
  }


  return (
    <div className="premium-student-work-page">

      <div className="premium-student-work-header">

        <div>

          <span>{tr("Coursework")}</span>

          <h1>
            {
              t(
                "student.myAssignments"
              )
            }
          </h1>

          <p>
            {
              t(
                "student.assignmentsDescription"
              )
            }
          </p>

        </div>


        <div className="premium-student-work-summary">

          <div>
            <strong>
              {assignments.length}
            </strong>
            <span>{tr("Total")}</span>
          </div>

          <div>
            <strong>
              {openCount}
            </strong>
            <span>{tr("To do")}</span>
          </div>

          <div>
            <strong>
              {submittedCount}
            </strong>
            <span>{tr("Submitted")}</span>
          </div>

        </div>

      </div>


      {message && (
        <div className="success-message">
          {message}
        </div>
      )}


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="premium-student-work-toolbar">

        <div className="premium-student-search">

          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={
              (event) =>
                setSearch(
                  event.target.value
                )
            }
            placeholder={tr("Search assignments...")}
          />

        </div>


        <div className="premium-student-filter">

          {[
            ["all", tr("All")],
            ["open", tr("To Do")],
            ["submitted", tr("Submitted"),],
            ["closed", tr("Closed")],
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
                  setFilter(value)
                }
              >
                {label}
              </button>

            )
          )}

        </div>

      </div>


      {filtered.length ===
      0 ? (

        <div className="premium-student-work-empty">

          <FileUp size={34} />

          <h2>
            {
              t(
                "student.noAssignments"
              )
            }
          </h2>

          <p>
            {
              t(
                "student.noAssignmentsDescription"
              )
            }
          </p>

        </div>

      ) : (

        <div className="premium-student-assignment-grid">

          {filtered.map(
            (assignment) => {

              const submission =
                submissionMap.get(
                  Number(
                    assignment.id
                  )
                );


              const submitted =
                Boolean(
                  submission
                );


              const isOpen =
                assignment.status ===
                "Open";


              return (
                <article
                  className="premium-student-assignment-card"
                  key={
                    assignment.id
                  }
                >

                  <div className="premium-student-assignment-top">

                    <div className="premium-student-assignment-icon">
                      {
                        submitted
                          ? (
                            <CheckCircle2
                              size={21}
                            />
                          )
                          : isOpen
                            ? (
                              <Clock3
                                size={21}
                              />
                            )
                            : (
                              <LockKeyhole
                                size={21}
                              />
                            )
                      }
                    </div>


                    <span
                      className={
                        submitted
                          ? "premium-work-state submitted"
                          : isOpen
                            ? "premium-work-state open"
                            : "premium-work-state closed"
                      }
                    >
                      {
                        submitted
                          ? translateStatus(
                              submission.status
                            )
                          : translateStatus(
                              assignment.status
                            )
                      }
                    </span>

                  </div>


                  <h2>
                    {assignment.title}
                  </h2>


                  <div className="premium-student-work-course">

                    <BookOpen
                      size={15}
                    />

                    <span>
                      {
                        assignment.course
                          ?.title ||
                        "-"
                      }
                    </span>

                  </div>


                  <div className="premium-student-work-instructor">

                    <UserRound
                      size={14}
                    />

                    <span>
                      {
                        assignment.course
                          ?.instructor
                          ?.name ||
                        "-"
                      }
                    </span>

                  </div>


                  <div className="premium-student-assignment-meta">

                    <div>
                      <CalendarDays
                        size={16}
                      />
                      <span>{tr("Due")}</span>
                      <strong>
                        {
                          formatDate(
                            assignment
                              .due_date
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <Award
                        size={16}
                      />
                      <span>{tr("Marks")}</span>
                      <strong>
                        {
                          assignment
                            .marks
                        }
                      </strong>
                    </div>

                  </div>


                  {submitted ? (

                    <div className="premium-submitted-panel">

                      <div>
                        <CheckCircle2
                          size={17}
                        />

                        <strong>
                          {
                            t(
                              "student.submittedSuccessfully"
                            )
                          }
                        </strong>
                      </div>


                      <span>
                        {
                          t(
                            "student.status"
                          )
                        }
                        :{" "}
                        {
                          translateStatus(
                            submission
                              .status
                          )
                        }
                      </span>


                      {
                        submission.grade !==
                        null &&
                        submission.grade !==
                        undefined && (

                          <strong className="premium-submitted-grade">
                            {
                              submission
                                .grade
                            }
                            {" / "}
                            {
                              assignment
                                .marks
                            }
                          </strong>

                        )
                      }

                    </div>

                  ) : isOpen ? (

                    <div className="premium-student-upload">

                      <label>

                        <Upload
                          size={18}
                        />

                        <div>
                          <strong>
                            {
                              selectedFile[
                                assignment.id
                              ]?.name ||
                              t(
                                "student.selectFile"
                              )
                            }
                          </strong>

                          <span>{tr("PDF, DOC, DOCX or ZIP")}</span>
                        </div>


                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.zip"
                          onChange={
                            (event) =>
                              handleFileChange(
                                assignment.id,
                                event.target
                                  .files?.[0]
                              )
                          }
                        />

                      </label>


                      <button
                        type="button"
                        disabled={
                          uploadingId ===
                          assignment.id
                        }
                        onClick={() =>
                          handleSubmit(
                            assignment.id
                          )
                        }
                      >
                        <FileUp size={16} />

                        {
                          uploadingId ===
                          assignment.id
                            ? t(
                                "student.uploading"
                              )
                            : t(
                                "student.submitAssignment"
                              )
                        }
                      </button>

                    </div>

                  ) : (

                    <div className="premium-assignment-closed">
                      <LockKeyhole
                        size={16}
                      />

                      {
                        t(
                          "student.assignmentClosed"
                        )
                      }
                    </div>

                  )}

                </article>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}


export default MyAssignments;
