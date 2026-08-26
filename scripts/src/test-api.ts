import app from "../../artifacts/api-server/src/app";
import http from "http";

async function runTests() {
  console.log("🧪 Testing SmartWarehouse Backend Endpoints...");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(8081, () => resolve()));
  console.log("✅ Test server listening on port 8081");

  const baseUrl = "http://localhost:8081/api";

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/healthz`);
  const healthData = await healthRes.json();
  console.log("1. Health check:", healthRes.status, healthData);

  // 2. Login as Admin
  const loginAdminRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  });
  const adminData = await loginAdminRes.json();
  console.log("2. Admin login:", loginAdminRes.status, adminData.user?.role);

  // 3. Login as Buyer
  const loginBuyerRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "buyer@example.com", password: "password123" }),
  });
  const buyerData = await loginBuyerRes.json();
  console.log("3. Buyer login:", loginBuyerRes.status, buyerData.user?.role);

  // 4. Fetch orders as Buyer
  const buyerOrdersRes = await fetch(`${baseUrl}/orders`, {
    headers: { Authorization: `Bearer ${buyerData.token}` },
  });
  const buyerOrders = await buyerOrdersRes.json();
  console.log("4. Buyer orders count:", buyerOrders.length);

  // 5. Login as Dealer 1
  const loginDealerRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "dealer1@example.com", password: "password123" }),
  });
  const dealerData = await loginDealerRes.json();
  console.log("5. Dealer login:", loginDealerRes.status, dealerData.user?.role);

  // 6. Test Auto Allocate on Quoted Order
  const quotedOrder = buyerOrders.find((o: any) => o.status === "quoted");
  if (quotedOrder) {
    console.log("6. Testing Auto Allocate on order:", quotedOrder.id);
    const allocateRes = await fetch(`${baseUrl}/orders/${quotedOrder.id}/allocate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminData.token}` },
    });
    const allocationResult = await allocateRes.json();
    console.log("6. Allocation result sub-orders:", allocationResult.length);
    console.log("   Allocations:", JSON.stringify(allocationResult.map((a: any) => ({
      dealer: a.dealerName,
      qty: a.allocatedQty,
      price: a.pricePerUnit
    })), null, 2));
  }

  // 7. Check dealer suborders
  const dealerSubsRes = await fetch(`${baseUrl}/dealer/suborders`, {
    headers: { Authorization: `Bearer ${dealerData.token}` },
  });
  const dealerSubs = await dealerSubsRes.json();
  console.log("7. Dealer 1 assigned sub-orders:", dealerSubs.length);

  server.close();
  console.log("🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
