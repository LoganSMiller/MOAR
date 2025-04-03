import { DependencyContainer } from "tsyringe";
import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";
import { MoarDynamicRouter } from "../Routes/MoarDynamicRouter";

/**
 * Service class responsible for registering custom dynamic routers
 * for the MOAR mod using the SPT DynamicRouter system.
 */
export class DynamicRouterModService {
    /** IoC container used to register the router into SPT */
    private container: DependencyContainer;

    constructor(container: DependencyContainer) {
        this.container = container;
    }

    /**
     * Registers a dynamic router that handles a top-level route prefix (e.g., "moar").
     * Creates an instance of MoarDynamicRouter and injects it into the server container.
     *
     * @param name Unique identifier for the router within the container
     * @param routes List of route/action bindings to register under the top-level route
     * @param topLevelRoute Prefix under which all routes are grouped (e.g., "moar")
     */
    public registerDynamicRouter(name: string, routes: RouteAction[], topLevelRoute: string): void {
        const router: IDynamicRouterMod = new MoarDynamicRouter(routes, topLevelRoute);

        // Register router in the container for server use
        this.container.registerInstance<IDynamicRouterMod>(name, router);
        this.container.registerType("DynamicRoutes", name);

        console.log(`[MOAR] Registered MoarDynamicRouter as "${name}"`);
    }
}