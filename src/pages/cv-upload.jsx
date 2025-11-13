import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarLoader } from "react-spinners";
import { uploadAndParseCV } from "@/api/apiApplication";
import useFetch from "@/hooks/use-fetch";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/back-button";

const CVUploadPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const {
    loading: loadingUpload,
    error: errorUpload,
    fn: fnUpload,
  } = useFetch(uploadAndParseCV);

  const handleFileSelect = (file) => {
    if (file && (file.type === "application/pdf" ||
                 file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                 file.type === "application/msword")) {
      setSelectedFile(file);
    } else {
      alert("Please select a PDF or Word document (.docx or .doc)");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Ensure user is loaded and has an ID
    if (!isLoaded || !user || !user.id) {
      alert("Please wait for authentication to complete or sign in again.");
      return;
    }

    setUploadProgress("Uploading and analyzing your CV...");

    console.log("User object:", user);
    console.log("User ID:", user.id);

    try {
      const result = await fnUpload({
        user_id: user.id,
        cvFile: selectedFile,
      });

      if (result) {
        setUploadProgress("CV uploaded and analyzed successfully!");
        setTimeout(() => {
          navigate("/recommendations");
        }, 2000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress("");
    }
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackButton />
      <div className="text-center mb-8">
        <h1 className="gradient-title font-extrabold text-6xl sm:text-7xl">
          Upload Your CV
        </h1>
        <p className="text-gray-500 mt-4">
          Upload your CV to get AI-powered job recommendations tailored to your profile
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>CV Upload & Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-4xl">📄</div>
              <div>
                <p className="text-lg font-medium">
                  {selectedFile ? selectedFile.name : "Drop your CV here, or click to browse"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF, DOC, and DOCX files
                </p>
              </div>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
                id="cv-file"
              />
              <Label htmlFor="cv-file">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <div className="text-center">
              <Button
                onClick={handleUpload}
                disabled={loadingUpload}
                size="lg"
                className="w-full max-w-xs"
              >
                {loadingUpload ? "Analyzing..." : "Upload & Analyze CV"}
              </Button>
            </div>
          )}

          {/* Progress/Error Messages */}
          {uploadProgress && (
            <div className="text-center">
              <p className="text-blue-600 font-medium">{uploadProgress}</p>
            </div>
          )}

          {errorUpload && (
            <div className="text-center">
              <p className="text-red-600 font-medium">
                Error: {errorUpload.message || "Failed to upload CV. Please try again."}
              </p>
            </div>
          )}

          {/* Loading Spinner */}
          {loadingUpload && (
            <div className="text-center">
              <BarLoader width={"100%"} color="#36d7b7" />
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your CV will be securely uploaded to our servers</li>
              <li>• AI will analyze your skills, experience, and education</li>
              <li>• You'll get personalized job recommendations based on your profile</li>
              <li>• You can update your CV anytime to get better recommendations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVUploadPage;
