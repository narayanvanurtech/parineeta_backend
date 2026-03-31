const axios = require('axios');
const qs = require('qs');

const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL;
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN;

const getHeaders = (contentType = 'application/json') => ({
  Authorization: `Token ${DELHIVERY_TOKEN}`,
  'Content-Type': contentType,
  Accept: 'application/json',
});

// ─────────────────────────────────────────────
// 🛠️ DEBUG: List all registered warehouses
// Call this once to find your exact pickup name
// ─────────────────────────────────────────────
async function getDelhiveryWarehouses() {
  try {
    const res = await axios.get(
      `${DELHIVERY_BASE_URL}/api/backend/clientwarehouse/`,
      { headers: getHeaders() }
    );
    console.log('📦 Delhivery Warehouses:', JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    console.error('getDelhiveryWarehouses Error:', err.response?.data || err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
// ✅ 1. Create Shipment
// ─────────────────────────────────────────────
async function createDelhiveryShipment({ orderId, address, orderItems, total, paymentMethod }) {
  try {

    // ✅ FIX: Only send name — Delhivery resolves the rest from their system
    // The name must EXACTLY match what's in your Delhivery dashboard
    // Run getDelhiveryWarehouses() once to find the correct name
    const pickupName = process.env.DELHIVERY_PICKUP_NAME;

    if (!pickupName) {
      throw new Error('DELHIVERY_PICKUP_NAME is not set in .env');
    }

    const shipmentData = {
      pickup_location: {
        name: pickupName,             // ✅ ONLY name — no address fields
      },
      shipments: [
        {
          name: `${address.firstName} ${address.lastName}`,
          add: address.street,
          pin: String(address.pincode),
          city: address.city,
          state: address.state,
          country: 'India',
          phone: String(address.phone),
          order: orderId,
          payment_mode: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
          products_desc: orderItems.map((i) => i.name).join(', '),
          hsn_code: '',
          cod_amount: paymentMethod === 'COD' ? String(total) : '0',
          total_amount: String(total),
          seller_name: process.env.SELLER_NAME || 'Parineeta',
          seller_inv: orderId,
          quantity: String(orderItems.reduce((sum, i) => sum + i.quantity, 0)),
          weight: '0.5',
          length: '10',
          breadth: '10',
          height: '5',
          return_name: process.env.SELLER_NAME || 'Parineeta',
          return_pin: process.env.DELHIVERY_PICKUP_PINCODE,
          return_city: process.env.DELHIVERY_PICKUP_CITY,
          return_state: process.env.DELHIVERY_PICKUP_STATE,
          return_country: 'India',
          return_phone: process.env.DELHIVERY_PICKUP_PHONE,
        },
      ],
    };

    const payload = {
      format: 'json',
      data: JSON.stringify(shipmentData),
    };

    console.log('📤 Delhivery payload shipment:', JSON.stringify(shipmentData, null, 2));

    // ⚠️ Must use application/x-www-form-urlencoded for this endpoint
    const res = await axios.post(
      `${DELHIVERY_BASE_URL}/api/cmu/create.json`,
      qs.stringify(payload),
      { headers: getHeaders('application/x-www-form-urlencoded') }
    );

    console.log('📥 Delhivery raw response:', JSON.stringify(res.data, null, 2));

    // Check for API-level errors first
    if (res.data?.error === true) {
      throw new Error(`Delhivery API error: ${res.data?.rmk || 'Unknown error'}`);
    }

    const waybill = res.data?.packages?.[0]?.waybill || null;

    if (!waybill) {
      throw new Error(
        `Delhivery did not return a waybill. Response: ${JSON.stringify(res.data)}`
      );
    }

    return { waybill, rawResponse: res.data };
  } catch (err) {
    console.error('createDelhiveryShipment Error:', err.response?.data || err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
// ✅ 2. Track Shipment by Waybill
// ─────────────────────────────────────────────
async function trackDelhiveryShipment(waybill) {
  try {
    const res = await axios.get(
      `${DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${waybill}&ref_ids=`,
      { headers: getHeaders() }
    );

    const shipmentData = res.data?.ShipmentData?.[0]?.Shipment || null;
    const status = shipmentData?.Status?.Status || 'UNKNOWN';
    const scans = shipmentData?.Scans || [];

    return { status, scans, raw: res.data };
  } catch (err) {
    console.error('trackDelhiveryShipment Error:', err.response?.data || err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
// ✅ 3. Cancel Shipment by Waybill
// ─────────────────────────────────────────────
async function cancelDelhiveryShipment(waybill) {
  try {
    const res = await axios.post(
      `${DELHIVERY_BASE_URL}/api/p/edit`,
      { waybill, cancellation: 'true' },
      { headers: getHeaders() }
    );

    console.log('Delhivery cancel response:', res.data);
    return res.data;
  } catch (err) {
    console.error('cancelDelhiveryShipment Error:', err.response?.data || err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
// ✅ 4. Check Pincode Serviceability
// ─────────────────────────────────────────────
async function checkPincodeServiceability(pincode) {
  try {
    const res = await axios.get(
      `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
      { headers: getHeaders() }
    );
    return res.data;
  } catch (err) {
    console.error('checkPincodeServiceability Error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  createDelhiveryShipment,
  trackDelhiveryShipment,
  cancelDelhiveryShipment,
  checkPincodeServiceability,
  getDelhiveryWarehouses,       // 🛠️ use once to debug, then remove
};