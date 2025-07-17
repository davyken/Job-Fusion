import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const CvUploadForm = () => {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('cv', data.cv[0]);

    try {
      const response = await axios.post('YOUR_SUPABASE_FUNCTION_URL/processCv', formData);
      console.log('Job Recommendations:', response.data);
    } catch (error) {
      console.error('Error uploading CV:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="file" {...register('cv')} accept=".pdf,.docx" required />
      <button type="submit">Upload CV</button>
    </form>
  );
};

export default CvUploadForm;