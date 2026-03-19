import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Spinner } from '../Dynamic';

export default function ProductView({ updatesOb }) {
  const { products, updateCart, cartItems, itemCount } = updatesOb;
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [curImgUrlOb, setCurImgUrlOb] = useState(null);
  const navigate = useNavigate();
  const [showImages, setShowImages] = useState(false);

  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (products.length) {
      const product = products.find((prod) => prod._id === id);
      let imgIndex;
      const mainImgUrlOb = product.imgurls.find((urlOb, i) => {
        imgIndex = i;
        return urlOb.isDefault;
      });
      setProduct(product);
      setIsAdded(cartItems.some((item) => item.product_id === product._id));
      setCurImgUrlOb({ index: imgIndex, ...mainImgUrlOb });
    }
  }, [products]);

  useEffect(() => {
    if (product)
      setIsAdded(cartItems.some((item) => item.product_id === product._id));
  }, [itemCount]);

  return (
    <div className={`${showImages ? 'single_column' : ''}`} id="product_view">
      {product ? (
        <>
          <div className="head">
            <h2> {product.name}</h2>
            <span
              onClick={(e) => {
                if (showImages) {
                  setShowImages(false);
                  return;
                }
                navigate(-1);
              }}
            >
              &larr; Back
            </span>
          </div>

          <figure className={`gallery ${showImages ? 'scroll' : ''}`}>
            {!showImages && (
              <picture
                onClick={(e) => {
                  setShowImages(true);
                }}
              >
                <source srcSet={curImgUrlOb.mainUrlAVIF} type="image/avif" />
                <source srcSet={curImgUrlOb.mainUrlWEBP} type="image/webp" />
                <img
                  className="product_image"
                  src={curImgUrlOb.mainUrlJPEG}
                  alt={curImgUrlOb.altText}
                />
              </picture>
            )}

            {showImages && (
              <>
                {product.imgurls.map((urlOb, i) => (
                  <picture>
                    <source srcSet={urlOb.mainUrlAVIF} type="image/avif" />
                    <source srcSet={urlOb.mainUrlWEBP} type="image/webp" />
                    <img
                      className="product_image"
                      src={urlOb.mainUrlJPEG}
                      loading="lazy"
                      alt={urlOb.altText}
                    />
                  </picture>
                ))}
              </>
            )}
            {!showImages && (
              <figcaption className="image_prev">
                {product.imgurls.map((urlOb, i) => (
                  <span
                    key={i}
                    style={{
                      border:
                        i === curImgUrlOb.index ? '2px solid green' : 'none',
                    }}
                    onClick={(e) => {
                      setCurImgUrlOb((prevState) => {
                        const newState = { index: i, ...product.imgurls[i] };
                        return newState;
                      });
                    }}
                  >
                    <picture>
                      <source
                        srcSet={urlOb.thumbnailUrlAVIF}
                        type="image/avif"
                      />
                      <source
                        srcSet={urlOb.thumbnailUrlWEBP}
                        type="image/webp"
                      />
                      <img
                        src={urlOb.thumbnailUrlJPEG}
                        loading="lazy"
                        alt={urlOb.altText}
                      />
                    </picture>
                  </span>
                ))}
              </figcaption>
            )}
          </figure>

          {!showImages && (
            <div className="product_control">
              {product.description.map((desc, i) =>
                i === 0 && !desc.value ? null : (
                  <p
                    key={i}
                    className={i === 0 ? 'main_decription' : 'desc_param'}
                  >
                    {i !== 0 ? (
                      <>
                        <span>{desc.property}</span> :{' '}
                        <span
                          style={{
                            fontWeight: '600',
                          }}
                        >
                          {desc.value}
                        </span>
                      </>
                    ) : (
                      desc.value
                    )}
                  </p>
                ),
              )}

              <span>{product.price} XAF</span>
              <p>
                In stock : <span> {product.instock}</span>
              </p>
              <p>
                Sales : <span>{product.sales}</span>
              </p>

              <button
                className={`btn_add ${isAdded ? 'added' : ''}`}
                onClick={(e) => {
                  updateCart(product, isAdded);
                }}
              >
                {`Add${isAdded ? 'ed' : ' to basket'}`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spinner />
        </div>
      )}
    </div>
  );
}
