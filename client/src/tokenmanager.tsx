import { useRouter } from "next/router";
import Cookies from "js-cookie";

export default function getToken(name: any) {
    try {
        return Cookies.get(name);
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

export function set_token(token: any) {
    try {
        // Use consistent cookie settings that work in all environments
        if (typeof document !== "undefined") {
            // Set cookie with proper attributes
            document.cookie = `token=${token}; path=/; max-age=3600; samesite=lax`;
            
            // Also use js-cookie as backup
            Cookies.set('token', token, { 
                expires: 1/24, // 1 hour 
                path: '/',
                sameSite: 'lax'
            });
            
            console.log('Token set successfully:', token.substring(0, 20) + '...');
        }
    } catch (error) {
        console.error('Error setting token:', error);
    }
}

export function deletetoken(name: any) {
    try {
        if (typeof document !== "undefined") {
            // Delete cookie using both methods
            document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
            Cookies.remove(name, { path: '/' });
            console.log('Token deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting token:', error);
    }
}

export function confirmToken(name: any) {
    const token = getToken(name);
    const router = useRouter();
    if (!token) {
        router.push('/client_pages/login');
    }
}

export function confirmSellerToken(name: any) {
    const token = getToken(name);
    const router = useRouter();
    if (!token) {
        router.push('/sellerDash/login');
    }
}

export function confirmAdminToken(name: any) {
    const token = getToken(name);
    const router = useRouter();
    if (!token) {
        router.push('/admin/login');
    }
}

export function set_token_and_role(token: string, role: string) {
    try {
        const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now

        if (typeof document !== "undefined") {
            document.cookie = `token=${token}; path=/; max-age=900; samesite=lax`;
            document.cookie = `role=${role}; path=/; max-age=900; samesite=lax`;
            document.cookie = `expiry=${expiry}; path=/; max-age=900; samesite=lax`;
            
            // Backup with js-cookie
            Cookies.set('token', token, { expires: 1/96, path: '/', sameSite: 'lax' }); // 15 minutes
            Cookies.set('role', role, { expires: 1/96, path: '/', sameSite: 'lax' });
            Cookies.set('expiry', expiry.toString(), { expires: 1/96, path: '/', sameSite: 'lax' });
        }
    } catch (error) {
        console.error('Error setting token and role:', error);
    }
}

export function getExpiry() {
    return Cookies.get('expiry');
}

export function getRole() {
    return Cookies.get('role');
}

export function deletetoken_and_role() {
    try {
        if (typeof document !== "undefined") {
            document.cookie = `token=; path=/; max-age=0; samesite=lax`;
            document.cookie = `role=; path=/; max-age=0; samesite=lax`;
            document.cookie = `expiry=; path=/; max-age=0; samesite=lax`;
            
            // Backup removal
            Cookies.remove('token', { path: '/' });
            Cookies.remove('role', { path: '/' });
            Cookies.remove('expiry', { path: '/' });
        }
    } catch (error) {
        console.error('Error deleting tokens:', error);
    }
}

