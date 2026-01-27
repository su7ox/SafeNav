import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const scanUrl = async (url) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scan`, { url });
    return response.data;
  } catch (error) {
    console.error("Scanning Error:", error);
    throw error;
  }
};