import { Modal, Box } from "@mui/material";
import React from "react";
import Cart from "./client_pages/cart";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';


const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 700,
  height: '90%',
  maxHeight: 650,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  outline: 'none',
  overflowY: 'auto',
  overflowX: 'hidden',
};
  

const shoppingCartStyle = {
  position: 'fixed',
  bottom: 50,
  right: 50,
  height: '50px',
  width: '50px',
  color: 'green'
}

export default function ShoppingCart (){
    const [cartOpen, setCartOpen] = React.useState(false);
    const handleCartOpen = ()=> setCartOpen(true);
    const handleCartClose = () => setCartOpen(false);

    return(
        <>
        <div>
         <Modal open={cartOpen} onClose={handleCartClose}>
            <Box sx={style}>
            <Cart></Cart>
            </Box>
         </Modal>
        </div>

         <ShoppingCartIcon sx={shoppingCartStyle} onClick={handleCartOpen} className="cursor-pointer"></ShoppingCartIcon>
        </>
    )
}
