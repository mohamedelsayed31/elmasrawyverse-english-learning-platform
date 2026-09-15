import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  History,
  Play,
  Search,
  Target,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function StudentAssessments() {
  const navigate =
    useNavigate();

  const { t } =
    useLanguage();

  const [assessments, setAssessments] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get("/my/assessments");

        setAssessments(
          response.data.assessments || []
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
          t("finalUi.assessment.loadAssessmentsError")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [t]);


  const filtered = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return assessments.filter(
      (assessment) => {
        const matchesSearch =
          !term ||
          [
            assessment.title,
            assessment.course?.title,
            assessment.section?.title,
            assessment.type,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term);

        const matchesType =
          typeFilter === "all" ||
          assessment.type === typeFilter;

        return matchesSearch && matchesType;
      }
    );
  }, [assessments, search, typeFilter]);


  const attemptsCount =
    assessments.reduce(
      (total, item) =>
        total +
        Number(item.my_attempts_count || 0),
      0
    );


  const typeLabel = (type) => {
    const key =
      `finalUi.assessment.${type}`;

    const translated = t(key);

    return translated === key
      ? type || t("finalUi.assessment.assessment")
      : translated;
  };


  const startAssessment = async (assessment) => {
    try {
      setStartingId(assessment.id);
      setError("");

      const response =
        await api.post(
          `/my/assessments/${assessment.id}/start`
        );

      navigate(
        `/student/assessment-attempts/${response.data.attempt.id}`
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
        t("finalUi.assessment.startError")
      );
    } finally {
      setStartingId(null);
    }
  };


  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <span className="ev-loading-orbit" />
        <p>{t("finalUi.assessment.loadingAssessments")}</p>
      </div>
    );
  }


  return (
    <div className="premium-student-work-page">
      <div className="premium-student-work-header">
        <div>
          <span>{t("finalUi.assessment.label")}</span>
          <h1>{t("finalUi.assessment.myAssessments")}</h1>
          <p>{t("finalUi.assessment.description")}</p>
        </div>

        <div className="premium-student-work-summary">
          <div>
            <strong>{assessments.length}</strong>
            <span>{t("finalUi.assessment.available")}</span>
          </div>

          <div>
            <strong>{attemptsCount}</strong>
            <span>{t("finalUi.assessment.attempts")}</span>
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("finalUi.assessment.search")}
          />
        </div>

        <select
          className="premium-student-type-filter"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">{t("finalUi.assessment.allTypes")}</option>
          <option value="practice">{t("finalUi.assessment.practice")}</option>
          <option value="quiz">{t("finalUi.assessment.quiz")}</option>
          <option value="homework">{t("finalUi.assessment.homework")}</option>
          <option value="exam">{t("finalUi.assessment.exam")}</option>
        </select>
      </div>


      {filtered.length === 0 ? (
        <div className="premium-student-work-empty">
          <ClipboardCheck size={34} />
          <h2>{t("finalUi.assessment.noAssessments")}</h2>
          <p>{t("finalUi.assessment.noAssessmentsDescription")}</p>
        </div>
      ) : (
        <div className="premium-student-assessment-grid">
          {filtered.map((assessment) => {
            const attemptsUsed =
              Number(assessment.my_attempts_count || 0);

            const maxAttempts =
              assessment.max_attempts;

            const limitReached =
              Boolean(maxAttempts) &&
              attemptsUsed >= Number(maxAttempts);

            return (
              <article
                className="premium-student-assessment-card"
                key={assessment.id}
              >
                <div className="premium-student-assessment-top">
                  <span className={`type ${assessment.type}`}>
                    {typeLabel(assessment.type)}
                  </span>

                  {assessment.is_required && (
                    <span className="required">
                      {t("finalUi.assessment.required")}
                    </span>
                  )}
                </div>

                <h2>{assessment.title}</h2>

                <div className="premium-student-work-course">
                  <BookOpen size={15} />
                  <span>{assessment.course?.title || "-"}</span>
                </div>

                <p className="premium-student-assessment-description">
                  {assessment.description || t("finalUi.assessment.description")}
                </p>

                <div className="premium-student-assessment-meta">
                  <div>
                    <ClipboardCheck size={16} />
                    <span>{t("finalUi.assessment.questions")}</span>
                    <strong>{assessment.questions_count || 0}</strong>
                  </div>

                  <div>
                    <Clock3 size={16} />
                    <span>{t("finalUi.assessment.duration")}</span>
                    <strong>
                      {assessment.duration_minutes
                        ? `${assessment.duration_minutes} ${t("finalUi.assessment.minutes")}`
                        : t("finalUi.assessment.unlimited")}
                    </strong>
                  </div>

                  <div>
                    <Target size={16} />
                    <span>{t("finalUi.assessment.pass")}</span>
                    <strong>{assessment.passing_score ?? "-"}%</strong>
                  </div>

                  <div>
                    <CheckCircle2 size={16} />
                    <span>{t("finalUi.assessment.attempts")}</span>
                    <strong>
                      {maxAttempts
                        ? `${attemptsUsed}/${maxAttempts}`
                        : `${attemptsUsed}/∞`}
                    </strong>
                  </div>
                </div>

                {assessment.section?.title && (
                  <div className="premium-assessment-section-label">
                    {assessment.section.title}
                  </div>
                )}

                <div className="premium-student-assessment-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      navigate(`/student/assessments/${assessment.id}/history`)
                    }
                  >
                    <History size={15} />
                    {t("finalUi.assessment.history")}
                  </button>

                  <button
                    type="button"
                    className="primary"
                    disabled={limitReached || startingId === assessment.id}
                    onClick={() => startAssessment(assessment)}
                  >
                    <Play size={15} />
                    {startingId === assessment.id
                      ? t("finalUi.assessment.starting")
                      : limitReached
                        ? t("finalUi.assessment.limitReached")
                        : attemptsUsed > 0
                          ? t("finalUi.assessment.startAgain")
                          : t("finalUi.assessment.start")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default StudentAssessments;
