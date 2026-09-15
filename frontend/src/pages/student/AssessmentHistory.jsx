import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Search,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function AssessmentHistory() {
  const { assessmentId } =
    useParams();

  const navigate =
    useNavigate();

  const { t, language } =
    useLanguage();

  const [attempts, setAttempts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/my/assessments/${assessmentId}/history`
          );

        setAttempts(response.data.attempts || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          t("finalUi.assessment.historyError")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [assessmentId, t]);


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return attempts;
    }

    return attempts.filter((attempt) =>
      [
        attempt.status,
        attempt.attempt_number,
        attempt.percentage,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [attempts, search]);


  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString(
      language === "ar" ? "ar-EG" : "en-US"
    );
  };


  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <span className="ev-loading-orbit" />
        <p>{t("finalUi.assessment.loadingHistory")}</p>
      </div>
    );
  }


  return (
    <div className="premium-history-page">
      <div className="premium-history-header">
        <button type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          {t("common.back")}
        </button>

        <div>
          <span>{t("finalUi.assessment.assessment")}</span>
          <h1>{t("finalUi.assessment.attemptHistory")}</h1>
          <p>{t("finalUi.assessment.historyDescription")}</p>
        </div>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="premium-history-toolbar">
        <div>
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("finalUi.assessment.searchAttempts")}
          />
        </div>

        <span>
          {filtered.length} {t("finalUi.assessment.attempts")}
        </span>
      </div>


      {filtered.length === 0 ? (
        <div className="premium-history-empty">
          <History size={34} />
          <h2>{t("finalUi.assessment.noAttempts")}</h2>
          <p>{t("finalUi.assessment.noAttemptsDescription")}</p>
        </div>
      ) : (
        <div className="premium-history-list">
          {filtered.map((attempt) => (
            <article key={attempt.id}>
              <div
                className={
                  attempt.passed
                    ? "premium-history-state passed"
                    : attempt.status === "in_progress"
                      ? "premium-history-state pending"
                      : "premium-history-state failed"
                }
              >
                {attempt.status === "in_progress"
                  ? <Clock3 size={19} />
                  : attempt.passed
                    ? <CheckCircle2 size={19} />
                    : <XCircle size={19} />}
              </div>

              <div className="premium-history-main">
                <span>
                  {t("finalUi.assessment.attempt")} #{attempt.attempt_number}
                </span>
                <strong>{attempt.status}</strong>
                <small>
                  {formatDate(attempt.submitted_at || attempt.started_at)}
                </small>
              </div>

              <div className="premium-history-score">
                <span>{t("finalUi.assessment.score")}</span>
                <strong>{attempt.percentage ?? 0}%</strong>
                <small>{attempt.score ?? 0}/{attempt.max_score ?? 0}</small>
              </div>

              <div className="premium-history-duration">
                <span>{t("finalUi.assessment.duration")}</span>
                <strong>
                  {Math.round((Number(attempt.duration_seconds) || 0) / 60)} {t("finalUi.assessment.minutes")}
                </strong>
              </div>

              {attempt.status !== "in_progress" && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/student/assessment-attempts/${attempt.id}/result`)
                  }
                >
                  {t("finalUi.assessment.viewResult")}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


export default AssessmentHistory;
