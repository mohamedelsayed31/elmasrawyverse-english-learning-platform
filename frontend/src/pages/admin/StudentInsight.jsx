import {
    useParams,
  } from "react-router-dom";
  
  import StudentProgressAnalytics
    from "../student/StudentProgressAnalytics";
  
  
  function StudentInsight() {
    const {
      studentId,
    } = useParams();
  
  
    return (
      <StudentProgressAnalytics
        studentId={
          studentId
        }
        adminMode
      />
    );
  }
  
  
  export default StudentInsight;