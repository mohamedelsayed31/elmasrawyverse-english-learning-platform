import {
  useEffect,
  useState,
} from "react";

import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  UserRoundCheck,
  Users,
} from "lucide-react";

import api
  from "../../services/api";

import PageLoader
  from "../../components/PageLoader";

import {
  useLanguage,
} from "../../context/LanguageContext";


function AdminDashboard() {
  const {
    t,
    tr,
  } = useLanguage();


  const [
    statistics,
    setStatistics,
  ] = useState(null);

  const [
    recentStudents,
    setRecentStudents,
  ] = useState([]);

  const [
    recentSubmissions,
    setRecentSubmissions,
  ] = useState([]);

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

          const response =
            await api.get(
              "/dashboard"
            );


          setStatistics(
            response.data
              .statistics ||
            {}
          );


          setRecentStudents(
            response.data
              .recent_students ||
            []
          );


          setRecentSubmissions(
            response.data
              .recent_submissions ||
            []
          );

        } catch (error) {

          setError(
            error.response?.data
              ?.message ||
            t(
              "common.failedToLoad"
            )
          );

        } finally {

          setLoading(false);
        }
      };


    load();

  }, []);


  if (loading) {

    return (
      <PageLoader
        text={
          t("common.loading")
        }
      />
    );
  }


  if (error) {

    return (
      <div className="error-message">
        {error}
      </div>
    );
  }


  const primaryStats = [
    {
      label: tr("Students"),
      value:
        statistics?.students ?? 0,
      icon: Users,
    },
    {
      label: tr("Courses"),
      value:
        statistics?.courses ?? 0,
      icon: BookOpen,
    },
    {
      label: tr("Instructors"),
      value:
        statistics?.instructors ?? 0,
      icon: UserRoundCheck,
    },
    {
      label: tr("Published"),
      value:
        statistics
          ?.published_courses ?? 0,
      icon: GraduationCap,
    },
  ];


  const secondaryStats = [
    {
      label: tr("Pending"),
      value:
        statistics
          ?.pending_submissions ?? 0,
      icon: Clock3,
    },
    {
      label: tr("Graded"),
      value:
        statistics
          ?.graded_submissions ?? 0,
      icon: CheckCircle2,
    },
    {
      label: tr("Submissions"),
      value:
        statistics
          ?.submissions ?? 0,
      icon: FileCheck2,
    },
  ];


  return (
    <div className="premium-admin-dashboard">

      <div className="premium-page-heading">

        <div>

          <span className="premium-eyebrow">{tr("Overview")}</span>


          <h1>{tr("Dashboard")}</h1>


          <p>{tr("Everything important, without the clutter.")}</p>

        </div>


        <div className="premium-status-chip">
          <span />{tr("Platform online")}</div>

      </div>


      <div className="premium-primary-stats">

        {primaryStats.map(
          ({
            label,
            value,
            icon: Icon,
          }) => (

            <article
              className="premium-stat-card"
              key={label}
            >

              <div className="premium-stat-icon">
                <Icon size={19} />
              </div>


              <div>

                <span>
                  {label}
                </span>

                <strong>
                  {value}
                </strong>

              </div>


              <ArrowUpRight
                size={17}
                className="premium-stat-arrow"
              />

            </article>

          )
        )}

      </div>


      <div className="premium-admin-grid">

        <section className="premium-panel">

          <div className="premium-panel-heading">

            <div>
              <span>{tr("Latest")}</span>

              <h2>{tr("Recent Students")}</h2>
            </div>


            <Users size={18} />

          </div>


          {recentStudents.length ===
          0 ? (

            <div className="premium-empty">{tr("No recent students.")}</div>

          ) : (

            <div className="premium-list">

              {recentStudents.map(
                (student) => (

                  <div
                    className="premium-list-row"
                    key={
                      student.id
                    }
                  >

                    <div className="premium-list-avatar">
                      {
                        student.name
                          ?.charAt(0)
                          ?.toUpperCase()
                        || "S"
                      }
                    </div>


                    <div className="premium-list-main">

                      <strong>
                        {
                          student.name
                        }
                      </strong>

                      <span>
                        {
                          student.email
                        }
                      </span>

                    </div>


                    <span
                      className={
                        student.status ===
                        "Active"
                          ? "premium-state active"
                          : "premium-state"
                      }
                    >
                      {
                        student.status
                      }
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        <section className="premium-panel">

          <div className="premium-panel-heading">

            <div>
              <span>{tr("Activity")}</span>

              <h2>{tr("Recent Submissions")}</h2>
            </div>


            <FileCheck2 size={18} />

          </div>


          {recentSubmissions.length ===
          0 ? (

            <div className="premium-empty">{tr("No recent submissions.")}</div>

          ) : (

            <div className="premium-list">

              {recentSubmissions.map(
                (submission) => (

                  <div
                    className="premium-list-row"
                    key={
                      submission.id
                    }
                  >

                    <div className="premium-list-main">

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


                    <div className="premium-grade">

                      <span>
                        {
                          submission.status
                        }
                      </span>

                      <strong>
                        {
                          submission.grade
                            ?? "-"
                        }
                      </strong>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        <section className="premium-side-panel">

          <span className="premium-side-kicker">{tr("Activity snapshot")}</span>


          <h2>{tr("Today at a glance")}</h2>


          <div className="premium-mini-stats">

            {secondaryStats.map(
              ({
                label,
                value,
                icon: Icon,
              }) => (

                <div
                  key={label}
                  className="premium-mini-stat"
                >
                  <Icon size={16} />

                  <div>
                    <strong>
                      {value}
                    </strong>

                    <span>
                      {label}
                    </span>
                  </div>
                </div>

              )
            )}

          </div>

        </section>

      </div>

    </div>
  );
}


export default AdminDashboard;
