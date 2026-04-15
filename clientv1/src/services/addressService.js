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

async function fetchWithCache(url) {
    if (cache[url]) return cache[url];
    try {
        const data = await psgcApi.get(url);
        cache[url] = data;
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
    }
}

const addressService = {
    getRegions: () => fetchWithCache('/regions/'),
    getProvinces: (regionCode) => fetchWithCache(`/regions/${regionCode}/provinces/`),
    getCities: (provinceCode) => fetchWithCache(`/provinces/${provinceCode}/cities-municipalities/`),
    getBarangays: (cityCode) => fetchWithCache(`/cities-municipalities/${cityCode}/barangays/`),
    getRegion: (code) => fetchWithCache(`/regions/${code}/`),
    getProvince: (code) => fetchWithCache(`/provinces/${code}/`),
    getCity: (code) => fetchWithCache(`/cities-municipalities/${code}/`),
    getBarangay: (code) => fetchWithCache(`/barangays/${code}/`),
};

export default addressService;
