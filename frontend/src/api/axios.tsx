import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5001", // Point to your backend
  withCredentials: true,
});

export default instance;
