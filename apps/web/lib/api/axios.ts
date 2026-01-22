import axios from 'axios';

export const customInstance = axios.create({
    baseURL: 'http://localhost:8000',
});

// Add interceptor for Auth later
customInstance.interceptors.request.use(
    (config) => {
        // const token = await supabase.auth.getSession();
        return config;
    },
    (error) => Promise.reject(error)
);

export default customInstance;
