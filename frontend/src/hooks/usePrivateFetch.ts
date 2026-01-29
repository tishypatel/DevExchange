import { useRouter } from 'next/navigation';

export function usePrivateFetch() {
    const router = useRouter();

    const authFetch = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem("token");

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            // INTERCEPTOR LOGIC: Catch 401 (Unauthorized)
            if (response.status === 401) {
                // 1. Clean up local storage & cookies
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

                // 2. Redirect with a flag so the Login page knows to show a message
                router.push("/login?expired=true");

                // 3. Stop the flow
                throw new Error("Session expired");
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    return authFetch;
}