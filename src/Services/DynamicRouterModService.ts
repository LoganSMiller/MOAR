import { DependencyContainer } from "tsyringe";
import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";
import { MoarDynamicRouter } from "../Routes/MoarDynamicRouter";

/**
 * Service class responsible for registering custom dynamic routers
 * for the MOAR mod using the SPT DynamicRouter system.
 */
export class DynamicRouterModService {
    /** IoC container used to inject dynamic router instances */
    private readonly container: DependencyContainer;

    constructor(container: DependencyContainer) {
        this.container = container;
    }

    /**
     * Registers a dynamic router that handles all routes under a shared top-level path.
     *
     * @param name - Unique identifier for the router within the SPT container
     * @param routes - List of route/action bindings to handle
     * @param topLevelRoute - Path prefix under which all routes are grouped (e.g., "moar")
     */
    public registerDynamicRouter(name: string, routes: RouteAction[], topLevelRoute: string): void {
        if (!Array.isArray(routes) || !routes.length) {
            console.warn(`[MOAR] Attempted to register router "${name}" with no routes.`);
            return;
        }

        const router: IDynamicRouterMod = new MoarDynamicRouter(routes, topLevelRoute);

        this.container.registerInstance<IDynamicRouterMod>(name, router);
        this.container.registerType("DynamicRoutes", name);

        console.log(`[MOAR] ✅ Registered MoarDynamicRouter as "${name}" under /${topLevelRoute}`);
    }
}
