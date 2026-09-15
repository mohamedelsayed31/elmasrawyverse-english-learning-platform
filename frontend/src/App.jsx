import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AdminRoute
  from "./components/AdminRoute";
import PageLoader
  from "./components/PageLoader";
import StudentRoute
  from "./components/StudentRoute";

import AdminLayout
  from "./layouts/AdminLayout";
import PublicLayout
  from "./layouts/PublicLayout";
import StudentLayout
  from "./layouts/StudentLayout";


// Route-level lazy loading keeps the production bundle small
// without changing any existing URLs or page behavior.
const Login = lazy(
  () => import("./pages/Login")
);
const Register = lazy(
  () => import("./pages/Register")
);
const NotFound = lazy(
  () => import("./pages/NotFound")
);

const Home = lazy(
  () => import("./pages/public/Home")
);
const PublicCourses = lazy(
  () => import("./pages/public/PublicCourses")
);
const CourseDetails = lazy(
  () => import("./pages/public/CourseDetails")
);
const VerifyCertificate = lazy(
  () => import("./pages/public/VerifyCertificate")
);

const StudentDashboard = lazy(
  () => import("./pages/student/StudentDashboard")
);
const MyCourses = lazy(
  () => import("./pages/student/MyCourses")
);
const MyAssignments = lazy(
  () => import("./pages/student/MyAssignments")
);
const MySubmissions = lazy(
  () => import("./pages/student/MySubmissions")
);
const StudentAssessments = lazy(
  () => import("./pages/student/StudentAssessments")
);
const TakeAssessment = lazy(
  () => import("./pages/student/TakeAssessment")
);
const AssessmentResult = lazy(
  () => import("./pages/student/AssessmentResult")
);
const AssessmentHistory = lazy(
  () => import("./pages/student/AssessmentHistory")
);
const CourseLearning = lazy(
  () => import("./pages/student/CourseLearning")
);
const Certificates = lazy(
  () => import("./pages/student/Certificates")
);
const CertificateView = lazy(
  () => import("./pages/student/CertificateView")
);
const StudentProgressAnalytics = lazy(
  () => import("./pages/student/StudentProgressAnalytics")
);

const AdminDashboard = lazy(
  () => import("./pages/admin/AdminDashboard")
);
const Students = lazy(
  () => import("./pages/admin/Students")
);
const Instructors = lazy(
  () => import("./pages/admin/Instructors")
);
const Courses = lazy(
  () => import("./pages/admin/Courses")
);
const Enrollments = lazy(
  () => import("./pages/admin/Enrollments")
);
const Assignments = lazy(
  () => import("./pages/admin/Assignments")
);
const Submissions = lazy(
  () => import("./pages/admin/Submissions")
);
const CourseContent = lazy(
  () => import("./pages/admin/CourseContent")
);
const SectionContent = lazy(
  () => import("./pages/admin/SectionContent")
);
const QuestionBank = lazy(
  () => import("./pages/admin/QuestionBank")
);
const Assessments = lazy(
  () => import("./pages/admin/Assessments")
);
const AssessmentQuestions = lazy(
  () => import("./pages/admin/AssessmentQuestions")
);
const AssessmentResults = lazy(
  () => import("./pages/admin/AssessmentResults")
);
const AssessmentAttemptReview = lazy(
  () => import("./pages/admin/AssessmentAttemptReview")
);
const AdminCertificates = lazy(
  () => import("./pages/admin/AdminCertificates")
);
const StudentInsight = lazy(
  () => import("./pages/admin/StudentInsight")
);


function AppRoutes() {
  return (
    <Routes>

      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<PublicCourses />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route
          path="/verify-certificate/:verificationCode"
          element={<VerifyCertificate />}
        />
      </Route>

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student */}
      <Route
        element={
          <StudentRoute>
            <StudentLayout />
          </StudentRoute>
        }
      >
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/my-courses/:courseId" element={<CourseLearning />} />
        <Route path="/my-assignments" element={<MyAssignments />} />
        <Route path="/my-submissions" element={<MySubmissions />} />
        <Route path="/my-progress" element={<StudentProgressAnalytics />} />

        <Route path="/student/assessments" element={<StudentAssessments />} />
        <Route
          path="/student/assessment-attempts/:attemptId"
          element={<TakeAssessment />}
        />
        <Route
          path="/student/assessment-attempts/:attemptId/result"
          element={<AssessmentResult />}
        />
        <Route
          path="/student/assessments/:assessmentId/history"
          element={<AssessmentHistory />}
        />

        <Route path="/student/certificates" element={<Certificates />} />
        <Route
          path="/student/certificates/:certificateId"
          element={<CertificateView />}
        />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentId/insights" element={<StudentInsight />} />
        <Route path="instructors" element={<Instructors />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId/content" element={<CourseContent />} />
        <Route
          path="courses/:courseId/sections/:sectionId/content"
          element={<SectionContent />}
        />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="assessments" element={<Assessments />} />
        <Route
          path="assessments/:assessmentId/questions"
          element={<AssessmentQuestions />}
        />
        <Route path="assessment-results" element={<AssessmentResults />} />
        <Route
          path="assessment-results/:attemptId"
          element={<AssessmentAttemptReview />}
        />
        <Route path="certificates" element={<AdminCertificates />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}


export default App;
