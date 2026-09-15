import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Save,
  Send,
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


const formatTime = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};


function TakeAssessment() {
  const { attemptId } =
    useParams();

  const navigate =
    useNavigate();

  const { t } =
    useLanguage();

  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [savingQuestion, setSavingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const resultPath =
    `/student/assessment-attempts/${attemptId}/result`;


  const loadAttempt = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/my/assessment-attempts/${attemptId}`
        );

      const payload = response.data;

      setData(payload);
      setRemainingSeconds(
        payload.attempt?.remaining_seconds ?? null
      );

      const initial = {};

      (payload.questions || []).forEach((question) => {
        initial[question.id] = {
          selected_option_id:
            question.saved_answer?.selected_option_id ?? null,
          answer_text:
            question.saved_answer?.answer_text ?? "",
        };
      });

      setAnswers(initial);
    } catch (error) {
      const status =
        error.response?.status;

      const attemptStatus =
        error.response?.data?.status;

      if (
        status === 409 &&
        ["expired", "submitted", "graded", "completed"].includes(attemptStatus)
      ) {
        navigate(resultPath, { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
        t("finalUi.assessment.loadAttemptError")
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAttempt();
  }, [attemptId]);


  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) {
          return current;
        }

        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [data?.attempt?.id]);


  useEffect(() => {
    if (remainingSeconds !== 0 || !data) {
      return;
    }

    const submitExpiredAttempt = async () => {
      try {
        await api.post(
          `/my/assessment-attempts/${attemptId}/submit`
        );
      } catch {
        // The result endpoint remains the source of truth
        // when the backend has already closed the attempt.
      }

      navigate(resultPath, { replace: true });
    };

    submitExpiredAttempt();
  }, [remainingSeconds, data, attemptId, navigate, resultPath]);


  const questions =
    data?.questions || [];

  const attempt =
    data?.attempt || {};

  const assessment =
    data?.assessment || {};


  const answeredCount = useMemo(
    () =>
      questions.filter((question) => {
        const answer = answers[question.id] || {};

        return (
          answer.selected_option_id !== null &&
          answer.selected_option_id !== undefined
        ) || String(answer.answer_text || "").trim() !== "";
      }).length,
    [answers, questions]
  );


  const updateAnswer = (questionId, patch) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] || {}),
        ...patch,
      },
    }));
  };


  const payloadFor = (question) => {
    const answer =
      answers[question.id] || {};

    if (question.type === "mcq") {
      return {
        selected_option_id:
          Number(answer.selected_option_id),
      };
    }

    return {
      answer_text:
        String(answer.answer_text || ""),
    };
  };


  const saveQuestion = async (question, overridePayload = null) => {
    try {
      setSavingQuestion(question.id);
      setError("");

      await api.put(
        `/my/assessment-attempts/${attemptId}/answers/${question.id}`,
        overridePayload || payloadFor(question)
      );
    } catch (error) {
      const validation =
        error.response?.data?.errors;

      setError(
        validation
          ? Object.values(validation).flat().join(" ")
          : error.response?.data?.message ||
            t("finalUi.assessment.saveAnswerError")
      );
    } finally {
      setSavingQuestion(null);
    }
  };


  const chooseMcq = (question, optionId) => {
    updateAnswer(question.id, {
      selected_option_id: optionId,
    });

    saveQuestion(question, {
      selected_option_id: Number(optionId),
    });
  };


  const chooseTrueFalse = (question, value) => {
    updateAnswer(question.id, {
      answer_text: value,
    });

    saveQuestion(question, {
      answer_text: value,
    });
  };


  const handleSubmit = async () => {
    if (!window.confirm(t("finalUi.assessment.submitConfirm"))) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post(
        `/my/assessment-attempts/${attemptId}/submit`
      );

      navigate(resultPath, { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message ||
        t("finalUi.assessment.submitError")
      );
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <span className="ev-loading-orbit" />
        <p>{t("finalUi.assessment.loadingAttempt")}</p>
      </div>
    );
  }


  if (error && !data) {
    return (
      <div className="premium-exam-fatal">
        <AlertTriangle size={36} />
        <h2>{t("finalUi.assessment.unavailable")}</h2>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => navigate("/student/assessments")}
        >
          <ArrowLeft size={16} />
          {t("finalUi.assessment.backToAssessments")}
        </button>
      </div>
    );
  }


  return (
    <div className="premium-exam-page">
      <header className="premium-exam-header">
        <button
          type="button"
          className="premium-exam-back"
          onClick={() => navigate("/student/assessments")}
        >
          <ArrowLeft size={16} />
          {t("finalUi.assessment.backToAssessments")}
        </button>

        <div className="premium-exam-title">
          <span>
            {assessment.type || t("finalUi.assessment.assessment")}
            {" • "}
            {t("finalUi.assessment.attempt")} {attempt.attempt_number || 1}
          </span>

          <h1>{assessment.title}</h1>

          {assessment.description && (
            <p>{assessment.description}</p>
          )}
        </div>

        <div
          className={
            remainingSeconds !== null && remainingSeconds <= 300
              ? "premium-exam-timer danger"
              : "premium-exam-timer"
          }
        >
          <Clock3 size={17} />
          <div>
            <span>{t("finalUi.assessment.timeRemaining")}</span>
            <strong>
              {remainingSeconds === null
                ? t("finalUi.assessment.unlimited")
                : formatTime(remainingSeconds)}
            </strong>
          </div>
        </div>
      </header>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="premium-exam-progress-card">
        <div>
          <strong>{answeredCount}</strong>
          <span>{t("finalUi.assessment.answered")}</span>
        </div>

        <div>
          <strong>{questions.length}</strong>
          <span>{t("finalUi.assessment.totalQuestions")}</span>
        </div>

        <div>
          <strong>{assessment.passing_score ?? "-"}%</strong>
          <span>{t("finalUi.assessment.passMark")}</span>
        </div>

        <div>
          <strong>{attempt.max_score ?? "-"}</strong>
          <span>{t("finalUi.assessment.totalPoints")}</span>
        </div>
      </div>


      <div className="premium-exam-questions">
        {questions.map((question, index) => {
          const answer =
            answers[question.id] || {};

          return (
            <article
              className="premium-exam-question"
              key={question.id}
            >
              <div className="premium-exam-question-head">
                <div className="premium-exam-number">
                  {index + 1}
                </div>

                <div>
                  <div className="premium-exam-question-meta">
                    <span>{question.type}</span>
                    {question.skill && <span>{question.skill}</span>}
                    {question.topic && <span>{question.topic}</span>}
                  </div>

                  <h2>{question.question_text}</h2>
                </div>

                <strong className="premium-exam-points">
                  {question.points ?? 0} pts
                </strong>
              </div>


              {question.type === "mcq" ? (
                <div className="premium-exam-options">
                  {(question.options || []).map((option, optionIndex) => {
                    const selected =
                      Number(answer.selected_option_id) === Number(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={selected ? "selected" : ""}
                        onClick={() => chooseMcq(question, option.id)}
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                        <strong>{option.option_text}</strong>
                        {selected && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              ) : question.type === "true_false" ? (
                <div className="premium-true-false">
                  {[
                    ["true", t("finalUi.assessment.true")],
                    ["false", t("finalUi.assessment.false")],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={answer.answer_text === value ? "selected" : ""}
                      onClick={() => chooseTrueFalse(question, value)}
                    >
                      {answer.answer_text === value && <CheckCircle2 size={16} />}
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="premium-text-answer">
                  {question.type === "short_answer" ? (
                    <textarea
                      rows="5"
                      value={answer.answer_text || ""}
                      onChange={(event) =>
                        updateAnswer(question.id, {
                          answer_text: event.target.value,
                        })
                      }
                      placeholder={t("finalUi.assessment.writeAnswer")}
                    />
                  ) : (
                    <input
                      type="text"
                      value={answer.answer_text || ""}
                      onChange={(event) =>
                        updateAnswer(question.id, {
                          answer_text: event.target.value,
                        })
                      }
                      placeholder={t("finalUi.assessment.typeAnswer")}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => saveQuestion(question)}
                    disabled={savingQuestion === question.id}
                  >
                    <Save size={15} />
                    {savingQuestion === question.id
                      ? t("finalUi.assessment.saving")
                      : t("finalUi.assessment.saveAnswer")}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>


      <div className="premium-exam-submit">
        <div>
          <FileText size={18} />
          <div>
            <strong>{t("finalUi.assessment.readySubmit")}</strong>
            <span>
              {answeredCount} / {questions.length} {t("finalUi.assessment.answered")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Send size={16} />
          {submitting
            ? t("finalUi.assessment.submitting")
            : t("finalUi.assessment.submitAssessment")}
        </button>
      </div>
    </div>
  );
}


export default TakeAssessment;
