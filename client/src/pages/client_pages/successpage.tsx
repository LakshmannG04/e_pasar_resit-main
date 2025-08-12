import User_Layout from "../layouts"

export default function Success(){
    return(<>
    <User_Layout>
    <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">THE TRANSACTION IS SUCCESSFUL</h1>
        <p className="text-center text-gray-600">Thank you for your purchase!</p>
        <p className="text-center text-gray-600">Your order is being processed.</p>
    </div>
    </User_Layout>
    
    </>)
}