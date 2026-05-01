const DEFAULT_CORDOVA_API_ORIGIN = "http://192.168.123.2:8000";

function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
}

function isAbsoluteUrl(value) {
    return /^(https?:)?\/\//i.test(String(value || ""));
}

export function isCordovaApp() {
    return window.location.protocol === "file:" || typeof window.cordova !== "undefined";
}

export function getAppBaseUrl() {
    const configuredBase = window.SUKI_CONFIG?.appBaseUrl;

    if (configuredBase) {
        return configuredBase;
    }

    if (window.location.protocol === "file:") {
        return window.location.href.replace(/[^/]*$/, "");
    }

    return `${window.location.origin}/`;
}

export function resolveAppAssetUrl(path) {
    if (!path) return "";
    if (isAbsoluteUrl(path) || String(path).startsWith("data:")) return path;

    return new URL(String(path).replace(/^\/+/, ""), getAppBaseUrl()).href;
}

export function getApiBaseUrl() {
    const configuredBaseUrl = trimTrailingSlash(window.SUKI_CONFIG?.apiBaseUrl);
    const envBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);

    if (configuredBaseUrl) {
        return configuredBaseUrl;
    }

    if (envBaseUrl) {
        if (isAbsoluteUrl(envBaseUrl)) {
            return envBaseUrl;
        }

        if (!isCordovaApp()) {
            return envBaseUrl;
        }
    }

    if (isCordovaApp()) {
        return `${DEFAULT_CORDOVA_API_ORIGIN}/api`;
    }

    return "/api";
}

export function getApiOrigin() {
    const apiBaseUrl = getApiBaseUrl();

    if (isAbsoluteUrl(apiBaseUrl)) {
        return new URL(apiBaseUrl).origin;
    }

    return trimTrailingSlash(window.location.origin);
}

export function resolveBackendUrl(path) {
    if (!path) return "";
    if (isAbsoluteUrl(path) || String(path).startsWith("data:")) return path;

    const normalizedPath = String(path).replace(/^\/+/, "");
    return `${getApiOrigin()}/${normalizedPath}`;
}
