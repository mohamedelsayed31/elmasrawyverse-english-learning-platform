import {
    useEffect,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import api from "../services/api";
  
  
  function GradeSelector() {
    const navigate = useNavigate();
  
    const [stages, setStages] =
      useState([]);
  
    const [loading, setLoading] =
      useState(true);
  
    const [error, setError] =
      useState("");
  
  
    useEffect(() => {
  
      const fetchStructure = async () => {
  
        try {
  
          setLoading(true);
          setError("");
  
          const response = await api.get(
            "/public/academic-structure"
          );
  
          setStages(
            response.data.stages || []
          );
  
        } catch (error) {
  
          console.error(error);
  
          setError(
            "Unable to load grades."
          );
  
        } finally {
  
          setLoading(false);
  
        }
      };
  
  
      fetchStructure();
  
    }, []);
  
  
    const handleGradeClick = (
      grade,
      stage
    ) => {
  
      const params =
        new URLSearchParams({
          grade_id: grade.id,
          grade: grade.name,
          stage: stage.name,
        });
  
  
      navigate(
        `/courses?${params.toString()}`
      );
    };
  
  
    return (
      <section className="grade-selector-section">
  
        <div className="grade-selector-heading">
  
          <span>
            Start Learning
          </span>
  
          <h2>
            Choose Your Grade
          </h2>
  
          <p>
            Select your school stage and grade
            to see the courses available for you.
          </p>
  
        </div>
  
  
        {loading ? (
  
          <div className="grade-selector-message">
            Loading grades...
          </div>
  
        ) : error ? (
  
          <div className="grade-selector-message error">
            {error}
          </div>
  
        ) : (
  
          <div className="academic-stages-grid">
  
            {stages.map((stage) => (
  
              <div
                className="academic-stage-card"
                key={stage.id}
              >
  
                <div className="stage-card-header">
  
                  <span className="stage-number">
                    {String(
                      stage.sort_order
                    ).padStart(2, "0")}
                  </span>
  
                  <div>
  
                    <h3>
                      {stage.name}
                    </h3>
  
                    <p>
                      Choose your grade
                    </p>
  
                  </div>
  
                </div>
  
  
                <div className="grade-buttons">
  
                  {stage.grades?.map(
                    (grade) => (
  
                      <button
                        key={grade.id}
                        type="button"
                        className="grade-button"
                        onClick={() =>
                          handleGradeClick(
                            grade,
                            stage
                          )
                        }
                      >
                        {grade.name}
  
                        <span>
                          →
                        </span>
  
                      </button>
  
                    )
                  )}
  
                </div>
  
              </div>
  
            ))}
  
          </div>
  
        )}
  
      </section>
    );
  }
  
  
  export default GradeSelector;