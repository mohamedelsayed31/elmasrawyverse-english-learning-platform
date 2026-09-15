import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  CalendarDays,
  CheckCircle2,
  Eye,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


const asArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload?.certificates ||
    payload?.data?.data ||
    payload?.data ||
    []
  );
};


const normalizeCertificate = (certificate) => {
  const student =
    certificate.student ||
    certificate.enrollment?.student ||
    {};

  const course =
    certificate.course ||
    certificate.enrollment?.course ||
    {};

  const grade =
    course.grade || certificate.grade || {};

  const stage =
    grade.academic_stage ||
    grade.academicStage ||
    certificate.academic_stage ||
    {};

  return {
    ...certificate,
    studentName:
      student.name || certificate.student_name || "Student",
    courseTitle:
      course.title || certificate.course_title || "Completed Course",
    gradeName:
      grade.name || certificate.grade_name || "",
    stageName:
      stage.name || certificate.stage_name || "",
    certificateNumber:
      certificate.certificate_number ||
      certificate.certificate_code ||
      certificate.verification_code ||
      certificate.code ||
      `EV-${certificate.id}`,
    issuedAt:
      certificate.issued_at || certificate.created_at || null,
    isRevoked:
      Boolean(certificate.revoked_at) ||
      String(certificate.status || "").toLowerCase() === "revoked",
  };
};


function Certificates() {
  const navigate =
    useNavigate();

  const {
    t,
    language,
  } = useLanguage();

  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get("/my/certificates");

        setCertificates(
          asArray(response.data).map(normalizeCertificate)
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
          t("finalUi.certificates.loadError")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [t]);


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return certificates;
    }

    return certificates.filter((certificate) =>
      [
        certificate.courseTitle,
        certificate.studentName,
        certificate.gradeName,
        certificate.stageName,
        certificate.certificateNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [certificates, search]);


  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      language === "ar" ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };


  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <span className="ev-loading-orbit" />
        <p>{t("finalUi.certificates.loading")}</p>
      </div>
    );
  }


  return (
    <div className="premium-certificates-page">
      <div className="premium-certificates-header">
        <div>
          <span>{t("finalUi.certificates.achievements")}</span>
          <h1>{t("finalUi.certificates.myCertificates")}</h1>
          <p>{t("finalUi.certificates.description")}</p>
        </div>

        <div className="premium-certificates-count">
          <Award size={20} />
          <div>
            <strong>{certificates.length}</strong>
            <span>{t("finalUi.certificates.earned")}</span>
          </div>
        </div>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {certificates.length > 0 && (
        <div className="premium-certificate-search">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("finalUi.certificates.search")}
          />
        </div>
      )}


      {filtered.length === 0 ? (
        <div className="premium-certificate-empty">
          <Award size={35} />
          <h2>
            {certificates.length
              ? t("finalUi.certificates.noMatching")
              : t("finalUi.certificates.noCertificates")}
          </h2>
          <p>
            {certificates.length
              ? t("finalUi.certificates.noMatchingDescription")
              : t("finalUi.certificates.noCertificatesDescription")}
          </p>
        </div>
      ) : (
        <div className="premium-certificate-grid">
          {filtered.map((certificate) => (
            <article
              className={
                certificate.isRevoked
                  ? "premium-certificate-card revoked"
                  : "premium-certificate-card"
              }
              key={certificate.id}
            >
              <div className="premium-certificate-card-ribbon">
                <Award size={22} />
              </div>

              <div className="premium-certificate-card-top">
                <span>{t("finalUi.certificates.completion")}</span>
                <div
                  className={
                    certificate.isRevoked
                      ? "premium-certificate-state revoked"
                      : "premium-certificate-state active"
                  }
                >
                  {certificate.isRevoked
                    ? t("finalUi.certificates.revoked")
                    : (
                      <>
                        <CheckCircle2 size={13} />
                        {t("finalUi.certificates.verified")}
                      </>
                    )}
                </div>
              </div>

              <h2>{certificate.courseTitle}</h2>

              <p className="premium-certificate-academic">
                {[certificate.stageName, certificate.gradeName]
                  .filter(Boolean)
                  .join(" • ") || "ElmasrawyVerse Learning"}
              </p>

              <div className="premium-certificate-code">
                {certificate.certificateNumber}
              </div>

              <div className="premium-certificate-card-meta">
                <div>
                  <CalendarDays size={15} />
                  <span>{t("finalUi.certificates.issued")}</span>
                  <strong>{formatDate(certificate.issuedAt)}</strong>
                </div>

                <div>
                  <ShieldCheck size={15} />
                  <span>{t("finalUi.certificates.credential")}</span>
                  <strong>{t("finalUi.certificates.digitalVerifiable")}</strong>
                </div>
              </div>

              <button
                type="button"
                className="premium-certificate-open"
                onClick={() => navigate(`/student/certificates/${certificate.id}`)}
              >
                <Eye size={16} />
                {t("finalUi.certificates.viewCertificate")}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


export default Certificates;
