import React, { use } from 'react';
import { useRef, useEffect, useState } from 'react';

import { useLocation, Link, NavLink, useNavigate } from 'react-router-dom';

import { setFullDisplay } from './pages/Shop';
import { sectionRef } from './pages/Home';
import { Overlay, Spinner } from './Dynamic';
import { fetchUser } from './helpers';

export function NavBar({ navBarOb }) {
  const [scroll, setScroll] = useState({
    last: 0,
    cur: 0,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBarHidden, setIsBarHidden] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    menuOpen && setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (scroll.cur > scroll.last) setIsBarHidden(true);
    else setIsBarHidden(false);
    menuOpen && setMenuOpen(false);
  }, [scroll]);

  useEffect(() => {
    const handleScroll = () => {
      setScroll((prevState) => {
        return { last: prevState.cur, cur: window.scrollY };
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div
        className={`bar${isBarHidden ? ' hidden' : ''} ${pathname === '/' && window.scrollY === 0 && !menuOpen ? 'transparent' : ''}`}
      >
        <div id="bar_left">
          <div
            className="menu"
            onClick={() => {
              setMenuOpen(!menuOpen);
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span className="shop_name">IYAKSARL</span>
        </div>

        <ul className={`nav_links ${menuOpen ? 'open' : ''}`}>
          <NavLink className={`nav_item`} to="/">
            Home
          </NavLink>
          <NavLink className={`nav_item`} to="/shop">
            Shop
          </NavLink>
          <NavLink className={`nav_item`} to="/blog">
            Blog
          </NavLink>
          <NavLink className={`nav_item`} to="/about">
            About
          </NavLink>
        </ul>
        <div className="shopping-cart">
          <NavLink to="/cart">
            <img src="/shopping-cart.png" alt="Shopping cart" />
          </NavLink>
          <span className="count_label">{navBarOb.itemCount}</span>
          <span className="cart_label">Cart</span>
        </div>

        {navBarOb.currentUser ? (
          <Link to="/user-page" id="user-index">
            <strong>
              {navBarOb.currentUser.userInfo.username.slice(0, 1).toUpperCase()}
            </strong>
            <span id="user-label">Account</span>
          </Link>
        ) : (
          <Link to="/login" id="sign-label">
            Sign in
          </Link>
        )}
      </div>

      <div
        className={`menu_space ${
          menuOpen && window.scrollY === 0 ? 'active' : ''
        } ${pathname !== '/' ? 'bar_space' : ''}`}
      ></div>
    </>
  );
}

export function Footer({
  setHasFetchingUserFailed,
  setCurrentUser,
  currentUser,
}) {
  const footerRef = useRef(null);
  const [overlayContent, setOverlayContent] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setFullDisplay(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, []);

  const viewSection = (ref) => {
    ref.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAdmin = (e) => {
    if (currentUser && currentUser.userInfo.isadmin) {
      navigate('/data-control/products');
      return;
    }
    setOverlayContent(
      <AdminCredentialForm
        setOverlayContent={setOverlayContent}
        setHasFetchingUserFailed={setHasFetchingUserFailed}
        setCurrentUser={setCurrentUser}
      />,
    );
  };

  return (
    <>
      <footer ref={footerRef}>
        <div className="site_pages">
          <h3>View in this site</h3>
          <ul>
            <li>
              <Link to="/"> Home</Link>
            </li>

            <p>
              <Link
                to="/"
                onClick={() => {
                  setTimeout(() => {
                    viewSection(sectionRef.section1.current);
                  }, 500);
                }}
              >
                Our Products
              </Link>
            </p>
            <p>
              <Link
                onClick={() => {
                  setTimeout(() => {
                    viewSection(sectionRef.section2.current);
                  }, 500);
                }}
                to="/"
              >
                Wy buy from us?
              </Link>
            </p>
            <li>
              <Link to="/shop"> Shop</Link>
            </li>
            <li>
              <Link to="/blog"> Blog</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </div>

        <div className="support">
          <h3>Help & Support</h3>
          <ul>
            <li>FQA</li>
            <li>Delevery</li>
            <div className="payment">
              <h4>Accepted Payment methods</h4>
              <img src="/MTN&ORANGE.jpeg" alt="MTN&ORANGE" />
            </div>
            <div className="cust_support">
              <h4>Customer support</h4>
              <p>Phone & Whatsapp :</p>
              <p> (+237) 652 22 24 78 / 657 35 74 30 </p>
              <p>Email : iyaksarl2026@gmail.com / ilarysangang@gmail.com </p>
            </div>
          </ul>
        </div>

        <div className="social">
          <h3>Follow us: </h3>
          <ul>
            <li>
              <a
                href="https://www.facebook.com/profile.php?id=100077409074151"
                target="blank"
              >
                <img src="/facebook.png" alt="Facebook" />
              </a>
            </li>
            <li>
              <img src="/tiktok.png" alt="Tiktok" />
            </li>
            <li>
              <img src="/instagram.png" alt="Instagram" />
            </li>
          </ul>
        </div>
        <div id="admin_field">
          <span id="btn_admin" onClick={handleAdmin}>
            Admin space &#128274;
          </span>

          <span> &copy; 2026 Copyright by IYAKSARL.org</span>
          <em>Developed by YTECH</em>
        </div>
      </footer>
      {overlayContent && <Overlay content={overlayContent} />}
    </>
  );
}

function AdminCredentialForm({
  setOverlayContent,
  setCurrentUser,
  setHasFetchingUserFailed,
}) {
  const [credentials, setCredentials] = useState({ key: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputKeyRef = useRef(null);

  const handleInput = (e) => {
    const value = e.target.value;
    const name = e.target.getAttribute('name');
    setCredentials((prevState) => {
      const newState = { ...prevState };
      newState[name] = name === 'key' ? value.toUpperCase() : value;
      return newState;
    });
    error && setError(null);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (isLoading || !credentials.key || !credentials.password) return;
    try {
      setIsLoading(true);
      const url = `${import.meta.env.VITE_API_URL}/admin/login`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message);
      }

      console.log(resData);
      await fetchUser(setCurrentUser, setHasFetchingUserFailed);
      setIsLoading(false);
      setOverlayContent(null);
      navigate('/data-control/products');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeAdminForm = (e) => {
    if (isLoading) return;
    setOverlayContent(null);
  };

  useEffect(() => {
    if (inputKeyRef) {
      inputKeyRef.current.focus();
    }
  }, []);

  return (
    <form
      id="admin_credentials_form"
      className="popup_box"
      onSubmit={handleAdminLogin}
    >
      <p className="message">Enter credentials to login as administrator</p>

      {error && <p className="error">{error}</p>}

      {isLoading && <Spinner />}

      <div className="field">
        <label htmlFor="admin_key_input">Admin key&#128274;</label>
        <input
          ref={inputKeyRef}
          id="admin_key_input"
          name="key"
          type="text"
          value={credentials.key}
          onInput={handleInput}
        />
      </div>

      <div className="field">
        <label htmlFor="admin_password_input"> Password</label>
        <div id="admin_password_field">
          <input
            id="admin_password_input"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={credentials.password}
            onInput={handleInput}
          />
          <span
            className="password_eye"
            onClick={(e) => {
              setShowPassword(!showPassword);
            }}
          >
            <img
              src={`eye_${showPassword ? 'opened' : 'closed'}.png`}
              alt={showPassword ? 'Eye opened' : 'Eye closed'}
            />
          </span>
        </div>
      </div>

      <button className="btn_submit" type="submit">
        Login
      </button>
      <span className="cancel" onClick={closeAdminForm}>
        Cancel
      </span>
    </form>
  );
}
