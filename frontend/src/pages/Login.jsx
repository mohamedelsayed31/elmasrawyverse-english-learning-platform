import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import LanguageToggle from "../components/LanguageToggle";


function Login() {
  const navigate =
    useNavigate();

  const { login } =
    useAuth();

  const {
    t,
    isArabic,
  } = useLanguage();


  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });


  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });

  };


  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");
      setLoading(true);


      try {

        const user =
          await login(
            formData.email,
            formData.password
          );


        if (
          user.role === "admin"
        ) {

          navigate(
            "/admin/dashboard"
          );

        } else {

          navigate(
            "/dashboard"
          );

        }

      } catch (error) {

        setError(
          error.response?.data
            ?.message ||
          t("auth.loginError")
        );

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

          <GraduationCap
            size={32}
          />

          <span>
            ElmasrawyVerse
          </span>

        </Link>


        <div className="auth-brand-content">

          <span className="auth-eyebrow">
            {t("auth.platform")}
          </span>


          <h1>
            {t(
              "auth.loginPanelTitle"
            )}
          </h1>


          <p>
            {t(
              "auth.loginPanelDescription"
            )}
          </p>

        </div>


        <p className="auth-panel-footer">
          ElmasrawyVerse © 2026
        </p>

      </div>


      {/* Form */}

      <div className="auth-form-panel">

        <div className="auth-form-card">

          <div className="auth-page-language">
            <LanguageToggle />
          </div>


          <div className="auth-mobile-brand">

            <GraduationCap
              size={30}
            />

            <span>
              ElmasrawyVerse
            </span>

          </div>


          <div className="auth-heading">

            <h2>
              {t(
                "auth.welcomeBack"
              )}
            </h2>

            <p>
              {t(
                "auth.loginSubtitle"
              )}
            </p>

          </div>


          {error && (

            <div className="auth-error">
              {error}
            </div>

          )}


          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* Email */}

            <div className="auth-field">

              <label>
                {t("auth.email")}
              </label>


              <div className="auth-input-wrapper">

                <Mail size={18} />


                <input
                  type="email"
                  name="email"
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
                  required
                />

              </div>

            </div>


            {/* Password */}

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
                  required
                />

              </div>

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading ? (

                t(
                  "auth.signingIn"
                )

              ) : (

                <>

                  {t(
                    "auth.signIn"
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

              )}

            </button>

          </form>


          <p className="auth-switch">

            {t(
              "auth.noAccount"
            )}{" "}

            <Link to="/register">

              {t(
                "auth.createAccount"
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


export default Login;