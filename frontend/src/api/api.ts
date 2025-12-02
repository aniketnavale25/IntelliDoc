import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000",
});

export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("pdf", file);

  const res = await API.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const askQuestion = async (question: string) => {
  const res = await API.post("/ask", { question });
  return res.data;
};
