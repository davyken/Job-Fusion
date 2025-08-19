// Predefined responses for common questions
const PREDEFINED_RESPONSES = {
  "how to apply for a job": "To apply for a job on JobFusion:\n1. Browse jobs in the 'Job Listings' section\n2. Click on a job that interests you\n3. Review the job details\n4. Click the 'Apply' button\n5. Fill out the application form\n6. Submit your application\n\nMake sure your profile is complete and your CV is uploaded for the best experience!",
  "how to post a job": "To post a job on JobFusion:\n1. Navigate to the 'Post Job' section\n2. Fill in the job details including title, description, and requirements\n3. Select or add your company\n4. Choose the job location\n5. Review all information\n6. Click 'Submit' to post your job\n\nYour job will be visible to job seekers immediately after posting.",
  "how to save a job": "To save a job on JobFusion:\n1. Browse jobs in the 'Job Listings' section\n2. Click on a job that interests you\n3. Click the 'Save Job' button\n4. The job will now appear in your 'Saved Jobs' section\n\nYou can view all your saved jobs anytime in the 'Saved Jobs' section.",
  "how to upload cv": "To upload your CV on JobFusion:\n1. Go to your profile settings\n2. Look for the 'CV' or 'Resume' section\n3. Click 'Upload' and select your CV file\n4. Supported formats: PDF, DOC, DOCX\n5. Your CV will be used for better job recommendations\n\nMake sure your CV is up-to-date for the best job matches!",
  "how to find recommendations": "To find job recommendations on JobFusion:\n1. Go to the 'Recommendations' section\n2. The AI will show you jobs based on your profile and CV\n3. Review the recommended jobs\n4. Apply to jobs that match your interests\n\nThe more complete your profile and CV, the better the recommendations!",
  "contact support": "For support with JobFusion, please contact our team at support@jobfusion.com or use the contact form on our website. Our support hours are Monday-Friday, 9AM-5PM EST.",
  "how do you work": "I'm JobBot, an AI assistant powered by OpenAI's GPT technology. I'm designed to help you navigate the JobFusion platform. I can answer questions about job searching, job posting, and using various features of the platform. Try asking me specific questions like 'How do I apply for a job?' or 'How do I post a job?'",
  "who are you": "I'm JobBot, your JobFusion assistant. I'm an AI-powered chatbot here to help you use the JobFusion platform effectively. Whether you're looking for jobs or posting job listings, I can guide you through the process and answer your questions."
};

export async function askGPT(userMessage, context = {}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  console.log("API Key:", apiKey);

  // Check for predefined responses
  const lowerCaseMessage = userMessage.toLowerCase();
  for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
    if (lowerCaseMessage.includes(key)) {
      return response;
    }
  }

  // Enhanced system prompt with more context about the JobFusion app
  const systemPrompt = `You are JobBot, an AI assistant for JobFusion - a comprehensive job search and recruitment platform. Your role is to help both job seekers and recruiters navigate the platform effectively.

Key features of JobFusion:
- Job seekers can search and apply for jobs, save jobs, and get AI-powered recommendations
- Recruiters can post jobs, manage applications, and find candidates
- Users can upload CVs for better job matching
- The platform has dedicated sections for:
  * Job Listings: Browse available positions
  * My Jobs: For recruiters to manage posted jobs or candidates to view applications
  * Saved Jobs: For job seekers to track interesting positions
  * Recommendations: AI-powered job suggestions based on user profile
  * Post Job: For recruiters to create new job listings

When responding to users:
1. Be concise but helpful
2. Provide step-by-step guidance when explaining features
3. If you don't know something specific about JobFusion, acknowledge that and suggest contacting support
4. For job seekers, focus on finding and applying to jobs
5. For recruiters, focus on posting jobs and managing applications
6. Always be professional and encouraging
7. If the user's role is provided in context, tailor your response accordingly

User message: ${userMessage}
${context.userRole ? `User role: ${context.userRole}` : ""}`;

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: userMessage },
        ],
      }),
    }, 10000); // 10 second timeout

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return "Sorry, something went wrong. Please try again later.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sorry, something went wrong. Please try again later.";
  } catch (error) {
    console.error("Fetch error:", error);
    if (error.name === 'AbortError') {
      return "Sorry, the request took too long. Please try again or rephrase your question.";
    }
    return "Sorry, something went wrong. Please check your internet connection and try again.";
  }
}

// Helper function to add timeout to fetch requests
async function fetchWithTimeout(url, options, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
