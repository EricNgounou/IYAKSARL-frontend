import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Overlay, Spinner, OverlayMessage } from '../Dynamic';
import { cart } from '../../data';
import { fetchUser, fetchProducts } from '../helpers';

export default function CartView({ cartOb }) {
  const { cartItems } = cartOb;
  const [checkout, setCheckout] = useState(false);
  const [totalPrice, setTotalPrice] = useState(cart.order.total_items_amount);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const goToCheckout = (e) => {
    setCheckout(true);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    setIsUserLoggedIn(Boolean(cartOb.currentUser));
  }, [pathname]);

  return (
    <section id="cart_view">
      {!checkout ? (
        <>
          <div className="head">
            <span id="cart_head_main">
              <img src="shopping-cart.png" alt="Shopping cart icon" />
              <h1>Cart</h1>
            </span>

            <span>Total price: {totalPrice} XAF</span>
            <span
              onClick={(e) => {
                navigate(-1);
              }}
              id="cart_head_close"
            >
              &#10005;
            </span>
          </div>

          <div className="items_container">
            {cartItems.length ? (
              <>
                <h2>Item(s)</h2>
                {cartItems.map((item, i) => (
                  <OrderItems
                    key={i}
                    item={item}
                    cartOb={cartOb}
                    setTotalPrice={setTotalPrice}
                    isEditEnabled={true}
                  />
                ))}

                {!cartOb.currentUser ? (
                  <div className="sign_warning">
                    <strong className="message">
                      We need a way to contact you
                    </strong>
                    <p>
                      <Link to="/login">
                        <span>Sign In</span>
                      </Link>
                      or
                      <Link to="/register">
                        <span>Sign Up</span>
                      </Link>
                      or
                      <span onClick={goToCheckout}>Continue as a Visitor</span>
                    </p>
                  </div>
                ) : (
                  <button className="btn_checkout" onClick={goToCheckout}>
                    Go to checkout
                  </button>
                )}
              </>
            ) : (
              <p className="default_message">
                Your added products will be display here!
              </p>
            )}
          </div>
        </>
      ) : (
        <Checkout
          setCheckout={setCheckout}
          cartOb={cartOb}
          isUserLoggedIn={isUserLoggedIn}
          totalPrice={totalPrice}
          setTotalPrice={setTotalPrice}
        />
      )}
    </section>
  );
}

function OrderItems({ item, cartOb, setTotalPrice, isEditEnabled }) {
  const { products, updateCart } = cartOb;

  const [quantity, setQuantity] = useState(item.quantity);
  const [subTotal, setSubTotal] = useState(null);

  const product = products.find((prod) => prod._id === item.product_id);

  function removeItem() {
    updateCart(product, true);
  }

  useEffect(() => {}, [cartOb.itemCount]);

  useEffect(() => {
    const lastSubValue = item.sub_total;
    item.sub_total = item.unit_price * quantity;
    cart.order.total_items_amount =
      cart.order.total_items_amount - lastSubValue + item.sub_total;
    setSubTotal(item.sub_total);
    setTotalPrice(cart.order.total_items_amount);
  }, [quantity]);

  return (
    <div className="order_item">
      <div>
        <picture>
          <source srcSet={item.img_url.thumbnailUrlAVIF} type="image/avif" />
          <source srcSet={item.img_url.thumbnailUrlWEBP} type="image/webp" />
          <img
            className="item_img"
            src={item.img_url.thumbnailUrlJPEG}
            loading="lazy"
            alt={item.img_url.altText}
          />
        </picture>
      </div>
      <div>
        <div className="item_infos item_name">
          <label>Name :</label>
          <span> {item.product_name}</span>
        </div>
        <div className="item_infos item_price">
          <label>Unit Price :</label>
          <span>{item.unit_price} XAF</span>
        </div>

        <div className="item_infos item_stock">
          <label>In Stock :</label>
          <span>{product.instock}</span>
        </div>

        <div className="item_infos item_quantity">
          <label>Quantity :</label>

          {isEditEnabled ? (
            <div>
              <span
                className="btn btn_decrease"
                onClick={(e) => {
                  quantity === 1 && removeItem();
                  quantity > 1 && setQuantity(--item.quantity);
                }}
              >
                <img
                  src={`${quantity === 1 ? 'delete' : ' minus'}.png`}
                  alt="Minus icon"
                  className={`${quantity === 1 ? 'delete' : ''}`}
                />
              </span>
              <span className="quantity">{quantity}</span>
              <span
                className="btn btn_increase"
                onClick={(e) => {
                  if (product.instock > quantity) setQuantity(++item.quantity);
                }}
              >
                <img src="plus.png" alt="Plus icon" />
              </span>
            </div>
          ) : (
            <span className="quantity">{quantity}</span>
          )}
        </div>
        <div className="item_infos sub_total">
          <label>Sub-total :</label>
          <span>{subTotal} XAF</span>
        </div>
      </div>
    </div>
  );
}

