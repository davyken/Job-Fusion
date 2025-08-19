import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import JobCard from "@/components/job-card";
import { getRecommendedJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import BackButton from "@/components/back-button";

const RecommendationsPage = () => {
  const { isLoaded, user } = useUser();
  
  // In a real implementation, you would fetch the user's CV data here
  // For now, we'll simulate this with mock data
  const mockCvData = {
    skills: ["JavaScript", "React", "Node.js", "HTML", "CSS"],
    experience: "3 years",
    education: "Bachelor's in Computer Science"
  };
  
  const {
    loading: loadingJobs,
    data: recommendedJobs,
    fn: fnJobs,
  } = useFetch(getRecommendedJobs, mockCvData);

  useEffect(() => {
    if (isLoaded) {
      fnJobs();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div>
      <BackButton />
      <h1 className="gradient-title font-extrabold text-6xl sm:text-7xl text-center pb-8">
        Job Recommendations
      </h1>
      <p className="text-center text-gray-500 mb-8">
        AI-powered recommendations based on your profile and CV
      </p>
      
      {loadingJobs && <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />}
      
      {!loadingJobs && recommendedJobs?.length > 0 ? (
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              savedInit={job?.saved?.length > 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p>No recommendations found for you at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Update your profile and CV to get better recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;