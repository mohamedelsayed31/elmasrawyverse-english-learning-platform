import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import LanguageToggle
  from "../components/LanguageToggle";


function Register() {
  const navigate =
    useNavigate();

  const {
    register,
  } = useAuth();

  const {
    t,
    isArabic,
  } = useLanguage();


  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });


  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  const handleChange =
    (event) => {

      setFormData(
        (current) => ({
          ...current,
          [event.target.name]:
            event.target.value,
        })
      );
    };


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setErrors({});
      setError("");
      setLoading(true);


      try {

        await register(
          formData
        );


        navigate(
          "/dashboard"
        );

      } catch (error) {

        if (
          error.response?.status ===
          422
        ) {

          setErrors(
            error.response
              .data
              .errors || {}
          );

        } else {

          setError(
            error.response
              ?.data
              ?.message ||
            t(
              "auth.registerError"
            )
          );
        }

      } finally {

        setLoading(false);
      }
    };


  return (
    <div className="auth-page">

      {/* Brand Panel */}

      <div className="auth-brand-panel">

        <Link
          to="/"
          className="auth-brand"
        >
          <GraduationCap size={32} />

          <span>
            ElmasrawyVerse
          </span>
        </Link>


        <div className="auth-brand-content">

          <span className="auth-eyebrow">
            {t(
              "auth.startLearning"
            )}
          </span>


          <h1>
            {t("auth.registerPanelTitle")}
          </h1>

          <p>
            {t("auth.registerPanelDescription")}
          </p>

        </div>


        <p className="auth-panel-footer">
          ElmasrawyVerse © 2026
        </p>

      </div>


      {/* Form */}

      <div className="auth-form-panel">

        <div className="auth-form-card register-card">

          <div className="auth-page-language">
            <LanguageToggle />
          </div>


          <div className="auth-mobile-brand">
            <GraduationCap size={28} />

            <span>
              ElmasrawyVerse
            </span>
          </div>


          <div className="auth-heading">

            <h2>
              {t(
                "auth.registerTitle"
              )}
            </h2>


            <p>
              {t("auth.registerSubtitle")}
            </p>

          </div>


          {error && (
            <div className="auth-error error-message">
              {error}
            </div>
          )}


          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* Name */}

            <div className="auth-field">

              <label>
                {t(
                  "auth.fullName"
                )}
              </label>


              <div className="auth-input-wrapper">

                <User size={18} />

                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder={
                    t(
                      "auth.fullNamePlaceholder"
                    )
                  }
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {errors.name && (
                <span className="field-error">
                  {errors.name[0]}
                </span>
              )}

            </div>


            {/* Email */}

            <div className="auth-field">

              <label>
                {t(
                  "auth.email"
                )}
              </label>


              <div className="auth-input-wrapper">

                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={
                    t(
                      "auth.emailPlaceholder"
                    )
                  }
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {errors.email && (
                <span className="field-error">
                  {errors.email[0]}
                </span>
              )}

            </div>


            {/* Phone */}

            <div className="auth-field">

              <label>
                {t(
                  "auth.phone"
                )}
              </label>


              <div className="auth-input-wrapper">

                <Phone size={18} />

                <input
                  type="text"
                  name="phone"
                  autoComplete="tel"
                  placeholder={
                    t(
                      "auth.phonePlaceholder"
                    )
                  }
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {errors.phone && (
                <span className="field-error">
                  {errors.phone[0]}
                </span>
              )}

            </div>


            {/* Passwords */}

            <div className="auth-two-fields">

              <div className="auth-field">

                <label>
                  {t(
                    "auth.password"
                  )}
                </label>


                <div className="auth-input-wrapper">

                  <Lock size={18} />

                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder={
                      t(
                        "auth.passwordPlaceholder"
                      )
                    }
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="auth-field">

                <label>
                  {t(
                    "auth.confirmPassword"
                  )}
                </label>


                <div className="auth-input-wrapper">

                  <Lock size={18} />

                  <input
                    type="password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    placeholder={
                      t(
                        "auth.confirmPasswordPlaceholder"
                      )
                    }
                    value={
                      formData
                        .password_confirmation
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>


            {errors.password && (
              <span className="field-error auth-password-error">
                {errors.password[0]}
              </span>
            )}


            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? t(
                    "auth.creatingAccount"
                  )
                : (
                  <>
                    {t(
                      "auth.createAccount"
                    )}

                    <ArrowRight
                      size={18}
                      style={{
                        transform:
                          isArabic
                            ? "rotate(180deg)"
                            : "none",
                      }}
                    />
                  </>
                )
              }

            </button>

          </form>


          <p className="auth-switch">

            {t(
              "auth.alreadyAccount"
            )}{" "}

            <Link to="/login">
              {t(
                "auth.signIn"
              )}
            </Link>

          </p>


          <Link
            to="/"
            className="auth-back-home"
          >
            {t(
              "auth.backWebsite"
            )}
          </Link>

        </div>

      </div>

    </div>
  );
}


export default Register;
