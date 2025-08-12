import React, { use, useEffect, useState } from 'react';
import User_layout from '../layouts'
import axios from 'axios';
import Endpoint from '@/endpoint';
import getToken from '@/tokenmanager';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { get } from 'http';

export default function SummaryPage(){

    const token = getToken("token");
    let [cart, setCart] = useState([]);
    let [total, setTotal] = useState(0);
    let [delivery,setDelivery]= useState({})
    const router = useRouter();
    let body = {
        "transactionId": "",
        "deliveryDetails": {}    
    };
    let[deliveryFee,setDeliveryFee]=useState(0)

    useEffect(()  => {
       
        //------------------Check Token-------------------
        if(!token){
            alert("Session Expired")
            router.push("../")
        }

        //---------------- Get the cart from the backend--------------------
        const getCart = async () => {
                
                    try{
                        let temp_cart : any [] = []; // Do not use Global variables
                        let temp_cart1 : any [] = [];
                        

                        const response = await axios.get(`${Endpoint.cart}/view`,{headers:{'Authorization': `Bearer ${token}`}});
                        // Handle Response Status. 
                        if (response.status === 200){
                            temp_cart = response.data.data
                            
                            if (temp_cart.length != 0){
                                for(let i = 0;i<temp_cart.length;i++){
                                const response = await axios.get(`${Endpoint.products}/product/${temp_cart[i].ProductID}`)
                                const product = response.data.data;
                                if (product.PromoActive){
                                    temp_cart1.push({"ProductID":product.ProductID,"ProductName":product.ProductName,"Quantity":temp_cart[i].Quantity,"Price":product.DiscPrice});
                                }else{
                                    temp_cart1.push({"ProductID":product.ProductID,"ProductName":product.ProductName,"Quantity":temp_cart[i].Quantity,"Price":product.Price});
                                }
                               
                                }       
                            }
                            
                            setCart(temp_cart1||[])
                            temp_cart1=[]
                            }
                        
                        
                    }
                    catch(error){
                        alert(error);
                    }
                
        }

       getCart(); 
       
       // ---------------------CHECK IF THE DELIVERY DETAILS EXIST----------------------------
       let delivery1 = Cookies.get('delivery');
        if (!delivery1) {
            alert('Please Provide Delivery Details');
            router.push('/client_pages/checkout');
        }
        setDelivery(JSON.parse(delivery1 || "{}"))
    }, []);

    useEffect(() => {
        const getDelivery = async () => {
            try{
                const response = await axios.get(`${Endpoint.checkout}/getDeliveryFee/${delivery.PostalCode}`,{headers:{'Authorization': `Bearer ${token}`}});
                if (response.status === 200){
                    setDeliveryFee(response.data.data)
                }
            }
            catch(error){
                alert(error.response.data.message);
            }
        }
        getDelivery();
    },[delivery])
    useEffect(() => {
        // Calculate the total price of the cart
        if(cart.length > 0){
            let total1 = 0;

            for(let i=0; i<cart.length; i++){
                total1 = total1 + (parseFloat(cart[i].Price) * parseInt(cart[i].Quantity)); 
            } 
            total1 = total1 + parseInt(deliveryFee);
            setTotal(total1)
        }
    },[cart, deliveryFee]);

    //-----------------------------------Proceed-to-payment Function----------------------------------
    const proceed_to_payment = async () => {
        event.preventDefault();

        let URL = "null";

        if (token){
            //------------------------ GET DELIVERY DETAILS AND TRANSACTION ID FROM COOKIE-------------------------
            body.deliveryDetails = JSON.parse(Cookies.get('delivery') || "{}");
            body.transactionId = Cookies.get('transactionID') || "";

            //-------------------------------CALL PROCEED TO PAYMENT CHECKPOINT -----------------------------------
            try{
                const response = await axios.post(`${Endpoint.checkout}/proceedToPayment`,body,{headers:{'Authorization': `Bearer ${token}`}});
                if ( response.data.status == 200){
                    URL = response.data.data;
                    router.push(URL)
                }else{
                    alert(`${response.data.message}`)
                    router.push('../')
                }
                
            }
            catch(error){
                console.log(error);
                alert(`${error}, this one`)
            }  
        }
        else{
            alert('Session Expired');
            router.push('./');
        }
    }

    const edit = () => {
        router.push('/client_pages/checkout');
    }
    return (
        <User_layout>
            <div className="container min-h-screen mx-auto px-4 py-8">
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Billing & Delivery Information */}
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4">Billing & Delivery Information</h4>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600"><strong>First Name:</strong> {delivery.FirstName}</p>
                                <p className="text-sm text-gray-600"><strong>Contact Number:</strong> {delivery.ContactNo}</p>
                                <p className="text-sm text-gray-600"><strong>Address:</strong> {delivery.Address}</p>
                                <p className="text-sm text-gray-600"><strong>Postal Code:</strong> {delivery.PostalCode}</p>
                            </div>
                            <button 
                                onClick={edit} 
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Edit
                            </button>
                        </div>

                        {/* Cart Summary */}
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4">Cart Summary</h4>
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                                    <tr>
                                        <th className="px-4 py-2">Product</th>
                                        <th className="px-4 py-2">Price</th>
                                        <th className="px-4 py-2">Quantity</th>
                                        <th className="px-4 py-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="px-4 py-2">{item.ProductName}</td>
                                            <td className="px-4 py-2">{`RM ${item.Price}`}</td>
                                            <td className="px-4 py-2">{`x${item.Quantity}`}</td>
                                            <td className="px-4 py-2">{`RM ${(parseFloat(item.Price) * parseInt(item.Quantity)).toFixed(2)}`}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t">
                                        <td className="px-4 py-2 font-semibold" colSpan={3}>Delivery Fee</td>
                                        <td className="px-4 py-2">{`RM ${deliveryFee}`}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total and Proceed to Payment */}
                    <div className="mt-6 flex flex-col items-center">
                        <h4 className="text-xl font-bold text-gray-800 mb-4">Total: RM {total.toFixed(2)}</h4>
                        <button 
                            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            onClick={proceed_to_payment}
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </User_layout>
    );
}

