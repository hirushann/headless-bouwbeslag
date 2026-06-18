import axios from "axios";

// Fallback to internal API or absolute URL
const EMPIRE_API_URL = process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test";
const BASE_URL = EMPIRE_API_URL.replace(/\/$/, "");

// Login with email & password
export async function login(email: string, password: string) {
  const url = `${BASE_URL}/api/login`;
  const res = await axios.post(url, {
    email,
    password,
    device_name: "nextjs-storefront"
  });
  return res.data; // { message, user, access_token, token_type }
}

// Register with name, email, password
export async function register(data: { name: string; email: string; password: string; password_confirmation: string }) {
    const url = `${BASE_URL}/api/register`;
    const res = await axios.post(url, data);
    return res.data; // { message, user, access_token, token_type }
}

// Logout
export async function logout(token: string) {
    const url = `${BASE_URL}/api/logout`;
    const res = await axios.post(
      url,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
}

// Validate token (by fetching profile)
export async function validateToken(token: string) {
  const res = await axios.get(
    `${BASE_URL}/api/profile`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}