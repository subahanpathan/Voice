import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import campaignsRouter from "./campaigns";
import petitionsRouter from "./petitions";
import pollsRouter from "./polls";
import commentsRouter from "./comments";
import notificationsRouter from "./notifications";
import statsRouter from "./stats";
import usersRouter from "./users";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/campaigns", campaignsRouter);
router.use("/petitions", petitionsRouter);
router.use("/polls", pollsRouter);
router.use("/comments", commentsRouter);
router.use("/notifications", notificationsRouter);
router.use("/stats", statsRouter);
router.use("/users", usersRouter);
router.use("/ai", aiRouter);

export default router;
