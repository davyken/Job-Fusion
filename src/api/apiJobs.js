import supabaseClient from "@/utils/supabase";

// Fetch Jobs
export async function getJobs(token) {
  const supabase = await supabaseClient(token);
  
  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name, logo_url)");

  if (error) {
    console.error("Error fetching Jobs:", error.message);
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

  const userId = saveData.user_id; // Ensure this is set correctly
  if (!userId) {
    console.error("User ID is required to save a job.");
    return null;
  }

  console.log("Saving job with data:", { userId, jobId: saveData.job_id });

  if (alreadySaved) {
    const { data: deleteData, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", saveData.job_id);

    if (deleteError) {
      console.error("Error removing saved job:", deleteError);
      return null;
    }

    console.log("Job unsaved successfully:", deleteData);
    return deleteData;
  } else {
    const { data: insertData, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([{ user_id: userId, job_id: saveData.job_id }]) // Ensure correct structure
      .select();

    if (insertError) {
      console.error("Error saving job:", insertError);
      return null;
    }

    console.log("Job saved successfully:", insertData);
    return insertData;
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
    console.error("Error creating job:", error.message);
    throw new Error("Error creating job: " + error.message);
  }

  return data;
} 
