import React from "react";
import { FaRegFileImage } from "react-icons/fa";

interface ImageUploadButtonProps {
  onImageUpload: (imageUrl: string) => void;
  onFocusEditor: () => void;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageUpload,
  onFocusEditor,
}) => {
  // Handle image upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optionally: validate file type/size here
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.url) {
        onImageUpload(data.url);
      }
    } catch (err) {
      alert("Failed to upload image");
    }

    e.target.value = ""; // Reset file input
  };

  return (
    <label
      className="ml-2 pt-2 pb-2 cursor-pointer px-2 py-1 rounded text-indigo-700 bg-white transition-all"
      onClick={onFocusEditor}
    >
      <FaRegFileImage size={18} />
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </label>
  );
};

export default ImageUploadButton;
