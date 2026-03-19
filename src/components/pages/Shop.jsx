// import { Route, Routes } from 'react-router-dom';
import {
  useLocation,
  useParams,
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {} from 'react-router-dom';
import { categories } from '../../data';
import { Spinner } from '../Dynamic';

let barInfo = {
  isBarHidden: false,
  isMenuOpened: false,
  size: 0,
};

let fullDisplay = true;
export const setFullDisplay = (val) => {
  fullDisplay = val;
};

export default function Shop({ updatesOb }) {
  const { products } = updatesOb;
  const { pathname } = useLocation();
  const { id } = useParams();

  const categoryName =
    id && id[0].toUpperCase() + id.slice(1).replaceAll('-', ' ');
  const [openSideBar, setOpenSideBar] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [headSticky, setHeadSticky] = useState(false);
  const [searchResults, setSearchResults] = useState({
    query: '',
    results: [],
  });

  const hStickyStyle = {
    transform: `translateY(${barInfo.size}px)`,
    transition: `transform 0.5s`,
  };
  const selectEl = useRef(null);

  const [curCategory, setCurCategory] = useState(
    id ? products.filter((prod) => prod.category === categoryName) : null,
  );

  const searchProduct = (e) => {
    const value = e.target.value.trim().toLowerCase();

    if (!value) {
      setSearchResults({ query: '', results: [] });
      return;
    }
    const results = products.filter((prod) =>
      prod.name.toLowerCase().includes(value),
    );
    setSearchResults({ query: value, results });
  };

  const handleCategory = (e) => {
    let newCategory;
    const value = e.target.value;
    if (value === 'All') {
      newCategory = products.filter((prod) => prod.category === categoryName);
    } else
      newCategory = products.filter(
        (prod) => prod.category === categoryName && prod.sub_category === value,
      );

    setCurCategory(newCategory);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (id) {
      setCurCategory(products.filter((prod) => prod.category === categoryName));
      selectEl.current.selectedIndex = 0;
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setHeadSticky(scrollY > 95 ? true : false);
  }, [scrollY]);

  return (
    <section className="shop_page">
      <div
        className={`art_head ${headSticky && fullDisplay ? 'sticky' : ''}`}
        style={headSticky && fullDisplay ? hStickyStyle : {}}
      >
        <span
          className="sb_btn"
          onClick={(e) => {
            setOpenSideBar(!openSideBar);
          }}
        >
          <img src="/shopping-bag.png" alt="shopping-bag icon" />
          <span className={openSideBar ? 'close' : ''}>&#8250;</span>
        </span>

        <span
          id="category_index"
          onClick={(e) => {
            setOpenSideBar(!openSideBar);
          }}
        >
          {categoryName ? categoryName : 'Categories'}
        </span>

        {id && (
          <select ref={selectEl} id="category_select" onChange={handleCategory}>
            <option value="All">All</option>
            {categories.get(categoryName).map((subCat, i) => {
              return (
                <option key={i} value={subCat.subCatName}>
                  {subCat.subCatName}
                </option>
              );
            })}
          </select>
        )}

        <form
          onClick={(e) => {
            const queryInp = e.target
              .closest('#search_field')
              .querySelector('#search_box');
            queryInp.focus();
          }}
          id="search_field"
          action=""
        >
          <span className="search_icon">
            <img src="/loupe.png" alt="Search icon" />
          </span>
          <input
            id="search_box"
            type="text"
            placeholder="Search products ..."
            value={searchResults.query}
            onChange={searchProduct}
          />
          {searchResults.results.length ? (
            <ul id="search_results">
              {searchResults.results.map((prod, i) => {
                return <ProductSearchResultPanel key={i} product={prod} />;
              })}
            </ul>
          ) : null}
        </form>

        <ul id="category_options">
          <li>Option 1</li>
          <li>Option 2</li>
          <li>Option 3</li>
          <li>Option 4</li>
          <li>Option 5</li>
        </ul>

        <ul
          className={`side_bar ${openSideBar ? '' : 'closed'}`}
          onMouseLeave={(e) => {
            setOpenSideBar(false);
          }}
        >
          <h3 className="sb_head">All categories</h3>
          <div>
            {Array.from(categories.keys()).map((c, i) => (
              <NavLink
                key={i}
                to={`/shop/${c.replaceAll(' ', '-').toLowerCase()}`}
                onClick={(e) => {
                  setOpenSideBar(false);
                }}
              >
                {c}
                <span></span>
              </NavLink>
            ))}
          </div>
        </ul>
      </div>

      {id && (
        <section className="category">
          {curCategory?.map((prod, i) => {
            return <Product key={i} product={prod} updatesOb={updatesOb} />;
          })}
        </section>
      )}

      <section id="shop_ads">
        <div className="ads">
          <h2>On sale</h2>
        </div>

        <div className="ads">
          <h2>Recommended for you</h2>
        </div>

        <div className="ads">
          <h2>Popular</h2>
        </div>
      </section>
    </section>
  );
}

function Product({ product, updatesOb }) {
  const { cartItems, updateCart, itemCount } = updatesOb;
  const mainImgUrlOb = product.imgurls.find((urlOb) => urlOb.isDefault);
  const isAdded = cartItems.some((item) => item.product_id === product._id);

  useEffect(() => {}, [itemCount]);

  return (
    <div className="product_card">
      <Link to={`/products/${product._id}`}>
        <div className="product">
          <picture>
            <source srcSet={mainImgUrlOb.thumbnailUrlAVIF} type="image/avif" />
            <source srcSet={mainImgUrlOb.thumbnailUrlWEBP} type="image/webp" />
            <img src={mainImgUrlOb.thumbnailUrlJPEG} loading="lazy" />
          </picture>
        </div>
      </Link>
      <div className="prod_control">
        <div className="product_infos">
          <Link
            key={product.id}
            to={`/products/${product._id}`}
            className="product_name"
          >
            {product.name}
          </Link>
          <p className="product_price">{product.price} XAF</p>
          <p className="in_stock">
            In stock : <span>{product.instock} </span>
          </p>
          <p className="sales">
            Sales : <span> {product.sales}</span>
          </p>
        </div>
        <button
          className={`btn_add ${isAdded ? 'added' : ''}`}
          onClick={(e) => {
            updateCart(product, isAdded);
          }}
        >
          {`Add${isAdded ? 'ed' : ' to basket'}`}
        </button>
      </div>
    </div>
  );
}

function ProductSearchResultPanel({ product }) {
  const { name, price, sales, instock } = product;
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (product) {
      setResult({
        name,
        price,
        instock,
        sales,
        img: product.imgurls.find((url) => url.isDefault),
      });
    }
  }, []);

  return (
    <li
      className="search_result_panel"
      onClick={(e) => {
        navigate(`/products/${product._id}`);
      }}
    >
      {result ? (
        <>
          <picture>
            <source srcSet={result.img.thumbnailUrlAVIF} type="image/avif" />
            <source srcSet={result.img.thumbnailUrlWEBP} type="image/webp" />
            <img src={result.img.thumbnailUrlJPEG} alt={result.img.altText} />
          </picture>

          <div className="head">
            <span className="name">{result.name}</span>
            <span className="category_span">{product.category}</span>
          </div>

          <div className="infos">
            <p>
              Price : <span>{result.price} XAF</span>
            </p>
            <p>
              Sales : <span>{result.sales}</span>
            </p>
            <p>
              Instock : <span>{result.instock}</span>
            </p>
          </div>
        </>
      ) : (
        <Spinner />
      )}
    </li>
  );
}
