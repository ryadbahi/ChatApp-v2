import cloudinary from "./cloudinary";

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    console.log("Starting upload to Cloudinary..."); // Debug log

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error); // Debug log
          return reject(error);
        }
        if (!result) {
          console.error("No result returned from Cloudinary"); // Debug log
          return reject(new Error("No result returned from Cloudinary"));
        }
        console.log("Upload successful:", result.secure_url); // Debug log
        resolve({ secure_url: result.secure_url });
      }
    );

    stream.end(fileBuffer);
  });
};

/*export const uploadToCloudinary = async (buffer: Buffer, folder = "chatapp") =>{
    return await cloudinary.uploader
    .upload_stream({ folder, resource_type: "auto" }, (error, result) => {
      if (error) throw error;
      return result;
    })
    .end(buffer);
}*/