function Checkout({
  setCheckout,
  cartOb,
  isUserLoggedIn,
  totalPrice,
  setTotalPrice,
}) {
  const {
    currentUser,
    cartItems,
    setHasFetchingUserFailed,
    setCurrentUser,
    setAllProducts,
  } = cartOb;
  const navigate = useNavigate();
  const deliveryInp = useRef(null);
  const [isEditEnabled, setIsEditEnabled] = useState(true);
  const [overlayContent, setOverlayContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryInfos, setDeliveryInfos] = useState({
    email: currentUser ? currentUser.email : '',
    phone: '',
    delivery_type: '',
    street: '',
    city: '',
    region: '',
    postal_code: '',
    delivery_cost: 2000,
    payment_method: '',
    payment_status: 'paid',
    delivery_status: 'unshipped',
  });

  const processOrder = async (order, items) => {
    setIsLoading(true);
    setOverlayContent(<Spinner />);
    const url = `${import.meta.env.VITE_API_URL}/orders`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order, items }),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }

    await fetchUser(setCurrentUser, setHasFetchingUserFailed);
    await fetchProducts(setAllProducts);

    setIsLoading(false);
    setOverlayContent(<OverlayMessage message="Order placed successfully!" />);

    setTimeout(() => {
      setOverlayContent(null);
      cart.resetCart();
      cartOb.setItemCount(0);
      navigate(isUserLoggedIn ? '/user-page' : '/shop');
    }, 2000);
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    scrollToTop();
    if (isEditEnabled) {
      cart.order.total_items = cart.items.reduce(
        (acc, cur) => acc + cur.quantity,
        0,
      );
      cart.order.user_id = currentUser?.userInfo._id ?? null;
      cart.order.total_amount =
        cart.order.total_items_amount + deliveryInfos.delivery_cost;

      cart.order.customer_status = currentUser ? 'registered' : 'visitor';
      setIsEditEnabled(false);
      return;
    }
    cart.order.delivery_infos = deliveryInfos;
    processOrder(cart.order, cart.items);
  };

  const handleInputs = (e) => {
    setDeliveryInfos((prevState) => {
      const newState = { ...prevState };
      const property = e.target.getAttribute('id');
      let value = e.target.value;
      if (property === 'email') {
        value = value.toLowerCase();
      } else if (property !== 'delivery_type') {
        value = value.toUpperCase();
      }
      newState[property] = value;
      return newState;
    });
  };

  const goBack = (e) => {
    if (isEditEnabled) {
      setCheckout(false);
    } else {
      setIsEditEnabled(true);
    }
    scrollToTop();
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <h1>Checkout</h1>
      <span className="back" onClick={goBack}>
        &larr; Back
      </span>

      <form
        id="checkout_form"
        onSubmit={handleCheckout}
        area-status={`${isEditEnabled ? 'active' : 'disabled'}`}
      >
        <UserOrderInfos
          isUserLoggedIn={isUserLoggedIn}
          isEditEnabled={isEditEnabled}
          deliveryInfos={deliveryInfos}
          setDeliveryInfos={setDeliveryInfos}
          handleInputs={handleInputs}
        />

        <div id="checkout_items">
          <h2>Item(s)</h2>
          {cartItems.map((item) => (
            <OrderItems
              item={item}
              cartOb={cartOb}
              setTotalPrice={setTotalPrice}
              isEditEnabled={isEditEnabled}
            />
          ))}

          <div id="checkout_amounts">
            <p>
              Total item(s) price : <span>{totalPrice} XAF</span>
            </p>
            {isEditEnabled ? null : (
              <>
                <p>
                  Delivery costs :{' '}
                  <span>{deliveryInfos.delivery_cost} XAF</span>
                </p>
                <p>
                  Total amount : <span>{cart.order.total_amount} XAF</span>
                </p>
              </>
            )}
          </div>
        </div>

        <div id="checkout_payment">
          <h2>
            {isEditEnabled ? 'Choose your payment method *' : 'Payment method'}
          </h2>
          <div id="payment_method_field">
            <select
              id="payment_method"
              value={deliveryInfos.payment_method}
              disabled={!isEditEnabled}
              onChange={handleInputs}
              required
            >
              <option value="">Choose-an-option</option>
              <option value="MTN">MTN</option>
              <option value="ORANGE">ORANGE</option>
            </select>
            <div id="payment_method_operator">
              {deliveryInfos.payment_method && (
                <img
                  src={`./${deliveryInfos.payment_method}.jpg`}
                  alt={`${deliveryInfos.payment_method} logo`}
                />
              )}
            </div>
          </div>
        </div>

        <div id="checkout_controls_btn">
          <button type="button" onClick={goBack}>
            Previous
          </button>
          <button type="submit">{isEditEnabled ? 'Next' : 'Pay'}</button>
        </div>
      </form>
      {overlayContent && (
        <Overlay content={overlayContent} isloading={isLoading} />
      )}
    </>
  );
}

