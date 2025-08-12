import { useRouter } from "next/router";
import Cookies from "js-cookie";

export default function getToken(name:any){
    return Cookies.get(name);
}

export function set_token(token:any){  
     document.cookie = `token=${token}; path=/; max-age=3600; samesite=lax`;
}



export function deletetoken(token:any){
    if (typeof document === "undefined"){
        return null
    }
    document.cookie = `token=${token}; path=/; max-age=0; secure; samesite=strict`;
}

export function confirmToken(name:any){
    const token = getToken(name)
    const router = useRouter()
    if(!token){
        router.push('/client_pages/login');
    }
}

export function confirmSellerToken(name:any){
    const token = getToken(name)
    const router = useRouter()
    if(!token){
        router.push('/sellerDash/login');
    }
}

export function confirmAdminToken(name:any){
    const token = getToken(name)
    const router = useRouter()
    if(!token){
        router.push('/admin/login');
    }
}

export function set_token_and_role(token: string, role: string) {
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    document.cookie = `token=${token}; path=/; max-age=900; secure; samesite=strict`;
    document.cookie = `role=${role}; path=/; max-age=900; secure; samesite=strict`;
    document.cookie = `expiry=${expiry}; path=/; max-age=900; secure; samesite=strict`;
}

export function getExpiry() {
    return Cookies.get('expiry');
}

export function getRole() {
    return Cookies.get('role');
}

export function deletetoken_and_role() {
    if (typeof document === "undefined") return null;
    document.cookie = `token=; path=/; max-age=0; secure; samesite=strict`;
    document.cookie = `role=; path=/; max-age=0; secure; samesite=strict`;
}

