import { useMeQuery } from "../generated/graphql";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const useIsAuth = () => {
    // Checks if user has an authenticated session
    const [{data, fetching}] =useMeQuery();
    const router = useRouter();
    useEffect(() => {
        // If user is not authenticated, redirect to the login page with a query referencing the page they were trying to access
        if (!fetching && !data?.me) {
            router.replace('/login?next=' + router.pathname);
        }
    }, [data, fetching, router]);
}