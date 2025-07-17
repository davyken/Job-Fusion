import { serve } from 'std/server';
import pdf from 'pdf-parse';
import { OpenAIApi, Configuration } from 'openai';
import { parseDocx } from 'docx-parser';
import { readFileSync } from 'fs';

const openai = new OpenAIApi(new Configuration({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
}));

serve(async (req) => {
  const formData = await req.formData();
  const file = formData.get('cv');

  const filePath = `/tmp/${file.name}`;
  const buffer = await file.arrayBuffer();
  await Deno.writeFile(filePath, new Uint8Array(buffer));

  let cvText;

  // Extract text based on file type
  if (file.name.endsWith('.pdf')) {
    const dataBuffer = readFileSync(filePath);
    cvText = await pdf(dataBuffer);
  } else if (file.name.endsWith('.docx')) {
    cvText = await new Promise((resolve, reject) => {
      parseDocx(filePath, (err, text) => {
        if (err) reject(err);
        resolve(text);
      });
    });
  } else {
    return new Response('Unsupported file type', { status: 400 });
  }

  // Call OpenAI for job recommendations
  const recommendations = await recommendJobs(cvText.text);
  return new Response(JSON.stringify(recommendations), {
    headers: { 'Content-Type': 'application/json' },
  });
});

const recommendJobs = async (cvText) => {
  const prompt = `Given the following CV data, recommend suitable job titles: ${cvText}`;
  
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 60,
  });
  
  return response.data.choices[0].text.trim().split(', ');
};