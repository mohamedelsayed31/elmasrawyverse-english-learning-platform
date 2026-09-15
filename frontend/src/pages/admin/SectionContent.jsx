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
  

  
  
  function SectionContent() {
    const { tr } = useLanguage();

    const {
      courseId,
      sectionId,
    } = useParams();
  
    const navigate = useNavigate();
  
  
    const emptyForm = {
      title: "",
      type: "video",
      description: "",
      content: "",
      resource_url: "",
      file: null,
      sort_order: "",
      status: "Draft",
      is_preview: false,
    };
  
  
    const [course, setCourse] =
      useState(null);
  
    const [section, setSection] =
      useState(null);
  
    const [items, setItems] =
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
    // Load Data
    // =====================================
  
    const fetchData = async () => {
      try {
  
        setLoading(true);
        setPageError("");
  
  
        const [
          courseResponse,
          itemsResponse,
        ] = await Promise.all([
  
          api.get(
            `/courses/${courseId}`
          ),
  
          api.get(
            `/courses/${courseId}/sections/${sectionId}/items`
          ),
  
        ]);
  
  
        setCourse(
          courseResponse.data.course
        );
  
  
        setSection(
          itemsResponse.data.section
        );
  
  
        setItems(
          itemsResponse.data.items || []
        );
  
      } catch (error) {
  
        setPageError(
          error.response?.data?.message ||
          "Unable to load section content."
        );
  
      } finally {
  
        setLoading(false);
  
      }
    };
  
  
    useEffect(() => {
      fetchData();
    }, [
      courseId,
      sectionId,
    ]);
  
  
    // =====================================
    // Normal Inputs
    // =====================================
  
    const handleChange = (e) => {
      const {
        name,
        value,
        type,
        checked,
      } = e.target;
  
  
      setFormData((current) => ({
        ...current,
  
        [name]:
          type === "checkbox"
            ? checked
            : value,
      }));
    };
  
  
    // =====================================
    // File Input
    // =====================================
  
    const handleFileChange = (e) => {
  
      const file =
        e.target.files?.[0] || null;
  
  
      setFormData((current) => ({
        ...current,
        file,
      }));
    };
  
  
    // =====================================
    // Reset Type-specific Data
    // =====================================
  
    const handleTypeChange = (e) => {
      const value = e.target.value;
  
  
      setFormData((current) => ({
        ...current,
        type: value,
        content: "",
        resource_url: "",
        file: null,
      }));
  
  
      setErrors({});
    };
  
  
    // =====================================
    // Build FormData
    // =====================================
  
    const buildPayload = () => {
  
      const data = new FormData();
  
  
      data.append(
        "title",
        formData.title
      );
  
  
      data.append(
        "type",
        formData.type
      );
  
  
      data.append(
        "status",
        formData.status
      );
  
  
      data.append(
        "is_preview",
        formData.is_preview
          ? "1"
          : "0"
      );
  
  
      if (formData.description) {
  
        data.append(
          "description",
          formData.description
        );
  
      }
  
  
      if (
        formData.type === "text"
        && formData.content
      ) {
  
        data.append(
          "content",
          formData.content
        );
  
      }
  
  
      if (
        ["video", "audio", "link"]
          .includes(formData.type)
        && formData.resource_url
      ) {
  
        data.append(
          "resource_url",
          formData.resource_url
        );
  
      }
  
  
      if (formData.file) {
  
        data.append(
          "file",
          formData.file
        );
  
      }
  
  
      if (
        formData.sort_order !== ""
      ) {
  
        data.append(
          "sort_order",
          formData.sort_order
        );
  
      }
  
  
      return data;
    };
  
  
    // =====================================
    // Submit
    // =====================================
  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
  
      setSaving(true);
      setErrors({});
      setMessage("");
      setPageError("");
  
  
      try {
  
        const payload =
          buildPayload();
  
  
        if (editingId) {
  
          /*
          |--------------------------------------------------------------------------
          | POST update intentionally used
          | because multipart files work
          | reliably with PHP this way.
          |--------------------------------------------------------------------------
          */
  
          await api.post(
            `/courses/${courseId}/sections/${sectionId}/items/${editingId}`,
            payload
          );
  
  
          setMessage(
            "Content updated successfully."
          );
  
        } else {
  
          await api.post(
            `/courses/${courseId}/sections/${sectionId}/items`,
            payload
          );
  
  
          setMessage(
            "Content added successfully."
          );
  
        }
  
  
        setEditingId(null);
  
        setFormData(emptyForm);
  
  
        const fileInput =
          document.getElementById(
            "section-item-file"
          );
  
        if (fileInput) {
          fileInput.value = "";
        }
  
  
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
  
    const handleEdit = (item) => {
  
      setEditingId(item.id);
  
  
      setFormData({
        title:
          item.title || "",
  
        type:
          item.type || "video",
  
        description:
          item.description || "",
  
        content:
          item.content || "",
  
        resource_url:
          item.resource_url || "",
  
        file: null,
  
        sort_order:
          item.sort_order ?? "",
  
        status:
          item.status || "Draft",
  
        is_preview:
          Boolean(item.is_preview),
      });
  
  
      setErrors({});
      setMessage("");
      setPageError("");
  
  
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };
  
  
    // =====================================
    // Cancel
    // =====================================
  
    const handleCancel = () => {
  
      setEditingId(null);
  
      setFormData(emptyForm);
  
      setErrors({});
  
  
      const fileInput =
        document.getElementById(
          "section-item-file"
        );
  
      if (fileInput) {
        fileInput.value = "";
      }
    };
  
  
    // =====================================
    // Delete
    // =====================================
  
    const handleDelete = async (
      item
    ) => {
  
      const confirmed =
        window.confirm(
          `Delete "${item.title}"?`
        );
  
  
      if (!confirmed) return;
  
  
      try {
  
        setMessage("");
        setPageError("");
  
  
        await api.delete(
          `/courses/${courseId}/sections/${sectionId}/items/${item.id}`
        );
  
  
        setMessage(
          "Content deleted successfully."
        );
  
  
        await fetchData();
  
      } catch (error) {
  
        setPageError(
          error.response?.data?.message ||
          "Unable to delete content."
        );
  
      }
    };
  
  
    // =====================================
    // Type Label
    // =====================================
  
    const getTypeLabel = (type) => {
  
      const labels = {
        video: "Video",
        pdf: "PDF",
        text: "Text",
        audio: "Audio",
        link: "Link",
      };
  
  
      return labels[type] || type;
    };
  
  
    if (loading) {
  
      return (
        <div className="admin-card">{tr("Loading content...")}</div>
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
              navigate(
                `/admin/courses/${courseId}/content`
              )
            }
          >{tr("\u2190 Back to Sections")}</button>
  
  
          <div
            style={{
              marginTop: "18px",
            }}
          >
  
            <h1>
              {section?.title}
            </h1>
  
            <p>
              {course?.title}
            </p>
  
          </div>
  
        </div>
  
  
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
            Add Content
        ================================= */}
  
        <div className="admin-card">
  
          <div className="content-builder-heading">
  
            <div>
  
              <h2>
                {editingId
                  ? "Edit Content"
                  : "Add Content"}
              </h2>
  
              <p>{tr("Add learning materials inside this section.")}</p>
  
            </div>
  
          </div>
  
  
          <form
            className="admin-form"
            onSubmit={handleSubmit}
          >
  
            <div className="form-grid">
  
              {/* Title */}
  
              <div className="form-group">
  
                <label>{tr("Content Title")}</label>
  
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={tr("Example: Vocabulary Explanation")}
                />
  
                {errors.title && (
                  <span className="field-error">
                    {errors.title[0]}
                  </span>
                )}
  
              </div>
  
  
              {/* Type */}
  
              <div className="form-group">
  
                <label>{tr("Content Type")}</label>
  
                <select
                  name="type"
                  value={formData.type}
                  onChange={
                    handleTypeChange
                  }
                >
  
                  <option value="video">{tr("\ud83c\udfa5 Video")}</option>
  
                  <option value="pdf">{tr("\ud83d\udcc4 PDF")}</option>
  
                  <option value="text">{tr("\ud83d\udcdd Text Explanation")}</option>
  
                  <option value="audio">{tr("\ud83c\udfa7 Audio")}</option>
  
                  <option value="link">{tr("\ud83d\udd17 External Link")}</option>
  
                </select>
  
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
  
              </div>
  
  
              {/* Order */}
  
              <div className="form-group">
  
                <label>{tr("Order")}</label>
  
                <input
                  name="sort_order"
                  type="number"
                  min="0"
                  value={
                    formData.sort_order
                  }
                  onChange={handleChange}
                  placeholder={tr("Automatic")}
                />
  
              </div>
  
  
              {/* Description */}
  
              <div className="form-group content-description-field">
  
                <label>{tr("Description")}</label>
  
                <textarea
                  name="description"
                  rows="3"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder={tr("Optional...")}
                />
  
              </div>
  
  
              {/* Video URL */}
  
              {formData.type === "video" && (
  
                <div className="form-group content-description-field">
  
                  <label>{tr("Video URL")}</label>
  
                  <input
                    name="resource_url"
                    type="url"
                    value={
                      formData.resource_url
                    }
                    onChange={handleChange}
                    placeholder="https://..."
                  />
  
                  {errors.resource_url && (
                    <span className="field-error">
                      {errors.resource_url[0]}
                    </span>
                  )}
  
                </div>
  
              )}
  
  
              {/* External Link */}
  
              {formData.type === "link" && (
  
                <div className="form-group content-description-field">
  
                  <label>{tr("Link URL")}</label>
  
                  <input
                    name="resource_url"
                    type="url"
                    value={
                      formData.resource_url
                    }
                    onChange={handleChange}
                    placeholder="https://..."
                  />
  
                  {errors.resource_url && (
                    <span className="field-error">
                      {errors.resource_url[0]}
                    </span>
                  )}
  
                </div>
  
              )}
  
  
              {/* Text */}
  
              {formData.type === "text" && (
  
                <div className="form-group content-description-field">
  
                  <label>{tr("Lesson Content")}</label>
  
                  <textarea
                    name="content"
                    rows="10"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder={tr("Write the explanation here...")}
                  />
  
                  {errors.content && (
                    <span className="field-error">
                      {errors.content[0]}
                    </span>
                  )}
  
                </div>
  
              )}
  
  
              {/* PDF */}
  
              {formData.type === "pdf" && (
  
                <div className="form-group content-description-field">
  
                  <label>{tr("PDF File")}</label>
  
                  <input
                    id="section-item-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={
                      handleFileChange
                    }
                  />
  
  
                  {editingId && (
                    <small>{tr("Leave empty to keep the existing PDF.")}</small>
                  )}
  
  
                  {errors.file && (
                    <span className="field-error">
                      {errors.file[0]}
                    </span>
                  )}
  
                </div>
  
              )}
  
  
              {/* Audio */}
  
              {formData.type === "audio" && (
  
                <>
  
                  <div className="form-group content-description-field">
  
                    <label>{tr("Audio URL")}</label>
  
                    <input
                      name="resource_url"
                      type="url"
                      value={
                        formData.resource_url
                      }
                      onChange={handleChange}
                      placeholder={tr("Optional audio URL")}
                    />
  
                  </div>
  
  
                  <div className="form-group content-description-field">
  
                    <label>{tr("Or Upload Audio")}</label>
  
                    <input
                      id="section-item-file"
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac,.ogg,audio/*"
                      onChange={
                        handleFileChange
                      }
                    />
  
  
                    {editingId && (
                      <small>{tr("Leave empty to keep the existing audio file.")}</small>
                    )}
  
  
                    {errors.file && (
                      <span className="field-error">
                        {errors.file[0]}
                      </span>
                    )}
  
                  </div>
  
                </>
  
              )}
  
  
              {/* Preview */}
  
              <div className="form-group">
  
                <label className="content-checkbox">
  
                  <input
                    type="checkbox"
                    name="is_preview"
                    checked={
                      formData.is_preview
                    }
                    onChange={handleChange}
                  />{tr("Free Preview")}</label>
  
                <small>{tr("Allow visitors to access this content without enrollment.")}</small>
  
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
                    ? "Update Content"
                    : "+ Add Content"}
              </button>
  
  
              {editingId && (
  
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCancel}
                >{tr("Cancel")}</button>
  
              )}
  
            </div>
  
          </form>
  
        </div>
  
  
        {/* =================================
            Content List
        ================================= */}
  
        <div className="admin-card">
  
          <div className="content-builder-heading">
  
            <div>
  
              <h2>{tr("Section Content")}</h2>
  
              <p>
                {items.length} item
                {items.length !== 1
                  ? "s"
                  : ""}
              </p>
  
            </div>
  
          </div>
  
  
          {items.length === 0 ? (
  
            <div className="content-empty-state">
  
              <h3>{tr("No content yet")}</h3>
  
              <p>{tr("Add the first learning material above.")}</p>
  
            </div>
  
          ) : (
  
            <div className="sections-list">
  
              {items.map(
                (item, index) => (
  
                  <div
                    className="section-admin-item"
                    key={item.id}
                  >
  
                    <div className="section-order">
  
                      {String(
                        index + 1
                      ).padStart(2, "0")}
  
                    </div>
  
  
                    <div className="section-main">
  
                      <div className="section-title-row">
  
                        <h3>
                          {item.title}
                        </h3>
  
  
                        <span className="item-type-badge">
                          {getTypeLabel(
                            item.type
                          )}
                        </span>
  
  
                        <span
                          className={
                            item.status ===
                            "Published"
                              ? "content-status published"
                              : "content-status draft"
                          }
                        >
                          {item.status}
                        </span>
  
  
                        {item.is_preview && (
  
                          <span className="preview-badge">{tr("Free Preview")}</span>
  
                        )}
  
                      </div>
  
  
                      {item.description && (
                        <p>
                          {item.description}
                        </p>
                      )}
  
  
                      {item.type === "pdf" &&
                        item.file_url && (
  
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >{tr("View PDF")}</a>
  
                      )}
  
  
                      {["video", "audio", "link"]
                        .includes(item.type)
                        && item.resource_url && (
  
                        <a
                          href={
                            item.resource_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >{tr("Open Resource")}</a>
  
                      )}
  
                    </div>
  
  
                    <div className="section-actions">
  
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(item)
                        }
                      >{tr("Edit")}</button>
  
  
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(item)
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
  
  
  export default SectionContent;