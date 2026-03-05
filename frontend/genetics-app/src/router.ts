type RouteCallback = (params: Record<string, string>) => void;
type RouteGuard = (to: string, from: string | null) => boolean | Promise<boolean>;

interface Route {
  path: string;
  component: string;
  callback?: RouteCallback;
  guard?: RouteGuard;
}

interface RouteChangeEvent {
  route: string;
  params: Record<string, string>;
  from: string | null;
}

class Router {
  #routes: Map<string, Route> = new Map();
  #currentRoute: string | null = null;
  #currentParams: Record<string, string> = {};
  #previousRoute: string | null = null;
  #listeners: Set<(event: RouteChangeEvent) => void> = new Set();

  constructor() {
    this.#initializeBrowserNavigation();
  }

  #initializeBrowserNavigation() {
    window.addEventListener('popstate', () => {
      const path = window.location.pathname;
      this.#handleRouteChange(path, true);
    });
  }

  register(path: string, component: string, options?: { callback?: RouteCallback; guard?: RouteGuard }): void {
    const route: Route = {
      path,
      component,
      callback: options?.callback,
      guard: options?.guard
    };
    this.#routes.set(path, route);
  }

  unregister(path: string): void {
    this.#routes.delete(path);
  }

  async navigate(path: string, params?: Record<string, string>): Promise<boolean> {
    const from = this.#currentRoute;
    const to = this.#resolvePath(path, params);

    const route = this.#findRoute(to);
    if (!route) {
      console.warn(`Route not found: ${to}`);
      return false;
    }

    if (route.guard) {
      const canNavigate = await route.guard(to, from);
      if (!canNavigate) {
        return false;
      }
    }

    this.#currentParams = params || {};
    
    if (to !== window.location.pathname) {
      window.history.pushState({}, '', to);
    }

    this.#handleRouteChange(to, false);
    return true;
  }

  getCurrentRoute(): { path: string; params: Record<string, string> } | null {
    if (!this.#currentRoute) return null;
    return {
      path: this.#currentRoute,
      params: { ...this.#currentParams }
    };
  }

  getRoute(path: string): Route | undefined {
    return this.#findRoute(path);
  }

  onRouteChange(callback: (event: RouteChangeEvent) => void): () => void {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  #findRoute(path: string): Route | undefined {
    for (const [routePath, route] of this.#routes.entries()) {
      const match = this.#matchRoute(routePath, path);
      if (match) {
        return route;
      }
    }
    return undefined;
  }

  #matchRoute(routePath: string, actualPath: string): boolean {
    const routeSegments = routePath.split('/').filter(Boolean);
    const actualSegments = actualPath.split('/').filter(Boolean);

    if (routeSegments.length !== actualSegments.length) {
      return false;
    }

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const actualSegment = actualSegments[i];

      if (routeSegment.startsWith(':')) {
        continue;
      }

      if (routeSegment !== actualSegment) {
        return false;
      }
    }

    return true;
  }

  #extractParams(routePath: string, actualPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const routeSegments = routePath.split('/').filter(Boolean);
    const actualSegments = actualPath.split('/').filter(Boolean);

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const actualSegment = actualSegments[i];

      if (routeSegment.startsWith(':')) {
        const paramName = routeSegment.slice(1);
        params[paramName] = actualSegment;
      }
    }

    return params;
  }

  #resolvePath(path: string, params?: Record<string, string>): string {
    let resolvedPath = path;

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        resolvedPath = resolvedPath.replace(`:${key}`, value);
      }
    }

    return resolvedPath;
  }

  #handleRouteChange(path: string, isPopState: boolean): void {
    const route = this.#findRoute(path);
    if (!route) {
      console.warn(`Route not found: ${path}`);
      return;
    }

    this.#previousRoute = this.#currentRoute;
    this.#currentRoute = path;
    this.#currentParams = this.#extractParams(route.path, path);

    const event: RouteChangeEvent = {
      route: path,
      params: this.#currentParams,
      from: this.#previousRoute
    };

    this.#listeners.forEach(listener => listener(event));

    if (route.callback) {
      route.callback(this.#currentParams);
    }

    this.#dispatchRouteEvent(path, this.#currentParams);
  }

  #dispatchRouteEvent(route: string, params: Record<string, string>): void {
    const event = new CustomEvent('route-change', {
      detail: { route, params },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
  }

  canGoBack(): boolean {
    return window.history.length > 1;
  }

  getRegisteredRoutes(): string[] {
    return Array.from(this.#routes.keys());
  }

  hasRoute(path: string): boolean {
    return this.#routes.has(path) || this.#findRoute(path) !== undefined;
  }
}

const router = new Router();

export { Router, router };
export type { Route, RouteCallback, RouteGuard, RouteChangeEvent };
