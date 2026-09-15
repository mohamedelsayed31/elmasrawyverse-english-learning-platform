import {
    useEffect,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import api from "../../services/api";
  import {
    useLanguage,
  } from "../../context/LanguageContext";
  

  
  
  function AssessmentAttemptReview() {
    const { tr } = useLanguage();

    const { attemptId } =
      useParams();
  
    const navigate = useNavigate();
  
    const [attempt, setAttempt] =
      useState(null);
  
    const [review, setReview] =
      useState([]);
  
    const [grading, setGrading] =
      useState({});
  
    const [loading, setLoading] =
      useState(true);
  
    const [savingId, setSavingId] =
      useState(null);
  
    const [message, setMessage] =
      useState("");
  
    const [error, setError] =
      useState("");
  
  
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        setError("");
  
        const response = await api.get(
          `/assessment-attempts/${attemptId}`
        );
  
        setAttempt(
          response.data.attempt
        );
  
        setReview(
          response.data.review || []
        );
  
  
        const initial = {};
  
        (
          response.data.review || []
        ).forEach((item) => {
  
          if (item.answer) {
            initial[item.answer.id] = {
              awarded_points:
                item.answer
                  .awarded_points ?? 0,
  
              teacher_feedback:
                item.answer
                  .teacher_feedback || "",
            };
          }
  
        });
  
  
        setGrading(initial);
  
      } catch (error) {
  
        setError(
          error.response?.data?.message ||
          "Unable to load attempt."
        );
  
      } finally {
        setLoading(false);
      }
    };
  
  
    useEffect(() => {
      fetchAttempt();
    }, [attemptId]);
  
  
    const updateGrading = (
      answerId,
      field,
      value
    ) => {
  
      setGrading((current) => ({
        ...current,
  
        [answerId]: {
          ...current[answerId],
          [field]: value,
        },
      }));
    };
  
  
    const saveGrade = async (
      item
    ) => {
      if (!item.answer) {
        return;
      }
  
      const answerId =
        item.answer.id;
  
      const values =
        grading[answerId];
  
  
      try {
        setSavingId(answerId);
        setMessage("");
        setError("");
  
  
        await api.put(
          `/assessment-attempts/${attemptId}/answers/${answerId}/grade`,
          {
            awarded_points:
              Number(
                values.awarded_points
              ),
  
            teacher_feedback:
              values.teacher_feedback || null,
          }
        );
  
  
        setMessage(
          "Grade saved successfully."
        );
  
  
        await fetchAttempt();
  
      } catch (error) {
  
        setError(
          error.response?.data
            ?.errors
            ?.awarded_points?.[0]
          ||
          error.response?.data?.message
          ||
          "Unable to save grade."
        );
  
      } finally {
        setSavingId(null);
      }
    };
  
  
    if (loading) {
      return (
        <div className="admin-card">{tr("Loading attempt...")}</div>
      );
    }
  
  
    return (
      <div>
  
        <div className="page-header">
  
          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate(
                "/admin/assessment-results"
              )
            }
          >{tr("\u2190 Back to Results")}</button>
  
  
          <div style={{ marginTop: 18 }}>
  
            <h1>{tr("Review Attempt")}</h1>
  
            <p>
              {
                attempt?.assessment
                  ?.title
              }
            </p>
  
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
  
  
        <div className="assessment-question-summary">
  
          <div>
            <span>{tr("Student")}</span>
  
            <strong>
              {
                attempt?.student
                  ?.name || "-"
              }
            </strong>
          </div>
  
  
          <div>
            <span>{tr("Score")}</span>
  
            <strong>
              {
                attempt?.score ?? 0
              }
              /
              {
                attempt?.max_score ?? 0
              }
            </strong>
          </div>
  
  
          <div>
            <span>{tr("Percentage")}</span>
  
            <strong>
              {
                attempt?.percentage ?? 0
              }%
            </strong>
          </div>
  
        </div>
  
  
        <div className="admin-card">
  
          <h2>{tr("Answers")}</h2>
  
  
          <div className="teacher-review-list">
  
            {review.map(
              (item, index) => {
  
                const answer =
                  item.answer;
  
                const manual =
                  answer
                    ?.requires_manual_grading;
  
  
                return (
  
                  <div
                    key={item.question_id}
                    className="teacher-review-card"
                  >
  
                    <div className="result-review-header">
  
                      <span>
                        Question {index + 1}
                      </span>
  
  
                      <span className="item-type-badge">
                        {item.type}
                      </span>
  
                    </div>
  
  
                    <h3>
                      {
                        item.question_text
                      }
                    </h3>
  
  
                    <p>
                      <strong>{tr("Student Answer:")}</strong>{" "}
  
                      {
                        answer
                          ?.selected_option_text
                        ||
                        answer
                          ?.answer_text
                        ||
                        "No answer"
                      }
                    </p>
  
  
                    <p>
                      <strong>{tr("Maximum:")}</strong>{" "}
  
                      {
                        item
                          .possible_points
                      }{" "}
                      points
                    </p>
  
  
                    {manual ? (
  
                      <div className="manual-grading-box">
  
                        <div className="form-group">
  
                          <label>{tr("Awarded Points")}</label>
  
                          <input
                            type="number"
                            min="0"
                            max={
                              item
                                .possible_points
                            }
                            step="0.01"
                            value={
                              grading[
                                answer.id
                              ]
                                ?.awarded_points
                                ?? 0
                            }
                            onChange={(e) =>
                              updateGrading(
                                answer.id,
                                "awarded_points",
                                e.target.value
                              )
                            }
                          />
  
                        </div>
  
  
                        <div className="form-group">
  
                          <label>{tr("Teacher Feedback")}</label>
  
                          <textarea
                            rows="4"
                            value={
                              grading[
                                answer.id
                              ]
                                ?.teacher_feedback
                                || ""
                            }
                            onChange={(e) =>
                              updateGrading(
                                answer.id,
                                "teacher_feedback",
                                e.target.value
                              )
                            }
                            placeholder={tr("Write feedback for the student...")}
                          />
  
                        </div>
  
  
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={
                            savingId ===
                            answer.id
                          }
                          onClick={() =>
                            saveGrade(item)
                          }
                        >
                          {
                            savingId ===
                            answer.id
                              ? "Saving..."
                              : "Save Grade"
                          }
                        </button>
  
                      </div>
  
                    ) : (
  
                      <div className="auto-grade-summary">
  
                        <span>
                          {
                            answer
                              ?.is_correct === true
                              ? "Correct"
                              : answer
                                ?.is_correct === false
                                ? "Incorrect"
                                : "Partially Graded"
                          }
                        </span>
  
  
                        <strong>
                          {
                            answer
                              ?.awarded_points
                              ?? 0
                          }
                          /
                          {
                            item
                              .possible_points
                          }
                        </strong>
  
                      </div>
  
                    )}
  
                  </div>
  
                );
              }
            )}
  
          </div>
  
        </div>
  
      </div>
    );
  }
  
  
  export default AssessmentAttemptReview;