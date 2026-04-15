import axios from 'axios';

// Philippine Standard Geographic Code (PSGC) API
// Docs: https://psgc.gitlab.io/api/
const psgcApi = axios.create({
    baseURL: 'https://psgc.gitlab.io/api',
    headers: { 'Accept': 'application/json' },
});

// Response interceptor to extract data only
psgcApi.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

const cache = {};
const nameToCodeCache = {};

async function fetchWithCache(url) {
    if (cache[url]) return cache[url];
    try {
        const data = await psgcApi.get(url);
        cache[url] = data;
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
    }
}

/**
 * Searches for a location by name and returns its code
 * This helps when database stores location names instead of PSGC codes
 */
async function searchLocationByName(name, searchType) {
    const cacheKey = `${searchType}:${name}`;
    if (nameToCodeCache[cacheKey]) return nameToCodeCache[cacheKey];

    try {
        const searchUrl = `/${searchType}/?q=${encodeURIComponent(name)}`;
        const results = await fetchWithCache(searchUrl);
        if (results && results.length > 0) {
            const found = results[0];
            nameToCodeCache[cacheKey] = found;
            return found;
        }
    } catch (error) {
        console.error(`Failed to search for ${name}:`, error);
    }
    return null;
}

/**
 * Safely fetches location data, handling both codes and names
 */
async function safeGetLocation(code, endpoint) {
    if (!code) return null;

    // Try direct code first
    const result = await fetchWithCache(`/${endpoint}/${code}/`);
    if (result) return result;

    // If code fails, try searching by name
    const searchType = endpoint.replace('-', '');
    return searchLocationByName(code, searchType);
}

const addressService = {
    getRegions: () => fetchWithCache('/regions/'),
    getProvinces: (regionCode) => fetchWithCache(`/regions/${regionCode}/provinces/`),
    getCities: (provinceCode) => fetchWithCache(`/provinces/${provinceCode}/cities-municipalities/`),
    getBarangays: (cityCode) => fetchWithCache(`/cities-municipalities/${cityCode}/barangays/`),
    getRegion: async (code) => {
        const result = await safeGetLocation(code, 'regions');
        return result || { name: code };
    },
    getProvince: async (code) => {
        const result = await safeGetLocation(code, 'provinces');
        return result || { name: code };
    },
    getCity: async (code) => {
        const result = await safeGetLocation(code, 'cities-municipalities');
        return result || { name: code };
    },
    getBarangay: async (code) => {
        const result = await safeGetLocation(code, 'barangays');
        return result || { name: code };
    },
};

export default addressService;
