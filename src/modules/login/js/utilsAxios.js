import axios from "axios";

/**
 * Adds interceptors to the different HTTP Get methods of javascript
 *
 * @param {Object} params
 * @param {() => Promise<string|undefined>} params.getFreshToken
 *        An async function that returns the latest valid Bearer token, refreshing it if needed.
 * @param {string|RegExp} [params.interceptorUrlRegex]
 *        A regex to test which URLs should have the Authorization header attached.
 *        Relative URLs always match.
 * @returns {void}
 */
function addInterceptor({getFreshToken, interceptorUrlRegex}) {
    axios.interceptors.request.use(
        async (config) => {
            const url = typeof config.url === "object" ? config.url.origin : config.url;

            const shouldAttach =
                !url?.startsWith("http") ||
                (interceptorUrlRegex && url?.match(interceptorUrlRegex));

            if (shouldAttach) {
                const token = await getFreshToken();
                if (token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }

            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    const {fetch: originalFetch} = window;

    window.fetch = async (resource, options = null) => {
        let newOptions = options || {};
        const url =
            typeof resource === "string"
                ? resource
                : (resource && resource.url) || "";

        const shouldAttach =
            !url?.startsWith("http") ||
            (interceptorUrlRegex && url?.match(interceptorUrlRegex));

        if (shouldAttach) {
            const token = await getFreshToken();
            const headers =
                newOptions.headers instanceof Headers
                    ? Object.fromEntries(newOptions.headers.entries())
                    : {...(newOptions.headers || {})};

            if (token) headers.Authorization = `Bearer ${token}`;
            newOptions = {...newOptions, headers};

            if (interceptorUrlRegex && url?.match(interceptorUrlRegex)) {
                newOptions.credentials = "include";
            }
        }

        return originalFetch(resource, newOptions);
    };
}

export default {
    addInterceptor
};
