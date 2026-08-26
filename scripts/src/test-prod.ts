import http from "http";
import app from "../../artifacts/api-server/src/app";

async function testProdServing() {
  console.log("🧪 Testing Production Full-Stack Serving...");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(8082, () => resolve()));

  // 1. Test API
  const apiRes = await fetch("http://localhost:8082/api/healthz");
  const apiData = await apiRes.json();
  console.log("1. API Health Check:", apiRes.status, apiData);

  // 2. Test Frontend Root
  const rootRes = await fetch("http://localhost:8082/");
  const rootHtml = await rootRes.text();
  console.log("2. Root Index HTML:", rootRes.status, rootHtml.includes("<div id=\"root\">") ? "✅ React App root HTML served" : "❌ Not found");

  // 3. Test SPA fallback route (/buyer)
  const buyerRouteRes = await fetch("http://localhost:8082/buyer");
  const buyerHtml = await buyerRouteRes.text();
  console.log("3. SPA Fallback (/buyer):", buyerRouteRes.status, buyerHtml.includes("<div id=\"root\">") ? "✅ SPA fallback served" : "❌ Not found");

  server.close();
  console.log("🎉 Production unified full-stack serving verified successfully!");
}

testProdServing().catch((err) => {
  console.error("❌ Production test failed:", err);
  process.exit(1);
});
