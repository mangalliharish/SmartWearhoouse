import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import ordersRouter from "./orders.js";
import quotationsRouter from "./quotations.js";
import subordersRouter from "./suborders.js";
import dealerRouter from "./dealer.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/quotations", quotationsRouter);
router.use("/suborders", subordersRouter);
router.use("/dealer", dealerRouter);

export default router;
