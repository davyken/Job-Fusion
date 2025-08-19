import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import JobCard from "@/components/job-card";
import { getRecommendedJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";

const JobRecommendations = ({ cvData }) => {
  const { isLoaded, user } = useUser();
  
  const {
    loading: loadingJobs,
    data: recommendedJobs,
    fn: fnJobs,
  } = useFetch(getRecommendedJobs, cvData);

  useEffect(() => {
    if (isLoaded && cvData && user?.unsafeMetadata?.role === "candidate") {
      fnJobs();
    }
  }, [isLoaded, cvData, user]);

  if (!isLoaded || !cvData) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Recommended Jobs for You</h2>
      {loadingJobs && <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />}
      
      {!loadingJobs && recommendedJobs?.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedJobs.slice(0, 3).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              savedInit={job?.saved?.length > 0}
            />
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