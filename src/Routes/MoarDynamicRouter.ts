import { IDynamicRouterMod } from "@spt/server/types/models/spt/mod/IDynamicRouterMod";
import { RouteAction } from "@spt/server/types/models/spt/mod/RouteAction";

/**
 * Custom dynamic router for the MOAR mod.
 * Handles dynamic HTTP requests routed through SPT-AKI's DynamicRouterMod interface.
 */
export class MoarDynamicRouter implements IDynamicRouterMod {
    /** Route prefix (e.g. "moar" for routes like /moar/something) */
    private readonly topLevelRoute: string;

    /** Registered route handlers mapped by route name */
    private readonly routeIndex: Map<string, RouteAction>;

    constructor(routes: RouteAction[], topLevelRoute: string) {
        this.topLevelRoute = topLevelRoute;
        this.routeIndex = new Map(routes.map(route => [route.route, route]));

        console.log(`[MOAR] ✅ MoarDynamicRouter mounted at /${topLevelRoute}`);
        for (const route of routes) {
            console.log(`[MOAR] → /${route.route}`);
        }
    }

    /** Returns the prefix path this router handles (e.g. "moar") */
    public getTopLevelRoute(): string {
        return this.topLevelRoute;
    }

    /** Returns list of registered route names (e.g. ["moar/setPreset"]) */
    public getHandledRoutes(): string[] {
        return [...this.routeIndex.keys()];
    }

    /** Alias of getHandledRoutes used internally by SPT */
    public getInternalHandledRoutes(): string[] {
        return this.getHandledRoutes();
    }

    /** Indicates whether this router can handle a specific incoming URL */
    public canHandle(url: string): boolean {
        return this.getHandledRoutes().some(route => url.includes(route));
    }

    /** Mod name for reference */
    public getModName(): string {
        return "MOAR";
    }

    /**
     * Handles the actual incoming request by executing the registered route handler.
     * Falls back to returning the original output if no match or error occurs.
     */
    public async handleRequest(
        url: string,
        info: any,
        sessionID: string,
        output: string
    ): Promise<string> {
        const matchedRoute = this.getHandledRoutes().find(route => url.includes(route));
        const handler = matchedRoute ? this.routeIndex.get(matchedRoute) : null;

        if (!handler || typeof handler.action !== "function") {
            console.warn(`[MOAR] ⚠ No dynamic route found for: ${url}`);
            return output;
        }

        try {
            return await handler.action(url, info, sessionID, output);
        } catch (err) {
            console.error(`[MOAR] ❌ Error in handler for route: /${matchedRoute}`, err);
            return output;
        }
    }
}
