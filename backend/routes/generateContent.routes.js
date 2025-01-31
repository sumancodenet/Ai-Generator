import { generateContent } from "../controller/generateContent.Controller.js";

export const getContent = (app) => {
  app.get("/api/get-content/:prompt", generateContent);
};
