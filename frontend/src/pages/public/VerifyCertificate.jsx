import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  Award,
  CheckCircle2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import api
  from "../../services/api";

import {
  useLanguage,
} from "../../context/LanguageContext";


function VerifyCertificate() {
  const { verificationCode } =
    useParams();

  const {
    t,
    language,
  } = useLanguage();

  const [certificate, setCertificate] = useState(null);
  const [valid, setValid] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            `/public/certificates/verify/${verificationCode}`
          );

        setValid(response.data.valid);
        setCertificate(response.data.certificate);
      } catch {
        setValid(false);
        setCertificate(null);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [verificationCode]);


  if (loading) {
    return (
      <div className="certificate-verify-page">
        <div className="certificate-verify-card">
          <p>{t("finalUi.verify.verifying")}</p>
        </div>
      </div>
    );
  }


  if (!valid) {
    return (
      <div className="certificate-verify-page">
        <div className="certificate-verify-card invalid">
          <XCircle size={58} />
          <h1>{t("finalUi.verify.invalidTitle")}</h1>
          <p>{t("finalUi.verify.invalidDescription")}</p>
          <div className="verification-code-display">
            {verificationCode}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="certificate-verify-page">
      <div className="certificate-verify-card valid">
        <div className="verify-brand">
          <div className="certificate-logo">EV</div>
          <strong>ElmasrawyVerse</strong>
        </div>

        <CheckCircle2
          size={64}
          className="verify-success-icon"
        />

        <h1>{t("finalUi.verify.verifiedTitle")}</h1>
        <p>{t("finalUi.verify.verifiedDescription")}</p>

        <div className="verified-certificate-data">
          <div>
            <span>{t("finalUi.verify.student")}</span>
            <strong>{certificate?.student_name}</strong>
          </div>

          <div>
            <span>{t("finalUi.verify.course")}</span>
            <strong>{certificate?.course_title}</strong>
          </div>

          <div>
            <span>{t("finalUi.verify.certificateId")}</span>
            <strong>{certificate?.certificate_number}</strong>
          </div>

          <div>
            <span>{t("finalUi.verify.issued")}</span>
            <strong>
              {certificate?.issued_at
                ? new Date(certificate.issued_at).toLocaleDateString(
                    language === "ar" ? "ar-EG" : "en-US"
                  )
                : "-"}
            </strong>
          </div>
        </div>

        <div className="verify-authenticity">
          <ShieldCheck size={18} />
          {t("finalUi.verify.authenticity")}
        </div>

        <Award className="verify-background-award" />
      </div>
    </div>
  );
}


export default VerifyCertificate;
