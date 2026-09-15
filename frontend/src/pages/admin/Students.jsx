import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  BookOpen,
  Edit3,
  Mail,
  Phone,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../services/api";


import {
  useLanguage,
} from "../../context/LanguageContext";


function Students() {
  const { tr } = useLanguage();

  const navigate =
    useNavigate();


  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    editingStudent,
    setEditingStudent,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });

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


  const fetchStudents =
    async () => {

      try {

        setLoading(true);
        setPageError("");


        const response =
          await api.get(
            "/students"
          );


        setStudents(
          response.data
            .students ||
          []
        );

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to load students."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchStudents();
  }, []);


  const filteredStudents =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        return students.filter(
          (student) => {

            const matchesSearch =
              !term ||
              [
                student.name,
                student.email,
                student.phone,
              ]
                .join(" ")
                .toLowerCase()
                .includes(term);


            const matchesStatus =
              statusFilter ===
                "all" ||
              student.status ===
                statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );
      },
      [
        students,
        search,
        statusFilter,
      ]
    );


  const activeCount =
    students.filter(
      (student) =>
        student.status ===
        "Active"
    ).length;


  const inactiveCount =
    students.length -
    activeCount;


  const openEdit =
    (student) => {

      setEditingStudent(
        student
      );


      setFormData({
        name:
          student.name ||
          "",

        email:
          student.email ||
          "",

        phone:
          student.phone ||
          "",

        status:
          student.status ||
          "Active",
      });


      setErrors({});
      setMessage("");
      setPageError("");
    };


  const closeEdit = () => {

    if (saving) {
      return;
    }


    setEditingStudent(
      null
    );

    setErrors({});
  };


  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setFormData(
        (current) => ({
          ...current,
          [name]: value,
        })
      );
    };


  const handleSave =
    async (event) => {

      event.preventDefault();


      if (!editingStudent) {
        return;
      }


      try {

        setSaving(true);
        setErrors({});
        setPageError("");
        setMessage("");


        await api.put(
          `/students/${editingStudent.id}`,
          formData
        );


        setMessage(
          "Student updated successfully."
        );


        setEditingStudent(
          null
        );


        await fetchStudents();

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
            "Unable to update student."
          );
        }

      } finally {

        setSaving(false);
      }
    };


  const handleDelete =
    async (student) => {

      const confirmed =
        window.confirm(
          `Delete "${student.name}" and their account?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          student.id
        );

        setPageError("");
        setMessage("");


        await api.delete(
          `/students/${student.id}`
        );


        setMessage(
          "Student deleted successfully."
        );


        await fetchStudents();

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to delete student."
        );

      } finally {

        setDeletingId(
          null
        );
      }
    };


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


  if (loading) {

    return (
      <div className="premium-admin-loading">

        <span className="premium-spinner" />

        <p>{tr("Loading students...")}</p>

      </div>
    );
  }


  return (
    <div className="premium-admin-crud">

      {/* Header */}

      <div className="premium-crud-heading">

        <div>

          <span>{tr("People")}</span>


          <h1>{tr("Students")}</h1>


          <p>{tr("Manage registered student accounts without unnecessary forms.")}</p>

        </div>


        <div className="premium-crud-summary">

          <div>

            <strong>
              {students.length}
            </strong>

            <span>{tr("Total")}</span>

          </div>


          <div>

            <strong>
              {activeCount}
            </strong>

            <span>{tr("Active")}</span>

          </div>


          <div>

            <strong>
              {inactiveCount}
            </strong>

            <span>{tr("Inactive")}</span>

          </div>

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


      {/* Toolbar */}

      <div className="premium-crud-toolbar">

        <div className="premium-crud-search">

          <Search size={17} />


          <input
            type="search"
            value={search}
            placeholder={tr("Search name, email or phone...")}
            onChange={(event) =>
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
              "Active"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Active"
              )
            }
          >{tr("Active")}</button>


          <button
            type="button"
            className={
              statusFilter ===
              "Inactive"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Inactive"
              )
            }
          >{tr("Inactive")}</button>

        </div>


        <div className="premium-result-count">
          {filteredStudents.length}
          {" "}
          results
        </div>

      </div>


      {/* Desktop Table */}

      <div className="premium-crud-table-wrap">

        {filteredStudents.length ===
        0 ? (

          <div className="premium-admin-empty">

            <Users size={26} />

            <strong>{tr("No students found.")}</strong>

            <span>{tr("Try changing your search or filter.")}</span>

          </div>

        ) : (

          <table className="premium-crud-table">

            <thead>

              <tr>

                <th>{tr("Student")}</th>

                <th>{tr("Contact")}</th>

                <th>{tr("Status")}</th>

                <th>{tr("Courses")}</th>

                <th>{tr("Registered")}</th>

                <th>{tr("Actions")}</th>

              </tr>

            </thead>


            <tbody>

              {filteredStudents.map(
                (student) => (

                  <tr
                    key={
                      student.id
                    }
                  >

                    <td>

                      <div className="premium-student-cell">

                        <div className="premium-student-avatar">
                          {
                            student.name
                              ?.charAt(0)
                              ?.toUpperCase()
                            ||
                            "S"
                          }
                        </div>


                        <div>

                          <strong>
                            {
                              student.name
                            }
                          </strong>

                          <span>
                            ID #{student.id}
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>

                      <div className="premium-contact-cell">

                        <span>
                          <Mail size={13} />
                          {
                            student.email
                          }
                        </span>


                        <span>
                          <Phone size={13} />
                          {
                            student.phone ||
                            "No phone"
                          }
                        </span>

                      </div>

                    </td>


                    <td>

                      <span
                        className={
                          student.status ===
                          "Active"
                            ? "premium-status active"
                            : "premium-status"
                        }
                      >
                        <span />
                        {
                          student.status
                        }
                      </span>

                    </td>


                    <td>

                      <div className="premium-course-count-cell">

                        <BookOpen size={14} />

                        <strong>
                          {
                            student
                              .courses
                              ?.length ||
                            student
                              .enrollments
                              ?.length ||
                            0
                          }
                        </strong>

                      </div>

                    </td>


                    <td>

                      <span className="premium-date-cell">
                        {
                          formatDate(
                            student.user
                              ?.created_at ||
                            student.created_at
                          )
                        }
                      </span>

                    </td>


                    <td>

                      <div className="premium-row-actions">

                        <button
                          type="button"
                          className="premium-icon-action"
                          title={tr("View insights")}
                          onClick={() =>
                            navigate(
                              `/admin/students/${student.id}/insights`
                            )
                          }
                        >
                          <BarChart3 size={15} />
                        </button>


                        <button
                          type="button"
                          className="premium-icon-action"
                          title={tr("Edit student")}
                          onClick={() =>
                            openEdit(
                              student
                            )
                          }
                        >
                          <Edit3 size={15} />
                        </button>


                        <button
                          type="button"
                          className="premium-icon-action danger"
                          title={tr("Delete student")}
                          disabled={
                            deletingId ===
                            student.id
                          }
                          onClick={() =>
                            handleDelete(
                              student
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* Mobile Cards */}

      <div className="premium-student-mobile-list">

        {filteredStudents.map(
          (student) => (

            <article
              key={
                `mobile-${student.id}`
              }
              className="premium-student-mobile-card"
            >

              <div className="premium-student-mobile-head">

                <div className="premium-student-cell">

                  <div className="premium-student-avatar">
                    {
                      student.name
                        ?.charAt(0)
                        ?.toUpperCase()
                      ||
                      "S"
                    }
                  </div>


                  <div>

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

                </div>


                <span
                  className={
                    student.status ===
                    "Active"
                      ? "premium-status active"
                      : "premium-status"
                  }
                >
                  {student.status}
                </span>

              </div>


              <div className="premium-mobile-meta">

                <span>
                  <Phone size={13} />
                  {
                    student.phone ||
                    "No phone"
                  }
                </span>


                <span>
                  <BookOpen size={13} />
                  {
                    student.courses
                      ?.length ||
                    student.enrollments
                      ?.length ||
                    0
                  }
                  {" "}
                  courses
                </span>

              </div>


              <div className="premium-mobile-actions">

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/students/${student.id}/insights`
                    )
                  }
                >
                  <BarChart3 size={14} />{tr("Insights")}</button>


                <button
                  type="button"
                  onClick={() =>
                    openEdit(
                      student
                    )
                  }
                >
                  <Edit3 size={14} />{tr("Edit")}</button>


                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    handleDelete(
                      student
                    )
                  }
                >
                  <Trash2 size={14} />{tr("Delete")}</button>

              </div>

            </article>

          )
        )}

      </div>


      {/* Edit Drawer */}

      {editingStudent && (

        <>

          <button
            type="button"
            className="premium-drawer-backdrop"
            onClick={closeEdit}
            aria-label={tr("Close edit panel")}
          />


          <aside className="premium-edit-drawer">

            <div className="premium-drawer-head">

              <div>

                <span>{tr("Student account")}</span>

                <h2>{tr("Edit student")}</h2>

              </div>


              <button
                type="button"
                onClick={closeEdit}
                aria-label={tr("Close")}
              >
                <X size={18} />
              </button>

            </div>


            <div className="premium-drawer-profile">

              <div className="premium-drawer-avatar">
                <UserRound size={22} />
              </div>


              <div>

                <strong>
                  {
                    editingStudent.name
                  }
                </strong>

                <span>
                  Student #{
                    editingStudent.id
                  }
                </span>

              </div>

            </div>


            <form
              className="premium-edit-form"
              onSubmit={
                handleSave
              }
            >

              <div className="premium-field">

                <label>{tr("Full name")}</label>


                <input
                  type="text"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                />


                {errors.name && (
                  <span className="field-error">
                    {errors.name[0]}
                  </span>
                )}

              </div>


              <div className="premium-field">

                <label>{tr("Email")}</label>


                <input
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                />


                {errors.email && (
                  <span className="field-error">
                    {errors.email[0]}
                  </span>
                )}

              </div>


              <div className="premium-field">

                <label>{tr("Phone")}</label>


                <input
                  type="text"
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                />


                {errors.phone && (
                  <span className="field-error">
                    {errors.phone[0]}
                  </span>
                )}

              </div>


              <div className="premium-field">

                <label>{tr("Account status")}</label>


                <select
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="Active">{tr("Active")}</option>

                  <option value="Inactive">{tr("Inactive")}</option>

                </select>

              </div>


              <div className="premium-drawer-note">{tr("Course progress is tracked per enrollment and is not edited from the student account.")}</div>


              <div className="premium-drawer-actions">

                <button
                  type="button"
                  className="premium-cancel-btn"
                  onClick={closeEdit}
                >{tr("Cancel")}</button>


                <button
                  type="submit"
                  className="premium-save-btn"
                  disabled={saving}
                >
                  {
                    saving
                      ? "Saving..."
                      : "Save changes"
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


export default Students;
