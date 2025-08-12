import axios from "axios"
import Endpoint from "@/endpoint"
import { useEffect, useRef, useState } from "react";
import getToken from "@/tokenmanager";
import { useRouter } from "next/router";
import Cookies from 'js-cookie';
import { getCartFromCookie, updateCartItemQuantity, removeItemFromCart} from "../../utils/cart_ops";



export default function Cart(){

    let [cartItems, setCartItems] = useState<any[]>([]); // setCartItems function always updates the state of cartItems by overridding.
    let cartProductImages : any [] =[];
    let temp_cart : any [] = [];
    let temp_cart1 : any [] = [];
    let [useEffectTrigger, setUseEffectTrigger] = useState<string>('0'); // This is to trigger the update of cart items by triggering the useEffect() hook.
    let [timer, setTimer] = useState<number>(0);
    const router = useRouter();
    var token = getToken('token');
    let oldItemBuffer = {ProductID:"0",MOQ:"0",Update:"0",AvailableQty:"0"};
    let newItemBuffer = {ProductID:"0",MOQ:"0",Update:"0",AvailableQty:"0"};
    let body = {
      'productId':`0`,
      'quantity':`0`}
    const cartContainerRef = useRef<HTMLDivElement | null>(null);


    
    //---------------------------------Get Cart (From Cookie or Back-End)-------------------------------
    const fetch_cart = async ()=>{

      const scrollTop = cartContainerRef.current?.scrollTop || 0;
        setCartItems(getCartFromCookie)

        if(token){
            try{ 
               
              const response = await axios.get(`${Endpoint.cart}/view`,{headers:{'Authorization': `Bearer ${token}`}})
                
              // Handle Response Status. 
              if (response.status === 200){
                temp_cart = response.data.data
                
                  if (temp_cart.length != 0){
                    for(let i =0;i<temp_cart.length;i++){
                      const response = await axios.get(`${Endpoint.products}/product/${temp_cart[i].ProductID}`)
                      const product = response.data.data;
                      temp_cart1.push({"ProductID":product.ProductID,"ProductName":product.ProductName,"Quantity":temp_cart[i].Quantity,"Price":product.Price,"PromoActive":product.PromoActive,"DiscPrice":product.DiscPrice,"AvailableQty":product.AvailableQty,"MOQ":product.MOQ});
                    }
                    
                  }
                
                setCartItems(temp_cart1)
                temp_cart1=[]
                setTimeout(() => {
                  if (cartContainerRef.current) {
                    cartContainerRef.current.scrollTop = scrollTop;
                  }
                }, 0);
                }
            }
            catch(error){
                console.error("Error fetching cart:", error);
            }
        } 
    }
    
    useEffect(()=>{

      //--------------------------------Get Cart Images of Cart------------------------------
        const getCartImages = async ()=>{

            
            if(cartItems.length > 0){
               
                for (let product of cartItems){
                    try{

                        const response = await axios.get(`${Endpoint.products}/image/${product.ProductID}`);  // Fetch productimage by ID
                        // Handle Response Status. 
                        if (response.status === 200){
                            cartProductImages.push({ProductImage:response.data.data,ProductID:product.ProductID});
                        }
                    }
                    catch(error){
                        console.log("Error fetching images of products:", error);
                    }
                }
            }
        }

        // ----------------Set the Cart Items whether Front or Back End Cart------------------------
        fetch_cart();
        getCartImages();

    },[useEffectTrigger]);


    //--------------------------------------Update Cart Function -------------------------------------------
    const updateCart = async (item: any) => {

        if (parseInt(item.Update)>0 ){

            if(item.Update < item.MOQ){
                alert(`Minimum Order Quantity is ${item.MOQ}`)
                return;
            }
            if(item.Update > item.AvailableQty){ 
                alert(`Available Quantity is ${item.AvailableQty}`)
                return;
            }
            if(token){

                // ----------------------------Update Back-End Cart --------------------------------------
                try{
                  body.productId = item.ProductID;
                  body.quantity =  item.Update;
                  const response = await axios.put(`${Endpoint.cart}/edit`,body,{headers:{'Authorization': `Bearer ${token}`}});
                  //alert(response.data.message)
                }
                catch(error){
                    
                    //alert(`${error} this one`)
                }
                finally{
                  fetch_cart(); 
                }
            }
            else{   
                updateCartItemQuantity(item);
                fetch_cart();
            }
        }
        else{
            alert('Enter positive values only.');
        }
        
    };

    //-------------------------------------Remove Item Function ----------------------------------
    const removeItem =async (id: any)=>{
        if(token){
            
            try{
              const response = await axios.delete(`${Endpoint.cart}/delete/${id}`,{headers:{'Authorization': `Bearer ${token}`}});
                alert(response.data.message)
            }
            catch(error: any){
                console.log(`Error deleting an item`,error);
                alert(error?.response?.data?.message || 'Error deleting item')
                setUseEffectTrigger(Math.random().toString());
            }
        }
        else{   
            setUseEffectTrigger(Math.random().toString());
            removeItemFromCart(id);
            alert("Removed Succesfully")
        }
        setUseEffectTrigger(Math.random().toString());
    }

    //-------------------------Auto Save Cart Item After 10 seconds----------------------------
    const interval = setTimeout(() => {

      setTimer(timer + 1); // For Demo Purposes Only. Will be removed in production.
      autoSave(oldItemBuffer,newItemBuffer);
       }, 5000);

    interval;

  //-------------------------------------AUTO SAVE FUNCTION------------------------------------  
  const autoSave = (oldItem: any, newItem: any) => {

      // --------------------Check if the oldItem is the same as the newItem-------------------
      if (oldItem.ProductID === newItem.ProductID){

        // ---------------------Check if there is a change in the quantity of the item---------
        if(oldItem.Update !== newItem.Update){
              if (newItem.Update < newItem.MOQ){
                alert(`Minimum Order Quantity is ${newItem.MOQ}`)
                return;
              }
              if (newItem.Update > newItem.AvailableQty){
                alert(`Available Quantity is ${newItem.AvailableQty}`)
                return;
              }
              updateCart(newItem);
              oldItem.Update = newItem.Update;
              oldItem.ProductID = newItem.ProductID;
              oldItem.MOQ = newItem.MOQ;
              oldItem.AvailableQty = newItem.AvailableQty;
        }
      }
      else{

        if (newItem.Update < newItem.MOQ){
            alert(`Minimum Order Quantity is ${newItem.MOQ}`)
            return;
          }
          if (newItem.Update > newItem.AvailableQty){
            alert(`Available Quantity is ${newItem.AvailableQty}`)
            return;
          }
          updateCart(newItem);
          oldItem.Update = newItem.Update;
          oldItem.ProductID = newItem.ProductID;
          oldItem.MOQ = newItem.MOQ;
          oldItem.AvailableQty = newItem.AvailableQty;
      }
    
  }
    
  //------------------------------------------Checkout Function----------------------------------
  const checkout = async ()=>{

        if (token){

            try{
                  //--------------------------Call Checkout Endpoint To Create a Transaction ID-----------------------------
                  
                      const response1 = await axios.get(`${Endpoint.checkout}/lockQty`,{headers:{'Authorization': `Bearer ${token}`}});
                      let transactionID = response1.data.data;
                      
                      if (!transactionID){
                        alert('Error checking out. Please try again.');
                        return;
                      }
                      Cookies.set('transactionID', transactionID, { expires: 1 }) 
                      router.push('/client_pages/checkout')             
            }
            catch(error){
                  
                  
            }
            finally{

                //------------------------ GET TRANS ID IF THE CREATING ONE FAILS ----------------------------
                try{
                    const response = await axios.get(`${Endpoint.checkout}/getTransactionID`,{headers:{'Authorization': `Bearer ${token}`}})
                    let transactionID = response.data.data;                     
                    if (!transactionID){
                        alert('Error checking out. Please try again.');
                        return;
                    }
                    Cookies.set('transactionID', transactionID, { expires: 1 }) 
                    router.push('/client_pages/checkout') 
                }
                catch(error: any){
                    alert(error?.response?.data?.message || 'Checkout error')
                }
            }
        }
        else{
          alert('Please login to checkout.');
          return;
        }
    
  }

  
    
    if (cartItems.length == 0) 
      return(<div className="flex justify-center items-center h-40">
        <h1 className="text-2xl font-bold text-gray-800">No Items in Cart</h1>
       </div>)
    
    return(
   
        <div ref={cartContainerRef} className="lg:col-span-2 p-6 bg-white ">
          <div className="flex gap-2 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex-1">Shopping Cart</h2>
            <h3 className="text-base text-gray-800">{cartItems.length} Items</h3>
            <button onClick={checkout}>Checkout</button>
          </div>

          <table className="mt-6 w-full border-collapse divide-y">
            <thead className="whitespace-nowrap text-left">
              <tr>
                <th className="text-base text-gray-800 p-4">Description</th>
                <th className="text-base text-gray-800 p-4">Quantity</th>
                <th className="text-base text-gray-800 p-4">Price</th>
                <th className="text-base text-gray-800 p-4">Total</th>
              </tr>
            </thead>

            <tbody className="whitespace-nowrap divide-y overflow-x-auto min-h-850">
            {cartItems.map((item) => (
              <tr key={item.ProductID} className="rounded-md">
                <td className="p-4">
                  <div className="flex items-center gap-4 w-max">
                    <div className="h-32 shrink-0">           
                        {cartProductImages.filter(productImage => productImage.ProductID === item.ProductID).map((productImage) => (
                            <img src={`data:image/jpeg;base64,${productImage.ProductImage}`} alt ={`Image of ${item.ProductName}`} className="object-contain rounded-lg" />
                        ))}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">{item.ProductName}</p>
                      <button onClick={() =>{removeItem(item.ProductID)} } className="mt-2 font-semibold text-white-400 text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex divide-x border w-max rounded-lg overflow-hidden">
                    <button type="button" className="flex items-center justify-center bg-gray-100 w-10 h-10 font-semibold" onClick={() =>{updateCart({"ProductID":item.ProductID,"MOQ":item.MOQ,"Update":((parseInt(item.Quantity) - 1)),"AvailableQty":item.AvailableQty})}}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 fill-current" viewBox="0 0 124 124">
                        <path d="M112 50H12C5.4 50 0 55.4 0 62s5.4 12 12 12h100c6.6 0 12-5.4 12-12s-5.4-12-12-12z" data-original="#000000"></path>
                      </svg>
                    </button>
                    <input type='text' onChange={(e)=>{newItemBuffer.ProductID=item.ProductID;newItemBuffer.MOQ=item.MOQ; newItemBuffer.Update = e.target.value; newItemBuffer.AvailableQty=item.AvailableQty}} className='w-16 placeholder-black' placeholder={`${item.Quantity}`}></input>
                    <button type="button" className="flex justify-center items-center bg-gray-800 text-white w-10 h-10 font-semibold" onClick={() =>{updateCart({"ProductID":item.ProductID,"MOQ":item.MOQ,"Update":(parseInt(item.Quantity) + 1),"AvailableQty":item.AvailableQty})}}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 fill-current" viewBox="0 0 42 42">
                        <path d="M37.059 16H26V4.941C26 2.224 23.718 0 21 0s-5 2.224-5 4.941V16H4.941C2.224 16 0 18.282 0 21s2.224 5 4.941 5H16v11.059C16 39.776 18.282 42 21 42s5-2.224 5-4.941V26h11.059C39.776 26 42 23.718 42 21s-2.224-5-4.941-5z" data-original="#000000"></path>
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  {item.PromoActive?<h4 className="text-base font-bold text-gray-800">{`${item.DiscPrice}`}</h4>:<h4 className="text-base font-bold text-gray-800">{`${item.Price}`}</h4>}
                  
                </td>
                <td className="p-4">
                  {item.PromoActive?<h4 className="text-base font-bold text-gray-800">{`RM ${(parseFloat(item.DiscPrice) * parseInt(item.Quantity)).toFixed(2)}`}</h4>:<h4 className="text-base font-bold text-gray-800">{`RM ${(parseFloat(item.Price) * parseInt(item.Quantity)).toFixed(2)}`}</h4>}
                </td>
              </tr>
                ))}
            </tbody>
          </table>
        </div>
    )
}
