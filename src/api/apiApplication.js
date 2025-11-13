import supabaseClient, { supabaseUrl } from "@/utils/supabase";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// - Apply to job ( candidate )
export async function applyToJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `resume-${random}-${jobData.candidate_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, jobData.resume);

  if (storageError) throw new Error("Error uploading Resume");

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        ...jobData,
        resume,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Application");
  }

  return data;
}

// - Edit Application Status ( recruiter )
export async function updateApplicationStatus(token, { job_id }, status) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("job_id", job_id)
    .select();

  if (error || data.length === 0) {
    console.error("Error Updating Application Status:", error);
    return null;
  }

  return data;
}

export async function getApplications(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(title, company:companies(name))")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return null;
  }

  return data;
}

// Upload and parse CV using OpenAI
export async function uploadAndParseCV(token, options, { user_id, cvFile }) {
  const supabase = await supabaseClient(token);

  console.log("uploadAndParseCV called with user_id:", user_id);
  console.log("cvFile:", cvFile);

  try {
    // First, upload the CV file to Supabase storage
    const random = Math.floor(Math.random() * 90000);
    const fileName = `cv-${random}-${user_id}`;
    const filePath = `cvs/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("resumes")
      .upload(filePath, cvFile);

    if (storageError) {
      throw new Error("Error uploading CV file: " + storageError.message);
    }

    // Get the file URL
    const { data: { publicUrl } } = supabase.storage
      .from("resumes")
      .getPublicUrl(filePath);

    // Extract text content based on file type
    let fileContent = "";
    if (cvFile.type === "application/pdf") {
      // Extract text from PDF
      const arrayBuffer = await cvFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(" ") + "\n";
      }
      fileContent = text;
    } else if (cvFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Extract text from DOCX
      const arrayBuffer = await cvFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      fileContent = result.value;
    } else if (cvFile.type === "application/msword") {
      // For .doc files, we can't easily parse on client-side, so we'll skip for now
      throw new Error("DOC files are not supported. Please upload a PDF or DOCX file.");
    } else {
      // Fallback for other types (though we should have filtered them out)
      const fileReader = new FileReader();
      fileContent = await new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = reject;
        fileReader.readAsText(cvFile);
      });
    }

    // Use OpenAI to parse the CV content
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

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
            content: `You are a CV parsing expert. Extract the following information from the CV content and return it as a valid JSON object with these exact keys:
            - skills: array of technical skills and programming languages
            - experience: string describing years of experience and key roles
            - education: string describing highest education level and field of study
            
            Return ONLY the JSON object, no additional text.`
          },
          {
            role: "user",
            content: `Please parse this CV content:\n\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error("OpenAI API error: " + response.status);
    }

    const aiResponse = await response.json();
    const parsedData = JSON.parse(aiResponse.choices[0].message.content);

    // Store the parsed CV data in a dedicated table
    const { data, error: insertError } = await supabase
      .from("user_cvs")
      .upsert({
        user_id,
        skills: parsedData.skills || [],
        experience: parsedData.experience || "",
        education: parsedData.education || "",
        cv_url: publicUrl,
        parsed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error("Error storing parsed CV:", insertError);
      throw new Error("Error storing CV data");
    }

    return {
      ...parsedData,
      cv_url: publicUrl
    };

  } catch (error) {
    console.error("Error in uploadAndParseCV:", error);
    throw error;
  }
}

// Get user's CV data from dedicated CV table
export async function getUserCvData(token, { user_id }) {
  const supabase = await supabaseClient(token);

  // Get CV data from dedicated table
  const { data, error } = await supabase
    .from("user_cvs")
    .select("skills, experience, education, cv_url, parsed_at")
    .eq("user_id", user_id)
    .order("parsed_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching CV data:", error);
    return null;
  }

  console.log("CV Data from dedicated table:", data);
  return data;
}
