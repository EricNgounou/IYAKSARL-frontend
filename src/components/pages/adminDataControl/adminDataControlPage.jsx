import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';

import { formatDate } from '../../helpers';
import { Overlay, Spinner } from '../../Dynamic';
import { ProductsControlPage } from './productsControlPage';
import { UsersControlPage } from './usersControlPage';
import { OrdersControlPage } from './ordersControlPage';

export default function DataControlPage(props) {
  const { products, setAllProducts } = props;
  const navigate = useNavigate();
  const { id } = useParams();
  const [overlay, setOverlay] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  function handleControlSearch(e) {
    e.preventDefault();
  }

  useEffect(() => {
    if (isLoading) {
      setOverlay(
        <div
          style={{
            width: '200px',
            height: '70px',
            background: 'white',
            borderRadius: '150px',
            fontSize: '1.2rem',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          Loading
          <Spinner />
        </div>,
      );
    } else {
      setOverlay(null);
    }
  }, [isLoading]);

  return (
    <section id="control_page">
      <div className="nav_bar">
        <h1 className="label">Data management</h1>
        <ul>
          <NavLink to="/data-control/products">
            <li>Products</li>
          </NavLink>
          <NavLink to="/data-control/orders">
            <li>Orders</li>
          </NavLink>
          <NavLink to="/data-control/users">
            <li>Users</li>
          </NavLink>
          <form id="control_search" onSubmit={handleControlSearch}>
            <input
              type="text"
              placeholder={`Find ${id === 'orders' ? 'an' : 'a'} ${id.slice(
                0,
                -1,
              )}`}
            />
            <button>
              <img src="/loupe.png" alt="Loupe icon" />
            </button>
          </form>
        </ul>
        <span
          id="control_exit"
          onClick={(e) => {
            navigate('/');
          }}
        >
          Exit
        </span>
      </div>
      <main id="control_display">
        {id === 'products' && (
          <ProductsControlPage
            setOverlay={setOverlay}
            setIsLoading={setIsLoading}
            products={products}
            setAllProducts={setAllProducts}
          />
        )}
        {id === 'orders' && <OrdersControlPage />}
        {id === 'users' && <UsersControlPage />}
      </main>
      {overlay && <Overlay content={overlay} />}
    </section>
  );
}
