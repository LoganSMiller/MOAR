import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";

/**
 * Custom dynamic router for the MOAR mod.
 * Handles dynamic HTTP requests routed through SPT-AKI's DynamicRouterMod interface.
 */
export class MoarDynamicRouter implements IDynamicRouterMod {
    /** Top-level path prefix for this router (e.g., "moar") */
    private readonly topLevelRoute: string;

    /** Route handlers mapped by route string (e.g., "moar/buildWaves") */
    private readonly routeIndex: Map<string, RouteAction>;

    constructor(routes: RouteAction[], topLevelRoute: string) {
        this.topLevelRoute = topLevelRoute;
        this.routeIndex = new Map(routes.map(route => [route.route, route]));

        console.log(`[MOAR] ✅ MoarDynamicRouter mounted at /${topLevelRoute}`);
        for (const route of routes) {
            console.log(`[MOAR] → /${route.route}`);
        }
    }

    /** Path prefix (used by AKI to mount dynamic router) */
    public getTopLevelRoute(): string {
        return this.topLevelRoute;
    }

    /** List of supported route paths */
    public getHandledRoutes(): string[] {
        return [...this.routeIndex.keys()];
    }

    /** AKI internal method alias (must return same as getHandledRoutes) */
    public getInternalHandledRoutes(): string[] {
        return this.getHandledRoutes();
    }

    /** Whether this router handles the given URL */
    public canHandle(url: string): boolean {
        return this.getHandledRoutes().some(route => url.includes(route));
    }

    /** Returns mod name for logging/debugging */
    public getModName(): string {
        return "MOAR";
    }

    /**
     * Entry point: dispatches a matching route handler, if found.
     * Falls back to original output if no match or if handler throws.
     */
    public async handleRequest(
        url: string,
        info: any,
        sessionID: string,
        output: string
    ): Promise<string> {
        const matchedRoute = this.getHandledRoutes().find(route => url.includes(route));
        const handler = matchedRoute ? this.routeIndex.get(matchedRoute) : null;

        if (!handler?.action) {
            console.warn(`[MOAR] ⚠ No matching dynamic route handler found for ${url}`);
            return output;
        }

        try {
            return await handler.action(url, info, sessionID, output);
        } catch (err) {
            console.error(`[MOAR] ❌ Error executing handler for /${matchedRoute}:`, err);
            return output;
        }
    }
}
