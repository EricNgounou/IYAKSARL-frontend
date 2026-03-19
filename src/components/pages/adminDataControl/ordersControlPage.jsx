import { useEffect, useState } from 'react';
import { fetchOrders } from '../../helpers';
import { Spinner } from '../../Dynamic';

export function OrdersControlPage() {
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    fetchOrders(setAllOrders);
  }, []);

  return (
    <section id="orders_control" className="main">
      {allOrders.length ? (
        <>
          <section className="left_side">
            <ul></ul>
            <ul className="orders_list">
              {allOrders.map((order) => (
                <li className="order_list_item" key={order._id}>
                  <span></span>
                  <span>{order.total_items}</span>
                  <span></span>

                  {order._id}
                </li>
              ))}
            </ul>
          </section>

          <section className="control_side_display">
            {/* Order details will be displayed here */}
          </section>
        </>
      ) : (
        <Spinner />
      )}
    </section>
  );
}
