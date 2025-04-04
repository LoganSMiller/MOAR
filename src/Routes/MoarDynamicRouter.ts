import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";

/**
 * Custom dynamic router implementation for MOAR that registers top-level routes
 * and handles incoming dynamic requests using the SPT dynamic router system.
 */
export class MoarDynamicRouter implements IDynamicRouterMod {
    /** Lookup map of route names to their corresponding handler actions */
    private readonly routeIndex: Map<string, RouteAction>;

    /** Prefix used for routing all endpoints (e.g. "moar") */
    private readonly topLevelRoute: string;

    constructor(routes: RouteAction[], topLevelRoute: string) {
        this.topLevelRoute = topLevelRoute;
        this.routeIndex = new Map(routes.map(r => [r.route, r]));

        console.log(`[MOAR]  MoarDynamicRouter initialized with top-level route: /${topLevelRoute}`);
        for (const route of routes) {
            console.log(`[MOAR] • Registered dynamic route: /${route.route}`);
        }
    }

    /** Returns the base prefix route for all handled routes */
    public getTopLevelRoute(): string {
        return this.topLevelRoute;
    }

    /** Returns the list of route names handled by this dynamic router */
    public getHandledRoutes(): string[] {
        return [...this.routeIndex.keys()];
    }

    /** Returns same as getHandledRoutes (alias for internal use) */
    public getInternalHandledRoutes(): string[] {
        return this.getHandledRoutes();
    }

    /**
     * Determines if this router should handle the given URL.
     * Uses substring match against registered routes.
     */
    public canHandle(url: string): boolean {
        return this.getHandledRoutes().some(route => url.includes(route));
    }

    /** Returns the mod name used in route registration */
    public getModName(): string {
        return "MOAR";
    }

    /**
     * Called by the dynamic router when a request is received.
     * If a matching route is found, invokes its handler.
     */
    public async handleRequest(
        url: string,
        info: any,
        sessionID: string,
        output: string
    ): Promise<string> {
        const routeKey = this.getHandledRoutes().find(r => url.includes(r));
        const routeHandler = routeKey ? this.routeIndex.get(routeKey) : null;

        if (!routeHandler || typeof routeHandler.action !== "function") {
            console.warn(`[MOAR]  No matching route handler for: ${url}`);
            return output;
        }

        try {
            return await routeHandler.action(url, info, sessionID, output);
        } catch (err) {
            console.error(`[MOAR]  Error executing handler for /${routeKey}:`, err);
            return output;
        }
    }
}
