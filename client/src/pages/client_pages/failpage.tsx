import Endpoint from "@/endpoint";
import User_Layout from "../layouts";
import getToken from "@/tokenmanager";
import axios from "axios";
import { useEffect } from "react";

export default function Fail(){
    
    useEffect(()=>{
        
        const token = getToken("token")
        if(token){
          const cancelCheckOutSession = async () => {
                try{
                    const response = await axios.get(`${Endpoint.checkout}/cancelCheckoutSession`,{headers: {'Authorization': `Bearer ${token}`}})
                    if(response.status == 200){
                        console.log("cancelled")
                    }
                    else{
                        console.log("error")
                    }
                } catch (err){
                    console.log("error")
                }
          }
          
          cancelCheckOutSession();
          
        }
        else{

        }
    },[])

    return(<>
    <User_Layout>
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">THE TRANSACTION IS UNSUCCESSFUL</h1>
            <p className="text-center text-gray-600">Please try again later.</p>
            <p className="text-center text-gray-600">If the problem persists, please contact support.</p>
        </div>
    </User_Layout>
    </>)
}