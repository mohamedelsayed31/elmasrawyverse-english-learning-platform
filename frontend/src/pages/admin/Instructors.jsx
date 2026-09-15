import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import api
  from "../../services/api";


const emptyForm = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  experience: 0,
  status: "Available",
};


import {
  useLanguage,
} from "../../context/LanguageContext";


function Instructors() {
  const { tr } = useLanguage();

  const [
    instructors,
    setInstructors,
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
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

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


  const fetchInstructors =
    async () => {

      try {

        setLoading(true);
        setPageError("");


        const response =
          await api.get(
            "/instructors"
          );


        setInstructors(
          response.data
            .instructors ||
          []
        );

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to load instructors."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    fetchInstructors();
  }, []);


  const filtered =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        return instructors.filter(
          (instructor) => {

            const matchesSearch =
              !term ||
              [
                instructor.name,
                instructor.email,
                instructor.phone,
                instructor.specialization,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(term);


            const matchesStatus =
              statusFilter ===
                "all" ||
              instructor.status ===
                statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );

      },
      [
        instructors,
        search,
        statusFilter,
      ]
    );


  const availableCount =
    instructors.filter(
      (item) =>
        item.status ===
        "Available"
    ).length;


  const totalCourses =
    instructors.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.courses_count ||
          0
        ),
      0
    );


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
    (instructor) => {

      setEditingId(
        instructor.id
      );


      setFormData({
        name:
          instructor.name ||
          "",

        email:
          instructor.email ||
          "",

        phone:
          instructor.phone ||
          "",

        specialization:
          instructor
            .specialization ||
          "",

        experience:
          Number(
            instructor
              .experience
          ) || 0,

        status:
          instructor.status ||
          "Available",
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


  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setFormData(
        (current) => ({
          ...current,

          [name]:
            name ===
            "experience"
              ? Number(value)
              : value,
        })
      );


      setErrors(
        (current) => ({
          ...current,
          [name]: undefined,
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
            `/instructors/${editingId}`,
            formData
          );

          setMessage(
            "Instructor updated successfully."
          );

        } else {

          await api.post(
            "/instructors",
            formData
          );

          setMessage(
            "Instructor added successfully."
          );
        }


        setDrawerOpen(false);
        setEditingId(null);

        setFormData({
          ...emptyForm,
        });


        await fetchInstructors();

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
            "Unable to save instructor."
          );
        }

      } finally {

        setSaving(false);
      }
    };


  const handleDelete =
    async (instructor) => {

      const confirmed =
        window.confirm(
          `Delete "${instructor.name}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setPageError("");
        setMessage("");


        await api.delete(
          `/instructors/${instructor.id}`
        );


        setMessage(
          "Instructor deleted successfully."
        );


        await fetchInstructors();

      } catch (error) {

        setPageError(
          error.response?.data
            ?.message ||
          "Unable to delete instructor."
        );
      }
    };


  if (loading) {

    return (
      <div className="premium-admin-loading">

        <span className="premium-spinner" />

        <p>{tr("Loading instructors...")}</p>

      </div>
    );
  }


  return (
    <div className="premium-admin-crud premium-instructors-page">

      <div className="premium-crud-heading">

        <div>

          <span>{tr("People")}</span>

          <h1>{tr("Instructors")}</h1>

          <p>{tr("Manage teaching staff, availability and course load.")}</p>

        </div>


        <button
          type="button"
          className="premium-add-button"
          onClick={openCreate}
        >
          <Plus size={17} />{tr("Add Instructor")}</button>

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


      <div className="premium-batch-stats">

        <article>
          <Users size={20} />
          <div>
            <strong>
              {instructors.length}
            </strong>
            <span>{tr("Total instructors")}</span>
          </div>
        </article>


        <article>
          <UserRoundCheck
            size={20}
          />
          <div>
            <strong>
              {availableCount}
            </strong>
            <span>{tr("Available")}</span>
          </div>
        </article>


        <article>
          <BriefcaseBusiness
            size={20}
          />
          <div>
            <strong>
              {totalCourses}
            </strong>
            <span>{tr("Assigned courses")}</span>
          </div>
        </article>

      </div>


      <div className="premium-batch-toolbar">

        <div className="premium-crud-search">

          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={
              (event) =>
                setSearch(
                  event.target.value
                )
            }
            placeholder={tr("Search name, email or specialization...")}
          />

        </div>


        <div className="premium-crud-filters">

          {[
            ["all", tr("All")],
            ["Available", tr("Available"),],
            ["Unavailable", tr("Unavailable"),],
          ].map(
            ([
              value,
              label,
            ]) => (

              <button
                key={value}
                type="button"
                className={
                  statusFilter ===
                  value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    value
                  )
                }
              >
                {label}
              </button>

            )
          )}

        </div>


        <span className="premium-result-count">
          {filtered.length} results
        </span>

      </div>


      {filtered.length ===
      0 ? (

        <div className="premium-admin-empty">

          <UserRoundCheck
            size={31}
          />

          <strong>{tr("No instructors found.")}</strong>

          <span>{tr("Add an instructor or change your filters.")}</span>

        </div>

      ) : (

        <div className="premium-instructor-grid">

          {filtered.map(
            (instructor) => (

              <article
                className="premium-instructor-card"
                key={
                  instructor.id
                }
              >

                <div className="premium-instructor-head">

                  <div className="premium-instructor-avatar">
                    {
                      instructor.name
                        ?.charAt(0)
                        ?.toUpperCase()
                      ||
                      "I"
                    }
                  </div>


                  <div>

                    <h2>
                      {instructor.name}
                    </h2>

                    <span>
                      {
                        instructor
                          .specialization ||
                        "English Instructor"
                      }
                    </span>

                  </div>


                  <span
                    className={
                      instructor.status ===
                      "Available"
                        ? "premium-status active"
                        : "premium-status inactive"
                    }
                  >
                    {
                      instructor.status
                    }
                  </span>

                </div>


                <div className="premium-instructor-contact">

                  <span>
                    <Mail size={15} />
                    {
                      instructor.email ||
                      "-"
                    }
                  </span>

                  <span>
                    <Phone size={15} />
                    {
                      instructor.phone ||
                      "-"
                    }
                  </span>

                </div>


                <div className="premium-instructor-meta">

                  <div>
                    <span>{tr("Experience")}</span>
                    <strong>
                      {
                        instructor
                          .experience ||
                        0
                      } years
                    </strong>
                  </div>

                  <div>
                    <span>{tr("Courses")}</span>
                    <strong>
                      {
                        instructor
                          .courses_count ||
                        0
                      }
                    </strong>
                  </div>

                </div>


                <div className="premium-instructor-actions">

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(
                        instructor
                      )
                    }
                  >
                    <Edit3 size={15} />{tr("Edit")}</button>


                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      handleDelete(
                        instructor
                      )
                    }
                  >
                    <Trash2 size={15} />{tr("Delete")}</button>

                </div>

              </article>

            )
          )}

        </div>

      )}


      {drawerOpen && (

        <>

          <button
            type="button"
            className="premium-drawer-backdrop"
            onClick={closeDrawer}
            aria-label={tr("Close instructor panel")}
          />


          <aside className="premium-edit-drawer premium-instructor-drawer">

            <div className="premium-drawer-head">

              <div>
                <span>{tr("Instructor")}</span>

                <h2>
                  {
                    editingId
                      ? "Edit Instructor"
                      : "Add Instructor"
                  }
                </h2>
              </div>


              <button
                type="button"
                onClick={closeDrawer}
                aria-label={tr("Close")}
              >
                <X size={19} />
              </button>

            </div>


            <form
              className="premium-edit-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="premium-field">

                <label>{tr("Name")}</label>

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

                <label>{tr("Specialization")}</label>

                <input
                  type="text"
                  name="specialization"
                  value={
                    formData
                      .specialization
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={tr("Grammar, Secondary, IELTS...")}
                />

              </div>


              <div className="premium-batch-two-fields">

                <div className="premium-field">

                  <label>{tr("Experience")}</label>

                  <input
                    type="number"
                    min="0"
                    name="experience"
                    value={
                      formData
                        .experience
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="premium-field">

                  <label>{tr("Status")}</label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="Available">{tr("Available")}</option>

                    <option value="Unavailable">{tr("Unavailable")}</option>
                  </select>

                </div>

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
                        ? "Save Changes"
                        : "Add Instructor"
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


export default Instructors;
