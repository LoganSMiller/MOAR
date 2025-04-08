import { DependencyContainer } from "tsyringe";
import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";
import { MoarDynamicRouter } from "../Routes/MoarDynamicRouter";

/**
 * Service class for registering MOAR's dynamic routes into the SPT mod system.
 * Uses SPT's DynamicRouterMod infrastructure to bind custom /moar endpoints.
 */
export class DynamicRouterModService {
    private readonly container: DependencyContainer;

    constructor(container: DependencyContainer) {
        this.container = container;
    }

    /**
     * Registers a new dynamic route handler under a shared route prefix (e.g., /moar/*).
     *
     * @param name - Internal identifier to bind the router to the DI container
     * @param routes - Array of route actions to attach
     * @param topLevelRoute - Prefix route path (e.g. "moar" → becomes "/moar/*")
     */
    public registerDynamicRouter(
        name: string,
        routes: RouteAction[],
        topLevelRoute: string
    ): void {
        if (!routes?.length) {
            console.warn(`[MOAR] ⚠ Attempted to register dynamic router "${name}" with no routes.`);
            return;
        }

        const router: IDynamicRouterMod = new MoarDynamicRouter(routes, topLevelRoute);

        // Register router instance into the DI container
        this.container.registerInstance<IDynamicRouterMod>(name, router);

        // Tag it as a dynamic route provider
        this.container.registerType("DynamicRoutes", name);

        console.log(`[MOAR] ✅ Dynamic router "${name}" registered under "/${topLevelRoute}"`);
    }
}
