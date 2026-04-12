// Philippine Standard Geographic Code (PSGC) API
// Docs: https://psgc.gitlab.io/api/
const BASE = "https://psgc.gitlab.io/api";

const cache = {};

async function fetchWithCache(url) {
    if (cache[url]) return cache[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
    const data = await res.json();
    cache[url] = data;
    return data;
}

const addressService = {
    getRegions: () => fetchWithCache(`${BASE}/regions/`),
    getProvinces: (regionCode) => fetchWithCache(`${BASE}/regions/${regionCode}/provinces/`),
    getCities: (provinceCode) => fetchWithCache(`${BASE}/provinces/${provinceCode}/cities-municipalities/`),
    getBarangays: (cityCode) => fetchWithCache(`${BASE}/cities-municipalities/${cityCode}/barangays/`),
    getRegion: (code) => fetchWithCache(`${BASE}/regions/${code}/`),
    getProvince: (code) => fetchWithCache(`${BASE}/provinces/${code}/`),
    getCity: (code) => fetchWithCache(`${BASE}/cities-municipalities/${code}/`),
    getBarangay: (code) => fetchWithCache(`${BASE}/barangays/${code}/`),
};

export default addressService;
