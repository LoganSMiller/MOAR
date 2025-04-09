import { DependencyContainer } from "tsyringe";
import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";
import { MoarDynamicRouter } from "../Routes/MoarDynamicRouter";

/**
 * Service class for registering MOAR's dynamic routes into the SPT mod system.
 * Wraps SPT's `DynamicRouterMod` infrastructure using `MoarDynamicRouter`.
 */
export class DynamicRouterModService {
    constructor(private readonly container: DependencyContainer) {}

    /**
     * Registers a dynamic route handler under a top-level path (e.g., /moar).
     *
     * @param name - Unique DI container key for this router
     * @param routes - Array of route handlers to register
     * @param topLevelRoute - Base path prefix (e.g., "moar" → `/moar/*`)
     */
    public registerDynamicRouter(
        name: string,
        routes: RouteAction[],
        topLevelRoute: string
    ): void {
        if (!routes || routes.length === 0) {
            console.warn(`[MOAR] ⚠ Skipping dynamic router "${name}" — no routes provided.`);
            return;
        }

        const router: IDynamicRouterMod = new MoarDynamicRouter(routes, topLevelRoute);

        // Bind router instance to container
        this.container.registerInstance<IDynamicRouterMod>(name, router);

        // Register with AKI dynamic route system
        this.container.registerType("DynamicRoutes", name);

        console.log(`[MOAR] ✅ Dynamic router "${name}" registered under "/${topLevelRoute}"`);
    }
}
