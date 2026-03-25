import { Router, type IRouter } from "express";
import { db, subOrdersTable, usersTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticateToken, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get(
  "/suborders",
  authenticateToken,
  requireRole("dealer"),
  async (req: AuthRequest, res) => {
    try {
      const subOrders = await db
        .select({
          id: subOrdersTable.id,
          orderId: subOrdersTable.orderId,
          dealerId: subOrdersTable.dealerId,
          allocatedQty: subOrdersTable.allocatedQty,
          pricePerUnit: subOrdersTable.pricePerUnit,
          status: subOrdersTable.status,
          createdAt: subOrdersTable.createdAt,
          dealerName: usersTable.name,
          material: ordersTable.material,
          location: ordersTable.location,
        })
        .from(subOrdersTable)
        .leftJoin(usersTable, eq(subOrdersTable.dealerId, usersTable.id))
        .leftJoin(ordersTable, eq(subOrdersTable.orderId, ordersTable.id))
        .where(eq(subOrdersTable.dealerId, req.userId!));

      res.json(subOrders);
    } catch (err) {
      req.log.error({ err }, "Get dealer suborders error");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
