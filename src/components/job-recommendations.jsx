import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import JobCard from "@/components/job-card";
import { getRecommendedJobs } from "@/api/apiJobs";
import { getUserCvData } from "@/api/apiApplication";
import useFetch from "@/hooks/use-fetch";

const JobRecommendations = () => {
  const { isLoaded, user } = useUser();
  
  const {
    data: cvData,
    fn: fnCvData,
  } = useFetch(getUserCvData, { user_id: user?.id });
  
  const {
    loading: loadingJobs,
    data: recommendedJobs,
    fn: fnJobs,
  } = useFetch(getRecommendedJobs, cvData);

  useEffect(() => {
    if (isLoaded && user?.id && user?.unsafeMetadata?.role === "candidate") {
      fnCvData();
    }
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (cvData) {
      console.log("CV Data in JobRecommendations:", cvData);
      fnJobs();
    }
  }, [cvData]);

  if (!isLoaded || user?.unsafeMetadata?.role !== "candidate") {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Recommended Jobs for You</h2>
      {loadingJobs && <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />}
      
      {!loadingJobs && recommendedJobs?.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="relative">
              {job.matchScore && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                  {job.matchScore}/10 match
                </div>
              )}
              <JobCard
                job={job}
                savedInit={job?.saved?.length > 0}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p>No recommendations found based on your CV.</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload a detailed CV to get personalized job recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;