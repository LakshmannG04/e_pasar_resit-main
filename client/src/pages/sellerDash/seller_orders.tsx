import axios from 'axios';
import Endpoint from '@/endpoint';
import Sellers_Lay from './layout';
import * as cookie from 'cookie';


export const getServerSideProps = async (context) => {
  
  let orders: any[] = [];
  let token = 'null';

  if (context.req.headers.cookie) {
    const cookies = cookie.parse(context.req.headers.cookie);
    cookies['token'] ? (token = cookies['token']) : token;
  }

  // FETCHING THE orders BASED ON THE SELLER ID.
  try {
    const response = await axios.get(`${Endpoint.orders}`, { headers: { 'Authorization': `Bearer ${token}` } });

    if (response.status === 200) {
      orders = response.data.data;
    }
  } catch (error) {
    console.log('Error fetching orders:', error);
  }

  return {
    props: {
      orders: orders || [],
    },
  };
};

export default function sellerProductListPage({ orders }: any) {
  if (!Array.isArray(orders)) {
    return <div className="text-center py-5 text-danger"> Orders format is invalid</div>;
  }

  // Group orders by TransactionID (from nested array)
  const transactionMap: { [transactionId: string]: any[] } = {};

  orders.forEach((orderGroup: any[]) => {
    orderGroup.forEach((order) => {
      const id = order.TransactionID;
      if (!transactionMap[id]) transactionMap[id] = [];
      transactionMap[id].push(order);
    });
  });

  return (
    <Sellers_Lay>
      <div className="bg-light min-h-screen py-5">
        <div className="container">
          {/* Header */}
          <div className="bg-white p-4 shadow-sm rounded mb-4 text-center">
            <h1 className="text-3xl fw-bold text-primary"> Your Orders</h1>
            <p className="text-muted">Review all your transactions and their products</p>
          </div>

          {/* Render each transaction */}
          {Object.entries(transactionMap).map(([transactionId, products], index) => (
            <div key={transactionId} className="mb-5">
              <div className="bg-white p-3 shadow-sm rounded">
                <h4 className="text-primary fw-bold">
                   Transaction ID: <span className="text-secondary">{transactionId}</span>
                </h4>
                <div className="row g-4 mt-3">
                  {products.map((product, i) => (
                    <div key={i} className="col-md-6 col-lg-4">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <h5 className="card-title text-success"> {product.PRODUCT.ProductName}</h5>
                          <p className="mb-1"><strong>Quantity:</strong> {product.Quantity}</p>
                          <p className="mb-1">
                            <strong>Payment Status:</strong>{' '}
                            <span className={`badge ${product.PaymentClaimStatus === 'CLAIMED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {product.PaymentClaimStatus}
                            </span>
                          </p>
                          <hr />
                          <p className="mb-1">
                            <strong> Delivery:</strong>{' '}
                            <span className={`badge ${product.TRANSACTION.DELIVERY_DETAIL.DeliveryStatus === 'Delivered' ? 'bg-success' : 'bg-info text-dark'}`}>
                              {product.TRANSACTION.DELIVERY_DETAIL.DeliveryStatus}
                            </span>
                          </p>
                          <p className="mb-1"><strong>Address:</strong> {product.TRANSACTION.DELIVERY_DETAIL.Address}</p>
                          <p className="mb-1"><strong>Contact:</strong> {product.TRANSACTION.DELIVERY_DETAIL.ContactNo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* No orders fallback */}
          {orders.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted fs-5"> No orders found.</p>
            </div>
          )}
        </div>
      </div>
    </Sellers_Lay>
  );
}
