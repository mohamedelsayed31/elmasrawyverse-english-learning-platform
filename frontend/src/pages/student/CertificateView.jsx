import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    ArrowLeft,
    Award,
    CheckCircle2,
    ExternalLink,
    Printer,
    QrCode,
    ShieldCheck,
  } from "lucide-react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import api
    from "../../services/api";

  import {
    useLanguage,
  } from "../../context/LanguageContext";
  
  
  const normalizeCertificate =
    (certificate) => {
  
      const student =
        certificate.student ||
        certificate.enrollment
          ?.student ||
        {};
  
      const course =
        certificate.course ||
        certificate.enrollment
          ?.course ||
        {};
  
      const instructor =
        course.instructor ||
        certificate.instructor ||
        {};
  
      const grade =
        course.grade ||
        certificate.grade ||
        {};
  
      const stage =
        grade.academic_stage ||
        grade.academicStage ||
        certificate.academic_stage ||
        {};
  
  
      const verificationCode =
        certificate
          .verification_code ||
        certificate
          .certificate_number ||
        certificate
          .certificate_code ||
        certificate.code ||
        `EV-${certificate.id}`;
  
  
      const qrCandidate =
        certificate
          .qr_code_url ||
        certificate
          .qr_image_url ||
        certificate
          .qr_url ||
        certificate
          .qr_code ||
        "";
  
  
      const canRenderQr =
        typeof qrCandidate ===
          "string" &&
        (
          qrCandidate.startsWith(
            "data:image"
          ) ||
          qrCandidate.startsWith(
            "http://"
          ) ||
          qrCandidate.startsWith(
            "https://"
          ) ||
          qrCandidate.startsWith("/")
        );
  
  
      return {
        ...certificate,
  
        studentName:
          student.name ||
          certificate.student_name ||
          "Student",
  
        courseTitle:
          course.title ||
          certificate.course_title ||
          "Completed Course",
  
        instructorName:
          instructor.name ||
          certificate
            .instructor_name ||
          "ElmasrawyVerse Academic Team",
  
        gradeName:
          grade.name ||
          certificate.grade_name ||
          "",
  
        stageName:
          stage.name ||
          certificate.stage_name ||
          "",
  
        certificateNumber:
          certificate
            .certificate_number ||
          certificate
            .certificate_code ||
          verificationCode,
  
        verificationCode,
  
        verificationUrl:
          certificate
            .verification_url ||
          certificate
            .verify_url ||
          certificate
            .public_verification_url ||
          "",
  
        qrImage:
          canRenderQr
            ? qrCandidate
            : "",
  
        issuedAt:
          certificate.issued_at ||
          certificate.created_at ||
          null,
  
        isRevoked:
          Boolean(
            certificate.revoked_at
          ) ||
          String(
            certificate.status ||
            ""
          ).toLowerCase() ===
            "revoked",
      };
    };
  
  
  function CertificateView() {
    const params =
      useParams();
  
    const navigate =
      useNavigate();

    const {
      t,
      language,
    tr,
  } = useLanguage();
  
  
    const certificateId =
      params.certificateId ||
      params.id;
  
  
    const [
      certificate,
      setCertificate,
    ] = useState(null);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState("");
  
  
    useEffect(() => {
  
      const fetchCertificate =
        async () => {
  
          if (!certificateId) {
  
            setError(
              t("finalUi.certificates.certificateMissing")
            );
  
            setLoading(false);
  
            return;
          }
  
  
          try {
  
            setLoading(true);
            setError("");
  
  
            const response =
              await api.get(
                `/my/certificates/${certificateId}`
              );
  
  
            const raw =
              response.data
                ?.certificate ||
              response.data
                ?.data ||
              response.data;
  
  
            setCertificate(
              normalizeCertificate(
                raw
              )
            );
  
          } catch (error) {
  
            setError(
              error.response?.data
                ?.message ||
              t("finalUi.certificates.loadError")
            );
  
          } finally {
  
            setLoading(false);
          }
        };
  
  
      fetchCertificate();
  
    }, [certificateId, t]);
  
  
    const academicLabel =
      useMemo(
        () =>
          [
            certificate
              ?.stageName,
            certificate
              ?.gradeName,
          ]
            .filter(Boolean)
            .join(" • "),
        [certificate]
      );
  
  
    const formatDate =
      (value) => {
  
        if (!value) {
          return "—";
        }
  
  
        const date =
          new Date(value);
  
  
        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
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
  
  
    const handlePrint =
      () => {
  
        window.print();
      };
  
  
    if (loading) {
  
      return (
        <div className="student-dashboard-loading">
  
          <span className="ev-loading-orbit" />
  
          <p>
            {t("finalUi.certificates.loadingCertificate")}
          </p>
  
        </div>
      );
    }
  
  
    if (
      error ||
      !certificate
    ) {
  
      return (
        <div className="premium-certificate-error">
  
          <Award size={35} />
  
          <h2>
            {t("finalUi.certificates.certificateUnavailable")}
          </h2>
  
          <p>
            {
              error ||
              t("finalUi.certificates.certificateNotFound")
            }
          </p>
  
          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft size={16} />
            {t("common.back")}
          </button>
  
        </div>
      );
    }
  
  
    return (
      <div className="certificate-page premium-certificate-page">
  
        {/* =================================
            Actions — hidden on print
        ================================= */}
  
        <div className="certificate-toolbar premium-certificate-toolbar no-print">
  
          <button
            type="button"
            className="premium-certificate-back"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft size={17} />
            {t("finalUi.certificates.myCertificatesBack")}
          </button>
  
  
          <div className="premium-certificate-toolbar-actions">
  
            {
              certificate
                .verificationUrl && (
  
                <a
                  href={
                    certificate
                      .verificationUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="premium-certificate-verify-link"
                >
                  <ShieldCheck
                    size={16}
                  />
                  {t("finalUi.certificates.verify")}
                  <ExternalLink
                    size={13}
                  />
                </a>
  
              )
            }
  
  
            <button
              type="button"
              className="premium-certificate-print-button"
              onClick={
                handlePrint
              }
            >
              <Printer size={17} />
              {t("finalUi.certificates.print")}
            </button>
  
          </div>
  
        </div>
  
  
        {
          certificate.isRevoked && (
  
            <div className="premium-certificate-revoked-alert no-print">
              {t("finalUi.certificates.revokedAlert")}
            </div>
  
          )
        }
  
  
        {/* =================================
            Printable Certificate
        ================================= */}
  
        <div className="certificate-print-area">
  
          <article
            className={
              certificate.isRevoked
                ? "certificate-document premium-certificate-document revoked"
                : "certificate-document premium-certificate-document"
            }
          >
  
            <div className="certificate-inner premium-certificate-inner">
  
              {/* Decorative geometry */}
  
              <span className="premium-certificate-corner top-left" />
              <span className="premium-certificate-corner top-right" />
              <span className="premium-certificate-corner bottom-left" />
              <span className="premium-certificate-corner bottom-right" />
  
  
              {/* Brand */}
  
              <div className="certificate-brand premium-certificate-brand">
  
                <div className="certificate-logo premium-certificate-logo">
                  EV
                </div>
  
  
                <div>
  
                  <h2>
                    ElmasrawyVerse
                  </h2>
  
                  <span>{tr("English Learning Platform")}</span>
  
                </div>
  
              </div>
  
  
              <div className="premium-certificate-validity">
  
                {
                  certificate.isRevoked
                    ? "REVOKED"
                    : (
                      <>
                        <CheckCircle2
                          size={14}
                        />{tr("Verified Credential")}</>
                    )
                }
  
              </div>
  
  
              {/* Main */}
  
              <div className="premium-certificate-main">
  
                <div className="premium-certificate-seal">
                  <Award size={36} />
                </div>
  
  
                <span className="certificate-small-title">{tr("CERTIFICATE OF COMPLETION")}</span>
  
  
                <h1>{tr("Achievement Certificate")}</h1>
  
  
                <p className="certificate-presented">{tr("This certificate is proudly presented to")}</p>
  
  
                <h2 className="certificate-student-name">
                  {
                    certificate
                      .studentName
                  }
                </h2>
  
  
                <div className="certificate-name-line" />
  
  
                <p className="certificate-completion-text">{tr("for successfully completing all learning requirements of")}</p>
  
  
                <h3 className="certificate-course-title">
                  {
                    certificate
                      .courseTitle
                  }
                </h3>
  
  
                <p className="certificate-course-meta">
                  {
                    academicLabel ||
                    "ElmasrawyVerse English Program"
                  }
                </p>
  
              </div>
  
  
              {/* Footer */}
  
              <div className="certificate-footer premium-certificate-footer">
  
                <div className="premium-certificate-footer-column">
  
                  <div className="certificate-detail">
  
                    <strong>
                      {
                        formatDate(
                          certificate
                            .issuedAt
                        )
                      }
                    </strong>
  
                    <span>{tr("Date of Issue")}</span>
  
                  </div>
  
  
                  <div className="certificate-detail">
  
                    <strong>
                      {
                        certificate
                          .certificateNumber
                      }
                    </strong>
  
                    <span>{tr("Certificate Number")}</span>
  
                  </div>
  
                </div>
  
  
                <div className="premium-certificate-signature">
  
                  <div className="premium-signature-line">
                    ElmasrawyVerse
                  </div>
  
                  <strong>
                    {
                      certificate
                        .instructorName
                    }
                  </strong>
  
                  <span>{tr("Academic Approval")}</span>
  
                </div>
  
  
                <div className="certificate-verification premium-certificate-verification">
  
                  {
                    certificate
                      .qrImage
                      ? (
                        <img
                          src={
                            certificate
                              .qrImage
                          }
                          alt="Certificate verification QR code"
                          className="premium-certificate-qr"
                        />
                      )
                      : (
                        <div className="premium-certificate-qr-placeholder">
                          <QrCode size={35} />
                        </div>
                      )
                  }
  
  
                  <div>
  
                    <div className="certificate-verified">
                      <ShieldCheck
                        size={14}
                      />{tr("Verify credential")}</div>
  
                    <span>{tr("Scan the QR code or use the verification code.")}</span>
  
                    <strong className="certificate-verification-code">
                      {
                        certificate
                          .verificationCode
                      }
                    </strong>
  
                  </div>
  
                </div>
  
              </div>
  
  
              <div className="premium-certificate-bottom-mark">{tr("Authentic digital credential \u2022 ElmasrawyVerse")}</div>
  
            </div>
  
          </article>
  
        </div>
  
      </div>
    );
  }
  
  
  export default CertificateView;
  