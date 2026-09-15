import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  CircleHelp,
  Clock3,
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


const formatDuration = (seconds) => {
  const value = Number(seconds) || 0;
  const minutes = Math.floor(value / 60);
  const secs = value % 60;

  return `${minutes}m ${secs}s`;
};


function AssessmentResult() {
  const { attemptId } =
    useParams();

  const navigate =
    useNavigate();

  const { t } =
    useLanguage();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/my/assessment-attempts/${attemptId}/result`
          );

        setData(response.data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          t("finalUi.assessment.resultUnavailable")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, t]);


  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <span className="ev-loading-orbit" />
        <p>{t("finalUi.assessment.loadingResult")}</p>
      </div>
    );
  }


  if (error || !data) {
    return (
      <div className="premium-exam-fatal">
        <CircleHelp size={36} />
        <h2>{t("finalUi.assessment.resultUnavailable")}</h2>
        <p>{error || t("finalUi.assessment.noResult")}</p>
        <button type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          {t("common.back")}
        </button>
      </div>
    );
  }


  const attempt = data.attempt || {};
  const review = data.review || [];
  const pendingManual =
    data.grading_status === "pending_manual";


  const answerLabel = (item) =>
    item.student_answer?.selected_option_text ||
    item.student_answer?.answer_text ||
    t("finalUi.assessment.noAnswer");


  const correctLabel = (item) =>
    item.correct_answer?.option_text ||
    item.correct_answer?.answer_text ||
    "";


  return (
    <div className="premium-result-page">
      <div
        className={
          pendingManual
            ? "premium-result-hero pending"
            : attempt.passed
              ? "premium-result-hero passed"
              : "premium-result-hero failed"
        }
      >
        <button
          type="button"
          className="premium-result-back"
          onClick={() => navigate("/student/assessments")}
        >
          <ArrowLeft size={16} />
          {t("finalUi.assessment.backToAssessments")}
        </button>

        <div className="premium-result-seal">
          {pendingManual
            ? <Clock3 size={31} />
            : attempt.passed
              ? <Award size={31} />
              : <XCircle size={31} />}
        </div>

        <span>{t("finalUi.assessment.resultLabel")}</span>
        <strong className="premium-result-percentage">
          {attempt.percentage ?? 0}%
        </strong>

        <h1>
          {pendingManual
            ? t("finalUi.assessment.manualPending")
            : attempt.passed
              ? t("finalUi.assessment.passedTitle")
              : t("finalUi.assessment.failedTitle")}
        </h1>

        <p>
          {pendingManual
            ? t("finalUi.assessment.manualPendingDescription")
            : attempt.passed
              ? t("finalUi.assessment.passedDescription")
              : t("finalUi.assessment.failedDescription")}
        </p>
      </div>


      <div className="premium-result-stats">
        <article>
          <span>{t("finalUi.assessment.score")}</span>
          <strong>{attempt.score ?? 0} / {attempt.max_score ?? 0}</strong>
        </article>

        <article>
          <span>{t("finalUi.assessment.attempt")}</span>
          <strong>#{attempt.attempt_number || 1}</strong>
        </article>

        <article>
          <span>{t("finalUi.assessment.duration")}</span>
          <strong>{formatDuration(attempt.duration_seconds)}</strong>
        </article>

        <article>
          <span>{t("finalUi.assessment.grading")}</span>
          <strong>
            {pendingManual
              ? t("finalUi.assessment.pending")
              : t("finalUi.assessment.completed")}
          </strong>
        </article>
      </div>


      <section className="premium-result-review">
        <div className="premium-result-review-head">
          <div>
            <span>{t("finalUi.assessment.review")}</span>
            <h2>{t("finalUi.assessment.questionReview")}</h2>
            <p>
              {data.show_answers
                ? t("finalUi.assessment.showAnswersDescription")
                : t("finalUi.assessment.hiddenAnswersDescription")}
            </p>
          </div>
        </div>

        {review.length === 0 ? (
          <div className="premium-result-empty">
            {t("finalUi.assessment.noReview")}
          </div>
        ) : (
          <div className="premium-result-list">
            {review.map((item, index) => (
              <article
                key={item.question_id}
                className={
                  item.requires_manual_grading
                    ? "manual"
                    : item.is_correct
                      ? "correct"
                      : "wrong"
                }
              >
                <div className="premium-result-question-head">
                  <div>
                    <span>
                      {t("finalUi.assessment.questions")} {index + 1}
                      {" • "}{item.type}
                    </span>
                    <h3>{item.question_text}</h3>
                  </div>

                  <div className="premium-result-points">
                    {item.requires_manual_grading
                      ? <Clock3 size={16} />
                      : item.is_correct
                        ? <CheckCircle2 size={16} />
                        : <XCircle size={16} />}
                    {item.awarded_points ?? 0}/{item.points ?? 0}
                  </div>
                </div>

                <div className="premium-result-answer-grid">
                  <div>
                    <span>{t("finalUi.assessment.yourAnswer")}</span>
                    <strong>{answerLabel(item)}</strong>
                  </div>

                  {data.show_answers && correctLabel(item) && (
                    <div>
                      <span>{t("finalUi.assessment.correctAnswer")}</span>
                      <strong>{correctLabel(item)}</strong>
                    </div>
                  )}
                </div>

                {item.explanation && (
                  <div className="premium-result-explanation">
                    {item.explanation}
                  </div>
                )}

                {item.requires_manual_grading && (
                  <div className="premium-result-manual-note">
                    {t("finalUi.assessment.manualNote")}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


export default AssessmentResult;