function UserOrderInfos({
  isUserLoggedIn,
  isEditEnabled,
  deliveryInfos,
  setDeliveryInfos,
  handleInputs,
}) {
  return (
    <div id="checkout_user_infos">
      <h2>
        {isEditEnabled ? 'Fill your information' : 'Check your information'}
      </h2>

      <div className="field">
        <label htmlFor="delivery_type">How will you receive your order *</label>
        <select
          id="delivery_type"
          name="delivery_type"
          value={deliveryInfos.delivery_type}
          disabled={!isEditEnabled}
          onChange={handleInputs}
          required
        >
          <option value="">Choose-an-option</option>
          <option value="Home delivery">Home delivery</option>
          <option value="Pickup point">Pickup point</option>
          <option value="In-store discharge">In-store discharge</option>
        </select>
      </div>

      {!isUserLoggedIn && (
        <div className="field">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            name="email"
            value={deliveryInfos.email}
            required
            disabled={!isEditEnabled}
            onInput={handleInputs}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="phone">Phone Number *</label>
        <input
          type="phone"
          id="phone"
          name="phone"
          value={deliveryInfos.phone}
          autoComplete="phone-number"
          disabled={!isEditEnabled}
          onInput={handleInputs}
          required
        />
      </div>

      {deliveryInfos.delivery_type &&
        deliveryInfos.delivery_type !== 'In-store discharge' && (
          <>
            <div className="field">
              <label htmlFor="street">Street Address *</label>
              <input
                type="text"
                id="street"
                name="street"
                value={deliveryInfos.street}
                autoComplete="street-address"
                required
                disabled={!isEditEnabled}
                onInput={handleInputs}
              />
            </div>

            <div className="field">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={deliveryInfos.city}
                autoComplete="address-level2"
                required
                disabled={!isEditEnabled}
                onInput={handleInputs}
              />
            </div>

            <div className="field">
              <label htmlFor="state">State / Province / Region</label>
              <input
                type="text"
                id="region"
                name="state"
                value={deliveryInfos.region}
                autoComplete="address-level1"
                disabled={!isEditEnabled}
                onInput={handleInputs}
              />
            </div>

            <div className="field">
              <label htmlFor="zip">ZIP / Postal code</label>
              <input
                type="text"
                id="postal_code"
                name="zip_code"
                value={deliveryInfos.postal_code}
                autoComplete="postal-code"
                disabled={!isEditEnabled}
                onInput={handleInputs}
              />
            </div>
          </>
        )}
    </div>
  );
}
