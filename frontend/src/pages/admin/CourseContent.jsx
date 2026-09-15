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
  

  
  
  function CourseContent() {
    const { tr } = useLanguage();

    const { courseId } = useParams();
  
    const navigate = useNavigate();
  
  
    const emptyForm = {
      title: "",
      description: "",
      status: "Draft",
      sort_order: "",
    };
  
  
    const [course, setCourse] =
      useState(null);
  
    const [sections, setSections] =
      useState([]);
  
    const [formData, setFormData] =
      useState(emptyForm);
  
    const [editingId, setEditingId] =
      useState(null);
  
    const [loading, setLoading] =
      useState(true);
  
    const [saving, setSaving] =
      useState(false);
  
    const [message, setMessage] =
      useState("");
  
    const [pageError, setPageError] =
      useState("");
  
    const [errors, setErrors] =
      useState({});
  
  
    // =====================================
    // Load Course + Sections
    // =====================================
  
    const fetchData = async () => {
      try {
  
        setLoading(true);
        setPageError("");
  
  
        const [
          courseResponse,
          sectionsResponse,
        ] = await Promise.all([
  
          api.get(
            `/courses/${courseId}`
          ),
  
          api.get(
            `/courses/${courseId}/sections`
          ),
  
        ]);
  
  
        setCourse(
          courseResponse.data.course
        );
  
  
        setSections(
          sectionsResponse.data.sections || []
        );
  
      } catch (error) {
  
        setPageError(
          error.response?.data?.message ||
          "Unable to load course content."
        );
  
      } finally {
  
        setLoading(false);
  
      }
    };
  
  
    useEffect(() => {
      fetchData();
    }, [courseId]);
  
  
    // =====================================
    // Form Change
    // =====================================
  
    const handleChange = (e) => {
  
      const {
        name,
        value,
      } = e.target;
  
  
      setFormData((current) => ({
        ...current,
        [name]: value,
      }));
  
    };
  
  
    // =====================================
    // Submit
    // =====================================
  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
  
      setSaving(true);
      setMessage("");
      setPageError("");
      setErrors({});
  
  
      try {
  
        const payload = {
          title:
            formData.title,
  
          description:
            formData.description || null,
  
          status:
            formData.status,
        };
  
  
        if (
          formData.sort_order !== ""
        ) {
  
          payload.sort_order =
            Number(formData.sort_order);
  
        }
  
  
        if (editingId) {
  
          await api.put(
            `/courses/${courseId}/sections/${editingId}`,
            payload
          );
  
  
          setMessage(
            "Section updated successfully."
          );
  
        } else {
  
          await api.post(
            `/courses/${courseId}/sections`,
            payload
          );
  
  
          setMessage(
            "Section added successfully."
          );
  
        }
  
  
        setEditingId(null);
  
        setFormData(emptyForm);
  
        await fetchData();
  
      } catch (error) {
  
        if (
          error.response?.status === 422
        ) {
  
          setErrors(
            error.response.data.errors || {}
          );
  
        } else {
  
          setPageError(
            error.response?.data?.message ||
            "Something went wrong."
          );
  
        }
  
      } finally {
  
        setSaving(false);
  
      }
    };
  
  
    // =====================================
    // Edit
    // =====================================
  
    const handleEdit = (section) => {
  
      setEditingId(section.id);
  
  
      setFormData({
        title:
          section.title || "",
  
        description:
          section.description || "",
  
        status:
          section.status || "Draft",
  
        sort_order:
          section.sort_order ?? "",
      });
  
  
      setMessage("");
      setPageError("");
      setErrors({});
  
  
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };
  
  
    // =====================================
    // Cancel Edit
    // =====================================
  
    const handleCancel = () => {
  
      setEditingId(null);
  
      setFormData(emptyForm);
  
      setErrors({});
    };
  
  
    // =====================================
    // Delete
    // =====================================
  
    const handleDelete = async (
      section
    ) => {
  
      const confirmed =
        window.confirm(
          `Delete "${section.title}"?`
        );
  
  
      if (!confirmed) return;
  
  
      try {
  
        setMessage("");
        setPageError("");
  
  
        await api.delete(
          `/courses/${courseId}/sections/${section.id}`
        );
  
  
        setMessage(
          "Section deleted successfully."
        );
  
  
        await fetchData();
  
      } catch (error) {
  
        setPageError(
          error.response?.data?.message ||
          "Unable to delete section."
        );
  
      }
    };
  
  
    // =====================================
    // Loading
    // =====================================
  
    if (loading) {
  
      return (
        <div className="admin-card">{tr("Loading course content...")}</div>
      );
  
    }
  
  
    return (
      <div>
  
        {/* Header */}
  
        <div className="page-header">
  
          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate("/admin/courses")
            }
          >{tr("\u2190 Back to Courses")}</button>
  
  
          <div
            style={{
              marginTop: "18px",
            }}
          >
  
            <h1>{tr("Manage Content")}</h1>
  
            <p>
              {course?.title}
            </p>
  
          </div>
  
        </div>
  
  
        {/* Academic Information */}
  
        {course && (
  
          <div className="course-content-info">
  
            <div>
  
              <span>{tr("Stage")}</span>
  
              <strong>
                {
                  course.grade
                    ?.academic_stage
                    ?.name || "-"
                }
              </strong>
  
            </div>
  
  
            <div>
  
              <span>{tr("Grade")}</span>
  
              <strong>
                {
                  course.grade
                    ?.name || "-"
                }
              </strong>
  
            </div>
  
  
            <div>
  
              <span>{tr("Sections")}</span>
  
              <strong>
                {sections.length}
              </strong>
  
            </div>
  
  
            <div>
  
              <span>{tr("Course Status")}</span>
  
              <strong>
                {course.status}
              </strong>
  
            </div>
  
          </div>
  
        )}
  
  
        {/* Messages */}
  
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
  
  
        {/* =================================
            Add / Edit Section
        ================================= */}
  
        <div className="admin-card">
  
          <div className="content-builder-heading">
  
            <div>
  
              <h2>
                {editingId
                  ? "Edit Section"
                  : "Add New Section"}
              </h2>
  
              <p>{tr("The title is completely flexible. You can write Unit, Chapter, Revision, Story, Exams or anything you want.")}</p>
  
            </div>
  
          </div>
  
  
          <form
            className="admin-form"
            onSubmit={handleSubmit}
          >
  
            <div className="form-grid">
  
              {/* Title */}
  
              <div className="form-group">
  
                <label>{tr("Section Title")}</label>
  
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={tr("Example: Unit 1, The Story, Final Revision...")}
                />
  
                {errors.title && (
  
                  <span className="field-error">
                    {errors.title[0]}
                  </span>
  
                )}
  
              </div>
  
  
              {/* Status */}
  
              <div className="form-group">
  
                <label>{tr("Status")}</label>
  
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
  
                  <option value="Draft">{tr("Draft")}</option>
  
                  <option value="Published">{tr("Published")}</option>
  
                </select>
  
                {errors.status && (
  
                  <span className="field-error">
                    {errors.status[0]}
                  </span>
  
                )}
  
              </div>
  
  
              {/* Sort Order */}
  
              <div className="form-group">
  
                <label>{tr("Order")}</label>
  
                <input
                  type="number"
                  name="sort_order"
                  min="0"
                  value={
                    formData.sort_order
                  }
                  onChange={handleChange}
                  placeholder={tr("Automatic")}
                />
  
                <small>{tr("Leave empty to add it automatically at the end.")}</small>
  
              </div>
  
  
              {/* Description */}
  
              <div className="form-group content-description-field">
  
                <label>{tr("Description")}</label>
  
                <textarea
                  name="description"
                  rows="4"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder={tr("Optional description...")}
                />
  
                {errors.description && (
  
                  <span className="field-error">
                    {errors.description[0]}
                  </span>
  
                )}
  
              </div>
  
            </div>
  
  
            <div className="form-actions">
  
              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Section"
                    : "+ Add Section"}
              </button>
  
  
              {editingId && (
  
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    handleCancel
                  }
                >{tr("Cancel")}</button>
  
              )}
  
            </div>
  
          </form>
  
        </div>
  
  
        {/* =================================
            Existing Sections
        ================================= */}
  
        <div className="admin-card">
  
          <div className="content-builder-heading">
  
            <div>
  
              <h2>{tr("Course Sections")}</h2>
  
              <p>{tr("These are the main content groups students will see.")}</p>
  
            </div>
  
  
            <span className="section-count">
              {sections.length}
            </span>
  
          </div>
  
  
          {sections.length === 0 ? (
  
            <div className="content-empty-state">
  
              <h3>{tr("No content yet")}</h3>
  
              <p>{tr("Add the first section to start building this course.")}</p>
  
            </div>
  
          ) : (
  
            <div className="sections-list">
  
              {sections.map(
                (section, index) => (
  
                  <div
                    className="section-admin-item"
                    key={section.id}
                  >
  
                    <div className="section-order">
  
                      {String(
                        index + 1
                      ).padStart(2, "0")}
  
                    </div>
  
  
                    <div className="section-main">
  
                      <div className="section-title-row">
  
                        <h3>
                          {section.title}
                        </h3>
  
  
                        <span
                          className={
                            section.status ===
                            "Published"
                              ? "content-status published"
                              : "content-status draft"
                          }
                        >
                          {section.status}
                        </span>
  
                      </div>
  
  
                      {section.description && (
  
                        <p>
                          {section.description}
                        </p>
  
                      )}
  
  
                      <small>
                        Order:{" "}
                        {section.sort_order}
                      </small>
  
                    </div>
  
  
                    <div className="section-actions">

                      <button
                        type="button"
                        className="content-btn"
                        onClick={() =>
                            navigate(
                            `/admin/courses/${courseId}/sections/${section.id}/content`
                            )
                        }
                      >{tr("Manage Content")}</button>
  
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(section)
                        }
                      >{tr("Edit")}</button>
  
  
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(
                            section
                          )
                        }
                      >{tr("Delete")}</button>
  
                    </div>
  
                  </div>
  
                )
              )}
  
            </div>
  
          )}
  
        </div>
  
      </div>
    );
  }
  
  
  export default CourseContent;