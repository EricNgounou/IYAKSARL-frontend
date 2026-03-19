import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { NavBar, Footer } from './components/Static';
import {
  Home,
  Shop,
  Blog,
  About,
  SignPage,
  ProductView,
  CartView,
  DataControlPage,
  AccountPage,
} from './components/pages';
import ScrollToTop from './components/ScrollToTop';
import './styles/index.css';
import { cart } from './data';
import { fetchUser, fetchProducts } from './components/helpers';
import { PageLoadManager } from './components/Dynamic';
import { Product } from './bluePrints';

function App() {
  const { pathname } = useLocation();
  const signPaths = ['/login', '/register'];
  const shopPaths = ['/shop', '/shop/:id'];
  const [allProducts, setAllProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasFetchingUserFailed, setHasFetchingUserFailed] = useState(false);
  const [itemCount, setItemCount] = useState(cart.items.length);

  function updateCart(product, isAdded) {
    if (!isAdded) {
      cart.items.unshift({
        order_id: null,
        product_id: product._id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        sub_total: product.price,
        img_url: product.imgurls.find((img) => img.isDefault),
      });
      cart.order.total_items_amount += product.price;
    } else if (isAdded) {
      let subTotal;
      const index = cart.items.findIndex((item) => {
        subTotal = item.sub_total;
        return item.product_id === product._id;
      });
      cart.items.splice(index, 1);
      cart.order.total_items_amount -= subTotal;
    }
    setItemCount(cart.items.length);
  }

  const updatesObject = {
    cartItems: cart.items,
    updateCart,
    itemCount,
    products: allProducts,
  };

  const navBarObject = {
    currentUser,
    itemCount,
  };

  const cartObject = {
    updateCart,
    setItemCount,
    itemCount,
    products: allProducts,
    setAllProducts,
    cartItems: cart.items,
    currentUser,
    setCurrentUser,
    setHasFetchingUserFailed,
  };

  const userObject = {
    currentUser,
    setCurrentUser,
    setHasFetchingUserFailed,
  };

  const signObject = {
    currentUser,
    setCurrentUser,
    setHasFetchingUserFailed,
  };

  useEffect(() => {
    (async () => {
      await fetchUser(setCurrentUser, setHasFetchingUserFailed);
      await fetchProducts(setAllProducts);
    })();
  }, []);

  return (
    <>
      <ScrollToTop />
      <NavBar navBarOb={navBarObject} />
      <Routes>
        <Route path="/" element={<Home updatesOb={updatesObject} />} />
        {shopPaths.map((path) => (
          <Route path={path} element={<Shop updatesOb={updatesObject} />} />
        ))}

        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/data-control/:id"
          element={
            <DataControlPage
              products={allProducts}
              setAllProducts={setAllProducts}
            />
          }
        />

        <Route path="/cart" element={<CartView cartOb={cartObject} />} />

        {signPaths.map((path) => (
          <Route path={path} element={<SignPage signOb={signObject} />} />
        ))}

        <Route
          path="/user-page"
          element={
            <PageLoadManager
              pathOnfailed={'/'}
              page={<AccountPage userOb={userObject} />}
              targetState={currentUser}
              hasFailed={hasFetchingUserFailed}
            />
          }
        />

        <Route
          path={'/products/:id'}
          element={<ProductView updatesOb={updatesObject} />}
        />
      </Routes>
      <Footer
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        setHasFetchingUserFailed={setHasFetchingUserFailed}
      />
    </>
  );
}

export default App;
