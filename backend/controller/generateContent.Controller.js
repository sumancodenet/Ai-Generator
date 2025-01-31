import { GoogleGenerativeAI } from "@google/generative-ai";
import { statusCode } from "../utils/statusCodes.js";
import { apiResponseErr, apiResponseSuccess } from "../utils/response.js";


export const generateContent = async (req, res) => {
  try {
    const { prompt } = req.params;

    console.log( prompt );



    if (!prompt) {
      return apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Prompt is required",
        res
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    if (!genAI) {
      return apiResponseErr(
        null,
        false,
        statusCode.notFound,
        "Api not found!",
        res
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const Output = result.response.text();

    return apiResponseSuccess(
      Output,
      true,
      statusCode.success,
      "Data fetch successfully!",
      res
    );
  } catch (error) {
    return apiResponseErr(
      null,
      false,
      error.responseCode ?? statusCode.internalServerError,
      error.message,
      res
    );
  }
};
