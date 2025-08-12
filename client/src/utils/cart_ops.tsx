import Cookies from 'js-cookie';


// Save cart to cookie
export const saveCartToCookie = (cartItems: any[]) => {

    Cookies.set('cart', JSON.stringify(cartItems), { expires: 1 }); // expires in 1 day

  };
  


// Retrieve cart from cookie
export const getCartFromCookie = (): any[] => {

      const cart = Cookies.get('cart');
      return cart ? JSON.parse(cart) : []; //Return an Array of objects.

 };
  

// Add or update an item in the cart
 export const addOrUpdateCartItem = (newItem: any) => {

      let cart = getCartFromCookie();
      const existingItemIndex = cart.findIndex((item: any) => item.ProductID === newItem.ProductID);
    
      if (existingItemIndex !== -1) {

          // Update the quantity of the existing item
          cart[existingItemIndex].Quantity = (parseInt(cart[existingItemIndex].Quantity )+parseInt(newItem.Quantity)).toString();

          saveCartToCookie(cart);
          alert('Added Successfully');

      }
      else {

          if(newItem.Quantity >= newItem.MOQ){
            
            //Create A new Item in Cart.
              cart.push(newItem); 
              saveCartToCookie(cart);
              alert("Item Added Successfully");

          }// ALSO CHECK AVAILABLE 
          else{

            alert(`Minimum Order Quantity is ${newItem.MOQ}`);
          }
      }  
  };
  



  // Remove item from cart
  export const removeItemFromCart = (itemId: any) => {
      
      let cart = getCartFromCookie();
      cart = cart.filter((item: any) => item.ProductID !== itemId); // remove item by id

      saveCartToCookie(cart);
      //alert('Removed Successfully');
  };
  

  export const destroyCart = () => {
    Cookies.set('cart',"",{ expires: 0 });
  }


  // Update quantity of an item
  export const updateCartItemQuantity = (newItem: any) => {

      const cart = getCartFromCookie();

      // CHECK IF QUANTITY IS GREATER THAN MOQ
      if (newItem.Update >= newItem.MOQ){

            const quan = newItem.Quantity;
            const existingItemIndex = cart.findIndex((item: any) => item.ProductID === newItem.ProductID);

            cart[existingItemIndex].Quantity = newItem.Update; // UPDATE THE QUANTITY.
            
            saveCartToCookie(cart);
            //alert('Updated Successfully');
      }
      else{
            alert(`Minimum Order is ${newItem.MOQ}`);
      }
      
  };
