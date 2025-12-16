import axios from "axios";

const WP_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "").replace(/\/$/, "")}/wp-json`;

// Login with username & password
export async function login(username: string, password: string) {
  const url = `${WP_API_URL}/jwt-auth/v1/token`;
  console.log("Attempting login at:", url);
  const res = await axios.post(url, {
    username,
    password,
  });
  return res.data; // { token, user_email, user_nicename, user_display_name }
}

// Validate token
export async function validateToken(token: string) {
  const res = await axios.post(
    `${WP_API_URL}/jwt-auth/v1/token/validate`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // success or error
}