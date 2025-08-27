import supabaseClient from "@/utils/supabase";

// Fetch Jobs
export async function getJobs(token, { location, company_id, searchQuery }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)");

  if (location) {
    query = query.eq("location", location);
  }

  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Read Saved Jobs
export async function getSavedJobs(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))");

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

// Read single job
export async function getSingleJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select(
      "*, company: companies(name,logo_url), applications: applications(*)"
    )
    .eq("id", job_id)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }

  return data;
}

// - Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = await supabaseClient(token);

  if (alreadySaved) {
    // If the job is already saved, remove it
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (deleteError) {
      console.error("Error removing saved job:", deleteError);
      return data;
    }

    return data;
  } else {
    // If the job is not saved, add it to saved jobs
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (insertError) {
      console.error("Error saving job:", insertError);
      return data;
    }

    return data;
  }
}

// - job isOpen toggle - (recruiter_id = auth.uid())
export async function updateHiringStatus(token, { job_id }, isOpen) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .select();

  if (error) {
    console.error("Error Updating Hiring Status:", error);
    return null;
  }

  return data;
}

// get my created jobs
export async function getMyJobs(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);

  const { data, error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    console.error("Error deleting job:", deleteError);
    return data;
  }

  return data;
}

// - post job
export async function addNewJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .insert([jobData])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Job");
  }
return data;
}

// Get recommended jobs based on AI analysis of user profile and CV
export async function getRecommendedJobs(token, cvData) {
const supabase = await supabaseClient(token);

// Get all open jobs with company info
const { data: jobs, error: jobsError } = await supabase
  .from("jobs")
  .select("*, company: companies(name,logo_url), saved: saved_jobs(id)")
  .eq("isOpen", true); // Only get open jobs

if (jobsError) {
  console.error("Error fetching jobs:", jobsError);
  return null;
}

// If we don't have CV data, return all open jobs (up to 10)
if (!cvData) {
  return jobs?.slice(0, 10) || [];
}

// Use OpenAI API to analyze CV and match with jobs
try {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Debug: Log the raw CV data
  console.log("Raw CV Data:", cvData);
  
  // Format CV data properly
  const formattedCvData = {
    skills: Array.isArray(cvData.skills) ? cvData.skills :
             typeof cvData.skills === 'string' ? cvData.skills.split(',').map(s => s.trim()) :
             [],
    experience: cvData.experience || "Not specified",
    education: cvData.education || "Not specified"
  };
  
  // Debug: Log the formatted CV data
  console.log("Formatted CV Data:", formattedCvData);
  
  // Create a more detailed prompt for the AI
  const prompt = `You are a job matching expert. Based on the candidate's CV data, score how well each job matches their profile on a scale of 1-10.

Important considerations:
- A full-stack developer can do front-end, back-end, and full-stack roles
- Consider related skills (e.g., if they know React, they can likely do frontend jobs)
- Experience level should match job requirements
- Return ONLY a valid JSON array with job_id and score properties

Candidate CV Data:
Skills: ${formattedCvData.skills.join(", ") || "Not provided"}
Experience: ${formattedCvData.experience}
Education: ${formattedCvData.education}

Available Jobs:
${jobs.map(job =>
  `Job ID: ${job.id}
Title: ${job.title}
Location: ${job.location}
Requirements: ${job.requirements || 'Not specified'}`
).join("\n\n")}

Response format example:
[{"job_id": "job-id-1", "score": 9}, {"job_id": "job-id-2", "score": 7}]`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a precise job matching expert. Always respond with valid JSON and consider that developers with broader skills (like full-stack) can work in specialized roles (like front-end)."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })
  });

  // Add a small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("OpenAI API error: " + response.status + " - " + errorText);
  }

  const aiResponse = await response.json();
  
  // Try to extract JSON from the response
  let scores = [];
  try {
    // Try to parse the response directly
    scores = JSON.parse(aiResponse.choices[0].message.content);
  } catch (parseError) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    const content = aiResponse.choices[0].message.content;
    const jsonMatch = content.match(/\\[[\\s\\S]*\\]/);
    if (jsonMatch) {
      scores = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not extract valid JSON from AI response");
    }
  }
  
  // Validate that we have valid scores
  if (!Array.isArray(scores)) {
    throw new Error("AI response is not a valid array. Response: " + JSON.stringify(scores));
  }
  
  // Sort jobs based on AI scores
  const scoredJobs = jobs.map(job => {
    const scoreObj = scores.find(s => s.job_id === job.id?.toString());
    return {
      ...job,
      matchScore: scoreObj ? scoreObj.score : 5 // Default score if not found
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  
  // Filter out jobs with very low scores (less than 3)
  const filteredJobs = scoredJobs.filter(job => job.matchScore >= 3);
  
  return filteredJobs.slice(0, 10);
} catch (error) {
  console.error("Error getting AI recommendations:", error);
  // Fallback to basic matching if AI fails
  const skills = Array.isArray(cvData.skills) ? cvData.skills :
                 typeof cvData.skills === 'string' ? cvData.skills.split(',').map(s => s.trim()) :
                 [];
  
  if (skills.length > 0) {
    // Filter jobs that mention any of the user's skills
    // Special handling for fullstack developers - they can do frontend/backend jobs too
    const expandedSkills = [...skills];
    
    // Add related skills for fullstack developers
    if (skills.some(skill => skill.toLowerCase().includes('fullstack') || skill.toLowerCase().includes('full stack'))) {
      expandedSkills.push('frontend', 'backend', 'front-end', 'back-end');
    }
    
    const matchingJobs = jobs.filter(job =>
      expandedSkills.some(skill =>
        (job.requirements?.toLowerCase().includes(skill.toLowerCase()) ||
         job.title?.toLowerCase().includes(skill.toLowerCase()))
      )
    );
    return matchingJobs.slice(0, 10);
  }
  
  // If no skills or AI matching fails, return all jobs
  return jobs.slice(0, 10);
}
}
