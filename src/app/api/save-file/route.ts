import { NextRequest } from "next/server";
import { File } from "fetch-blob/file.js";
import {
  apiError,
  apiFailure,
  apiSuccess,
  apiValidate,
  DEFAULT_COMPANY_ID,
} from "@/lib/api/api-helper";
import { DataRepository } from "@/lib/repositories/dataRepository";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.pathname;
  let message: string[] = [];

  try {
    const req = await request.formData();
    const validate = apiValidate({ origin, req: null, header: request.headers });

    if (!validate.success) {
      message = validate.message;
      return apiFailure({ message, status: 401 });
    }

    const folder_id = req.get("folder_id");
    const user_id = req.get("user_id");
    const files = req.getAll("files");

    if (!user_id) message.push("Invalid Request!");
    if (!folder_id) message.push("Invalid folder ID!");
    if (!files || files.length === 0) message.push("No image files provided!");

    if (message.length > 0) {
      return apiFailure({ message });
    }

    // Validate file type
    const imageFiles: File[] = [];
    for (const file of files) {
      if (!(file instanceof File)) {
        message.push("Invalid file format");
        return apiFailure({ message });
      }
      imageFiles.push(file);
    }

    const userRepository = new DataRepository((user_id ?? '').toString());
    const uploadResult = await userRepository.uploadDataFile(Number.parseInt(folder_id?.toString() ?? '0'), imageFiles[0]);

    if (!uploadResult.success) {
      message.push(uploadResult.error || "Image upload failed");
      return apiFailure({ message });
    }

    return apiSuccess({
      data: {
        uploaded: uploadResult.result,
        message: "Images uploaded successfully",
      },
    });
  } catch (error) {
    return apiError({ origin, error });
  }
}
