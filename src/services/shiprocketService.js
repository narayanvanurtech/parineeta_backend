const axios = require("axios");
const { SHIPROCKET_BASE, SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD } = require("../config/shiprocket");


let cachedToken = null;
let tokenExpiry = null;

async function getShiprocketToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

console.log(SHIPROCKET_BASE,SHIPROCKET_EMAIL,SHIPROCKET_PASSWORD)

  const res = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
    email: SHIPROCKET_EMAIL,
    password: SHIPROCKET_PASSWORD,
  });

  cachedToken = res.data.token;
  tokenExpiry = Date.now() + 9 * 60 * 60 * 1000; // 9 hours
  return cachedToken;
}

// Make any Shiprocket API request
async function shiprocketRequest(method, endpoint, data = null) {
  const token = await getShiprocketToken();

  const res = await axios({
    method,
    url: `${SHIPROCKET_BASE}${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(data && { data }),
  });

  return res.data;
}

module.exports = { getShiprocketToken, shiprocketRequest };