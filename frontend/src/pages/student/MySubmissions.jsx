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
  Search,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function MySubmissions() {
  const {
    t,
    language,
    tr,
  } = useLanguage();


  const [
    submissions,
    setSubmissions,
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
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    const fetchSubmissions =
      async () => {

        try {

          setLoading(true);
          setError("");


          const response =
            await api.get(
              "/my/submissions"
            );


          setSubmissions(
            response.data
              .submissions ||
            []
          );

        } catch (error) {

          console.error(
            error
          );

          setError(
            t(
              "student.failedSubmissions"
            )
          );

        } finally {

          setLoading(false);
        }
      };


    fetchSubmissions();

  }, []);


  const filtered =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        return submissions.filter(
          (submission) => {

            const assignment =
              submission.assignment ||
              {};


            const matchesSearch =
              !term ||
              [
                assignment.title,
                assignment.course
                  ?.title,
                submission.status,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(term);


            const matchesFilter =
              filter === "all" ||
              submission.status ===
                filter;


            return (
              matchesSearch &&
              matchesFilter
            );
          }
        );

      },
      [
        submissions,
        search,
        filter,
      ]
    );


  const gradedCount =
    submissions.filter(
      (item) =>
        item.status ===
        "Graded"
    ).length;


  const pendingCount =
    submissions.length -
    gradedCount;


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


  const formatDateTime =
    (value) => {

      if (!value) {
        return "-";
      }


      return new Date(
        value
      ).toLocaleString(
        language === "ar"
          ? "ar-EG"
          : "en-US",
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
      <div className="student-dashboard-loading">

        <span className="ev-loading-orbit" />

        <p>
          {
            t(
              "student.loadingSubmissions"
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
                "student.mySubmissions"
              )
            }
          </h1>

          <p>
            {
              t(
                "student.submissionsDescription"
              )
            }
          </p>

        </div>


        <div className="premium-student-work-summary">

          <div>
            <strong>
              {submissions.length}
            </strong>
            <span>{tr("Total")}</span>
          </div>

          <div>
            <strong>
              {pendingCount}
            </strong>
            <span>{tr("Pending")}</span>
          </div>

          <div>
            <strong>
              {gradedCount}
            </strong>
            <span>{tr("Graded")}</span>
          </div>

        </div>

      </div>


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
            placeholder={tr("Search submissions...")}
          />

        </div>


        <div className="premium-student-filter">

          {[
            ["all", tr("All")],
            ["Submitted", tr("Submitted"),],
            ["Graded", tr("Graded")],
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

          <FileCheck2 size={34} />

          <h2>
            {
              t(
                "student.noSubmissions"
              )
            }
          </h2>

          <p>
            {
              t(
                "student.noSubmissionsDescription"
              )
            }
          </p>

        </div>

      ) : (

        <div className="premium-student-submission-list">

          {filtered.map(
            (submission) => {

              const assignment =
                submission.assignment ||
                {};


              const fileUrl =
                getFileUrl(
                  submission.file
                );


              const maxMarks =
                Number(
                  assignment.marks
                ) || 0;


              return (
                <article
                  className="premium-student-submission-card"
                  key={
                    submission.id
                  }
                >

                  <div className="premium-student-submission-main">

                    <div
                      className={
                        submission.status ===
                        "Graded"
                          ? "premium-submission-result-icon graded"
                          : "premium-submission-result-icon pending"
                      }
                    >
                      {
                        submission.status ===
                        "Graded"
                          ? (
                            <CheckCircle2
                              size={20}
                            />
                          )
                          : (
                            <Clock3
                              size={20}
                            />
                          )
                      }
                    </div>


                    <div>

                      <h2>
                        {
                          assignment.title ||
                          "-"
                        }
                      </h2>


                      <span>
                        <BookOpen
                          size={14}
                        />

                        {
                          assignment.course
                            ?.title ||
                          "-"
                        }
                      </span>

                    </div>

                  </div>


                  <div className="premium-student-submission-info">

                    <div>
                      <span>{tr("Submitted")}</span>
                      <strong>
                        {
                          formatDateTime(
                            submission
                              .submitted_at
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>{tr("Status")}</span>
                      <strong>
                        {
                          translateStatus(
                            submission
                              .status
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>{tr("Grade")}</span>
                      <strong>
                        {
                          submission.grade !==
                            null &&
                          submission.grade !==
                            undefined
                            ? `${submission.grade} / ${maxMarks}`
                            : t(
                                "student.noGrade"
                              )
                        }
                      </strong>
                    </div>

                  </div>


                  <div className="premium-student-submission-actions">

                    {fileUrl ? (

                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink
                          size={15}
                        />
                        {
                          t(
                            "student.openFile"
                          )
                        }
                      </a>

                    ) : (

                      <span>{tr("No file")}</span>

                    )}


                    {
                      submission.status ===
                        "Graded" &&
                      submission.grade !==
                        null && (

                        <div className="premium-grade-pill">
                          <Award
                            size={14}
                          />
                          {
                            maxMarks > 0
                              ? `${Math.round(
                                  (
                                    Number(
                                      submission
                                        .grade
                                    ) /
                                    maxMarks
                                  ) *
                                  100
                                )}%`
                              : submission
                                  .grade
                          }
                        </div>

                      )
                    }

                  </div>

                </article>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}


export default MySubmissions;
