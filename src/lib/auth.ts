import axios from "axios";

const WP_API_URL = "http://staging-plugin-test.test/wp-json"; // change to staging/prod domain

// Login with username & password
export async function login(username: string, password: string) {
  const res = await axios.post(`${WP_API_URL}/jwt-auth/v1/token`, {
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