import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileCheck2,
  LockKeyhole,
  Plus,
  Search,
  Trash2,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import api
  from "../../services/api";


const emptyForm = {
  title: "",
  course_id: "",
  due_date: "",
  marks: 0,
  status: "Open",
};


import {
  useLanguage,
} from "../../context/LanguageContext";


function Assignments() {
  const { tr } = useLanguage();

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    pageError,
    setPageError,
  ] = useState("");


  // =====================================
  // Fetch
  // =====================================

  const fetchData =
    async () => {

      try {

        setLoading(true);
        setPageError("");


        const [
          assignmentsResponse,
          coursesResponse,
        ] = await Promise.all([
          api.get("/assignments"),
          api.get("/courses"),
        ]);


        setAssignments(
          assignmentsResponse
            .data
            .assignments ||
          []
        );


        setCourses(
          coursesResponse
            .data
            .courses ||
          []
        );

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to load assignments."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchData();
  }, []);


  // =====================================
  // Filters
  // =====================================

  const filteredAssignments =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();


      return assignments.filter(
        (assignment) => {

          const searchable =
            [
              assignment.title,
              assignment.course?.title,
              assignment.course
                ?.instructor
                ?.name,
              assignment.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          const matchesSearch =
            !term ||
            searchable.includes(
              term
            );


          const matchesStatus =
            statusFilter === "all" ||
            assignment.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      assignments,
      search,
      statusFilter,
    ]);


  const openCount =
    assignments.filter(
      (item) =>
        item.status === "Open"
    ).length;


  const closedCount =
    assignments.filter(
      (item) =>
        item.status === "Closed"
    ).length;


  const submissionCount =
    assignments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.submissions || 0
        ),
      0
    );


  // =====================================
  // Drawer
  // =====================================

  const openCreate =
    () => {

      setEditingId(null);

      setFormData({
        ...emptyForm,
      });

      setErrors({});
      setMessage("");
      setPageError("");

      setDrawerOpen(true);
    };


  const openEdit =
    (assignment) => {

      setEditingId(
        assignment.id
      );


      setFormData({
        title:
          assignment.title ||
          "",

        course_id:
          assignment.course_id ||
          "",

        due_date:
          assignment.due_date
            ?.substring(0, 10) ||
          "",

        marks:
          Number(
            assignment.marks
          ) || 0,

        status:
          assignment.status ||
          "Open",
      });


      setErrors({});
      setMessage("");
      setPageError("");

      setDrawerOpen(true);
    };


  const closeDrawer =
    () => {

      if (saving) {
        return;
      }


      setDrawerOpen(false);

      setEditingId(null);

      setFormData({
        ...emptyForm,
      });

      setErrors({});
    };


  // =====================================
  // Form
  // =====================================

  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      const numericFields = [
        "course_id",
        "marks",
      ];


      setFormData(
        (current) => ({
          ...current,

          [name]:
            numericFields.includes(
              name
            )
              ? Number(value)
              : value,
        })
      );
    };


  const handleSubmit =
    async (event) => {

      event.preventDefault();


      try {

        setSaving(true);

        setErrors({});
        setMessage("");
        setPageError("");


        if (editingId) {

          await api.put(
            `/assignments/${editingId}`,
            formData
          );


          setMessage(
            "Assignment updated successfully."
          );

        } else {

          await api.post(
            "/assignments",
            formData
          );


          setMessage(
            "Assignment created successfully."
          );
        }


        setDrawerOpen(false);

        setEditingId(null);

        setFormData({
          ...emptyForm,
        });


        await fetchData();

      } catch (error) {

        if (
          error.response?.status ===
          422
        ) {

          setErrors(
            error.response
              .data
              .errors ||
            {}
          );

        } else {

          setPageError(
            error.response?.data
              ?.message ||
            "Unable to save assignment."
          );
        }

      } finally {

        setSaving(false);
      }
    };


  // =====================================
  // Delete
  // =====================================

  const handleDelete =
    async (assignment) => {

      const confirmed =
        window.confirm(
          `Delete "${assignment.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          assignment.id
        );

        setMessage("");
        setPageError("");


        await api.delete(
          `/assignments/${assignment.id}`
        );


        setMessage(
          "Assignment deleted successfully."
        );


        await fetchData();

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to delete assignment."
        );

      } finally {

        setDeletingId(null);
      }
    };


  // =====================================
  // Helpers
  // =====================================

  const formatDate =
    (value) => {

      if (!value) {
        return "-";
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "-";
      }


      return date.toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    };


  const dueState =
    (assignment) => {

      if (
        assignment.status ===
        "Closed"
      ) {
        return "closed";
      }


      if (!assignment.due_date) {
        return "open";
      }


      const due =
        new Date(
          assignment.due_date
        );


      const today =
        new Date();


      today.setHours(
        0,
        0,
        0,
        0
      );


      due.setHours(
        0,
        0,
        0,
        0
      );


      if (due < today) {
        return "overdue";
      }


      return "open";
    };


  if (loading) {

    return (
      <div className="premium-admin-loading">

        <span className="premium-spinner" />

        <p>{tr("Loading assignments...")}</p>

      </div>
    );
  }


  return (
    <div className="premium-admin-crud premium-assignments-page">

      {/* Header */}

      <div className="premium-crud-heading">

        <div>

          <span>{tr("Coursework")}</span>


          <h1>{tr("Assignments")}</h1>


          <p>{tr("Create homework tasks and track student submissions from one simple view.")}</p>

        </div>


        <button
          type="button"
          className="premium-add-button"
          onClick={openCreate}
        >
          <Plus size={16} />{tr("New assignment")}</button>

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


      {/* Summary */}

      <div className="premium-assignment-stats">

        <article>

          <div>
            <ClipboardList size={18} />
          </div>

          <span>{tr("Total")}</span>

          <strong>
            {assignments.length}
          </strong>

        </article>


        <article>

          <div>
            <CheckCircle2 size={18} />
          </div>

          <span>{tr("Open")}</span>

          <strong>
            {openCount}
          </strong>

        </article>


        <article>

          <div>
            <LockKeyhole size={18} />
          </div>

          <span>{tr("Closed")}</span>

          <strong>
            {closedCount}
          </strong>

        </article>


        <article>

          <div>
            <FileCheck2 size={18} />
          </div>

          <span>{tr("Submissions")}</span>

          <strong>
            {submissionCount}
          </strong>

        </article>

      </div>


      {/* Toolbar */}

      <div className="premium-assignment-toolbar">

        <div className="premium-crud-search">

          <Search size={17} />

          <input
            type="search"
            placeholder={tr("Search assignments...")}
            value={search}
            onChange={
              (event) =>
                setSearch(
                  event.target.value
                )
            }
          />

        </div>


        <div className="premium-crud-filters">

          <button
            type="button"
            className={
              statusFilter ===
              "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "all"
              )
            }
          >{tr("All")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Open"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Open"
              )
            }
          >{tr("Open")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Closed"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Closed"
              )
            }
          >{tr("Closed")}</button>

        </div>


        <div className="premium-result-count">
          {
            filteredAssignments
              .length
          }
          {" "}
          results
        </div>

      </div>


      {/* Cards */}

      {filteredAssignments.length ===
      0 ? (

        <div className="premium-admin-empty premium-assignment-empty">

          <ClipboardList size={29} />

          <strong>{tr("No assignments found.")}</strong>

          <span>{tr("Create an assignment or change your filters.")}</span>

        </div>

      ) : (

        <div className="premium-assignment-grid">

          {filteredAssignments.map(
            (assignment) => {

              const state =
                dueState(
                  assignment
                );


              return (
                <article
                  key={
                    assignment.id
                  }
                  className="premium-assignment-card"
                >

                  <div className="premium-assignment-card-top">

                    <div className="premium-assignment-icon">
                      <ClipboardList
                        size={20}
                      />
                    </div>


                    <span
                      className={`premium-assignment-state ${state}`}
                    >
                      {
                        state ===
                        "overdue"
                          ? "Past Due"
                          : assignment
                              .status
                      }
                    </span>

                  </div>


                  <h2>
                    {
                      assignment.title
                    }
                  </h2>


                  <div className="premium-assignment-course">

                    <BookOpen
                      size={14}
                    />

                    <span>
                      {
                        assignment.course
                          ?.title ||
                        "-"
                      }
                    </span>

                  </div>


                  <div className="premium-assignment-instructor">

                    <UserRound
                      size={13}
                    />

                    <span>
                      {
                        assignment.course
                          ?.instructor
                          ?.name ||
                        "-"
                      }
                    </span>

                  </div>


                  <div className="premium-assignment-meta">

                    <div>

                      <CalendarDays
                        size={15}
                      />

                      <span>{tr("Due")}</span>

                      <strong>
                        {
                          formatDate(
                            assignment
                              .due_date
                          )
                        }
                      </strong>

                    </div>


                    <div>

                      <Trophy size={15} />

                      <span>{tr("Marks")}</span>

                      <strong>
                        {
                          assignment.marks
                        }
                      </strong>

                    </div>


                    <div>

                      <FileCheck2
                        size={15}
                      />

                      <span>{tr("Submitted")}</span>

                      <strong>
                        {
                          assignment
                            .submissions ||
                          0
                        }
                      </strong>

                    </div>

                  </div>


                  <div className="premium-assignment-actions">

                    <button
                      type="button"
                      className="premium-assignment-edit-btn"
                      onClick={() =>
                        openEdit(
                          assignment
                        )
                      }
                    >
                      <Edit3 size={14} />{tr("Edit")}</button>


                    <button
                      type="button"
                      className="premium-assignment-delete-btn"
                      onClick={() =>
                        handleDelete(
                          assignment
                        )
                      }
                      disabled={
                        deletingId ===
                        assignment.id
                      }
                    >
                      <Trash2 size={14} />
                    </button>

                  </div>

                </article>
              );
            }
          )}

        </div>

      )}


      {/* Drawer */}

      {drawerOpen && (

        <>

          <button
            type="button"
            className="premium-drawer-backdrop"
            onClick={closeDrawer}
            aria-label={tr("Close assignment panel")}
          />


          <aside className="premium-edit-drawer premium-assignment-drawer">

            <div className="premium-drawer-head">

              <div>

                <span>{tr("Assignment")}</span>


                <h2>
                  {
                    editingId
                      ? "Edit assignment"
                      : "Create assignment"
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={closeDrawer}
                aria-label={tr("Close")}
              >
                <X size={18} />
              </button>

            </div>


            <form
              className="premium-edit-form"
              onSubmit={
                handleSubmit
              }
            >

              <section className="premium-assignment-form-section">

                <div className="premium-assignment-form-title">

                  <ClipboardList
                    size={16}
                  />

                  <div>

                    <strong>{tr("Assignment details")}</strong>

                    <span>{tr("Keep the task simple and clear for students.")}</span>

                  </div>

                </div>


                <div className="premium-field">

                  <label>{tr("Title")}</label>


                  <input
                    type="text"
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={tr("Example: Unit 2 Homework")}
                  />


                  {errors.title && (
                    <span className="field-error">
                      {errors.title[0]}
                    </span>
                  )}

                </div>


                <div className="premium-field">

                  <label>{tr("Course")}</label>


                  <select
                    name="course_id"
                    value={
                      formData.course_id
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">{tr("Select course")}</option>


                    {courses.map(
                      (course) => (

                        <option
                          key={
                            course.id
                          }
                          value={
                            course.id
                          }
                        >
                          {course.title}
                        </option>

                      )
                    )}

                  </select>


                  {errors.course_id && (
                    <span className="field-error">
                      {
                        errors
                          .course_id[0]
                      }
                    </span>
                  )}

                </div>

              </section>


              <section className="premium-assignment-form-section">

                <div className="premium-assignment-form-title">

                  <CalendarDays
                    size={16}
                  />

                  <div>

                    <strong>{tr("Deadline & grading")}</strong>

                    <span>{tr("Set due date, marks and availability.")}</span>

                  </div>

                </div>


                <div className="premium-field">

                  <label>{tr("Due date")}</label>


                  <input
                    type="date"
                    name="due_date"
                    value={
                      formData.due_date
                    }
                    onChange={
                      handleChange
                    }
                  />


                  {errors.due_date && (
                    <span className="field-error">
                      {
                        errors
                          .due_date[0]
                      }
                    </span>
                  )}

                </div>


                <div className="premium-field">

                  <label>{tr("Maximum marks")}</label>


                  <input
                    type="number"
                    name="marks"
                    min="0"
                    value={
                      formData.marks
                    }
                    onChange={
                      handleChange
                    }
                  />


                  {errors.marks && (
                    <span className="field-error">
                      {
                        errors
                          .marks[0]
                      }
                    </span>
                  )}

                </div>


                <div className="premium-field">

                  <label>{tr("Status")}</label>


                  <div className="premium-assignment-status-picker">

                    <button
                      type="button"
                      className={
                        formData.status ===
                        "Open"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setFormData(
                          (current) => ({
                            ...current,
                            status:
                              "Open",
                          })
                        )
                      }
                    >
                      <CheckCircle2
                        size={14}
                      />{tr("Open")}</button>


                    <button
                      type="button"
                      className={
                        formData.status ===
                        "Closed"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setFormData(
                          (current) => ({
                            ...current,
                            status:
                              "Closed",
                          })
                        )
                      }
                    >
                      <LockKeyhole
                        size={14}
                      />{tr("Closed")}</button>

                  </div>


                  {errors.status && (
                    <span className="field-error">
                      {
                        errors
                          .status[0]
                      }
                    </span>
                  )}

                </div>

              </section>


              <div className="premium-assignment-preview">

                <span>{tr("Preview")}</span>

                <strong>
                  {
                    formData.title ||
                    "Untitled assignment"
                  }
                </strong>

                <small>
                  {
                    courses.find(
                      (course) =>
                        Number(
                          course.id
                        ) ===
                        Number(
                          formData
                            .course_id
                        )
                    )?.title ||
                    "No course"
                  }
                  {" • "}
                  {
                    formData.marks
                  }
                  {" marks • "}
                  {
                    formData.status
                  }
                </small>

              </div>


              <div className="premium-drawer-actions">

                <button
                  type="button"
                  className="premium-cancel-btn"
                  onClick={closeDrawer}
                >{tr("Cancel")}</button>


                <button
                  type="submit"
                  className="premium-save-btn"
                  disabled={saving}
                >
                  {
                    saving
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Create assignment"
                  }
                </button>

              </div>

            </form>

          </aside>

        </>

      )}

    </div>
  );
}


export default Assignments;
