import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  Ban,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


const normalize = (certificate) => {
  const student =
    certificate.student ||
    certificate.enrollment?.student ||
    {};

  const course =
    certificate.course ||
    certificate.enrollment?.course ||
    {};

  return {
    ...certificate,
    studentName:
      student.name || certificate.student_name || "-",
    studentEmail:
      student.email ||
      student.user?.email ||
      certificate.student_email ||
      "-",
    courseTitle:
      course.title || certificate.course_title || "-",
    code:
      certificate.certificate_number ||
      certificate.verification_code ||
      certificate.certificate_code ||
      certificate.code ||
      `EV-${certificate.id}`,
    issuedAt:
      certificate.issued_at || certificate.created_at || null,
    revoked:
      Boolean(certificate.revoked_at) ||
      String(certificate.status || "").toLowerCase() === "revoked",
  };
};


const metric = (analytics, names, fallback = 0) => {
  for (const name of names) {
    if (analytics?.[name] !== undefined) {
      return analytics[name];
    }
  }

  return fallback;
};


function AdminCertificates() {
  const {
    t,
    language,
    tr,
  } = useLanguage();

  const [certificates, setCertificates] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [listResponse, analyticsResponse] =
        await Promise.allSettled([
          api.get("/admin/certificates"),
          api.get("/admin/certificates/analytics"),
        ]);

      if (listResponse.status === "rejected") {
        throw listResponse.reason;
      }

      const payload = listResponse.value.data;
      const raw =
        payload.certificates ||
        payload.data?.data ||
        payload.data ||
        [];

      setCertificates(
        Array.isArray(raw)
          ? raw.map(normalize)
          : []
      );

      if (analyticsResponse.status === "fulfilled") {
        const analyticsPayload = analyticsResponse.value.data;

        setAnalytics(
          analyticsPayload.analytics ||
          analyticsPayload.summary ||
          analyticsPayload ||
          {}
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        t("finalUi.adminCertificates.loadError")
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [t]);


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const matchesSearch =
        !term ||
        [
          certificate.studentName,
          certificate.studentEmail,
          certificate.courseTitle,
          certificate.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        status === "all" ||
        (status === "active"
          ? !certificate.revoked
          : certificate.revoked);

      return matchesSearch && matchesStatus;
    });
  }, [certificates, search, status]);


  const activeCount =
    certificates.filter((item) => !item.revoked).length;

  const revokedCount =
    certificates.length - activeCount;

  const uniqueStudents =
    new Set(
      certificates.map((item) =>
        item.student_id ||
        item.enrollment?.student_id ||
        item.studentName
      )
    ).size;


  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString(
      language === "ar" ? "ar-EG" : "en-US"
    );
  };


  const handleRevoke = async (certificate) => {
    const reason =
      window.prompt(t("finalUi.adminCertificates.revokePrompt"));

    if (reason === null) {
      return;
    }

    try {
      setActionId(certificate.id);
      setMessage("");
      setError("");

      await api.put(
        `/admin/certificates/${certificate.id}/revoke`,
        reason ? { reason } : {}
      );

      setMessage(t("finalUi.adminCertificates.revokedSuccess"));
      await fetchData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
        t("finalUi.adminCertificates.revokeError")
      );
    } finally {
      setActionId(null);
    }
  };


  const handleReissue = async (certificate) => {
    const confirmation =
      t("finalUi.adminCertificates.reissueConfirm")
        .replace("{name}", certificate.studentName);

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setActionId(certificate.id);
      setMessage("");
      setError("");

      await api.put(
        `/admin/certificates/${certificate.id}/reissue`
      );

      setMessage(t("finalUi.adminCertificates.reissuedSuccess"));
      await fetchData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
        t("finalUi.adminCertificates.reissueError")
      );
    } finally {
      setActionId(null);
    }
  };


  if (loading) {
    return (
      <div className="premium-admin-loading">
        <span className="premium-spinner" />
        <p>{t("finalUi.adminCertificates.loading")}</p>
      </div>
    );
  }


  return (
    <div className="premium-admin-crud premium-admin-certificates">
      <div className="premium-crud-heading">
        <div>
          <span>{t("finalUi.adminCertificates.eyebrow")}</span>
          <h1>{t("finalUi.adminCertificates.title")}</h1>
          <p>{t("finalUi.adminCertificates.description")}</p>
        </div>
      </div>


      {message && (
        <div className="success-message">{message}</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}


      <div className="premium-certificate-stats">
        <article>
          <Award size={20} />
          <span>{t("finalUi.adminCertificates.totalIssued")}</span>
          <strong>
            {metric(
              analytics,
              ["total", "total_certificates", "issued"],
              certificates.length
            )}
          </strong>
        </article>

        <article>
          <ShieldCheck size={20} />
          <span>{t("finalUi.adminCertificates.active")}</span>
          <strong>
            {metric(
              analytics,
              ["active", "active_certificates"],
              activeCount
            )}
          </strong>
        </article>

        <article>
          <Ban size={20} />
          <span>{t("finalUi.adminCertificates.revoked")}</span>
          <strong>
            {metric(
              analytics,
              ["revoked", "revoked_certificates"],
              revokedCount
            )}
          </strong>
        </article>

        <article>
          <Users size={20} />
          <span>{t("finalUi.adminCertificates.students")}</span>
          <strong>
            {metric(
              analytics,
              ["students", "students_with_certificates", "unique_students"],
              uniqueStudents
            )}
          </strong>
        </article>
      </div>


      <div className="premium-certificate-toolbar">
        <div className="premium-certificate-search">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("finalUi.adminCertificates.search")}
          />
        </div>

        <div className="premium-crud-filters">
          {[
            ["all", t("finalUi.adminCertificates.all")],
            ["active", t("finalUi.adminCertificates.active")],
            ["revoked", t("finalUi.adminCertificates.revoked")],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={status === value ? "active" : ""}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="premium-result-count">
          {filtered.length} {t("finalUi.adminCertificates.results")}
        </span>
      </div>


      {filtered.length === 0 ? (
        <div className="premium-admin-empty">
          <Award size={31} />
          <strong>{t("finalUi.adminCertificates.noCertificates")}</strong>
          <span>{t("finalUi.adminCertificates.noCertificatesDescription")}</span>
        </div>
      ) : (
        <div className="premium-certificate-table-wrap">
          <table className="premium-certificate-table">
            <thead>
              <tr>
                <th>{t("finalUi.adminCertificates.student")}</th>
                <th>{t("finalUi.adminCertificates.course")}</th>
                <th>{t("finalUi.adminCertificates.certificate")}</th>
                <th>{t("finalUi.adminCertificates.issued")}</th>
                <th>{t("finalUi.adminCertificates.status")}</th>
                <th>{t("finalUi.adminCertificates.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((certificate) => (
                <tr key={certificate.id}>
                  <td>
                    <strong>{certificate.studentName}</strong>
                    <span>{certificate.studentEmail}</span>
                  </td>

                  <td>{certificate.courseTitle}</td>

                  <td>
                    <code>{certificate.code}</code>
                  </td>

                  <td>{formatDate(certificate.issuedAt)}</td>

                  <td>
                    <span
                      className={
                        certificate.revoked
                          ? "premium-cert-state revoked"
                          : "premium-cert-state active"
                      }
                    >
                      {certificate.revoked
                        ? t("finalUi.adminCertificates.revoked")
                        : (
                          <>
                            <CheckCircle2 size={12} />
                            {t("finalUi.adminCertificates.active")}
                          </>
                        )}
                    </span>
                  </td>

                  <td>
                    <div className="premium-cert-actions">
                      {certificate.revoked ? (
                        <button
                          type="button"
                          onClick={() => handleReissue(certificate)}
                          disabled={actionId === certificate.id}
                        >
                          <RefreshCw size={14} />
                          {t("finalUi.adminCertificates.reissue")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleRevoke(certificate)}
                          disabled={actionId === certificate.id}
                        >
                          <Ban size={14} />
                          {t("finalUi.adminCertificates.revoke")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


export default AdminCertificates;
