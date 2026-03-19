import { useState, useEffect, useRef } from 'react';
import { categories } from '../../../data';
import { days, formatDate } from '../../helpers';
import { Product as ProductClass } from '../../../bluePrints';
import { Overlay, OverlayMessage } from '../../Dynamic';
import ImagesProcessor from './helpers/imageProcessor';
import { fetchProducts } from '../../helpers';

export function ProductsControlPage(props) {
  const { products, setAllProducts, setOverlay } = props;
  const [prodEdit, setProdEdit] = useState({
    curProdEdit: null,
    newProducts: [],
  });
  const [canUpdate, setCanUpdate] = useState(false);

  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortParams, setSortParams] = useState({
    curCat: 'All',
    curSubCat: '',
    curOption: 'All',
    sortBy: 'Date',
  });

  const createProduct = (e) => {
    if (prodEdit.curProdEdit && prodEdit.curProdEdit.hasStateChanged()) {
      setOverlay(
        <Warnning
          prodEdit={prodEdit}
          task={() => {
            setProdEdit((prevState) => {
              return {
                newProducts: [...prevState.newProducts, new ProductClass()],
                curProdEdit: null,
              };
            });
          }}
          setOverlay={setOverlay}
        />,
      );
    } else {
      setProdEdit((prevState) => {
        return {
          newProducts: [...prevState.newProducts, new ProductClass()],
          curProdEdit: null,
        };
      });
    }
  };
  const handleSort = (e) => {
    const newParams = { ...sortParams };
    const targetId = e.target.id;
    const value = e.target.value;
    switch (targetId) {
      case 'prod_control_cat_select':
        newParams.curCat = value;
        newParams.curSubCat = value === 'All' ? '' : 'All';
        break;
      case 'prod_control_subcat_select':
        newParams.curSubCat = value;
        break;
      case 'prod_control_option_select':
        newParams.curOption = value;
        break;
      case 'prod_control_sort_select':
        newParams.sortBy = value;
        break;
      default:
        break;
    }
    setSortParams(newParams);
  };

  async function handleUpdates(e) {
    try {
      props.setIsLoading(true);
      const finalData = { message: null, data: null };
      const isNewproducts = Boolean(!prodEdit.curProdEdit);

      if (isNewproducts) {
        console.log('Creating new products...');
        const url = `${import.meta.env.VITE_API_URL}/products`;
        const uploadTasks = prodEdit.newProducts.map(async (prod, i) => {
          try {
            const formData = new FormData();
            const imgAltTexts = [];

            formData.append('name', prod.name);
            formData.append('category', prod.category);
            formData.append('subcategory', prod.subcategory);
            formData.append('price', prod.price);
            formData.append('instock', prod.instock);
            formData.append('description', JSON.stringify(prod.description));
            prod.imgurls.forEach((imgAsset) => {
              const prodNo = products.length + i + 1;
              formData.append(
                'images',
                imgAsset.main,
                `product-${prodNo}-image.webp`,
              );
              imgAltTexts.push({
                altText: `ProductN°${prodNo} image`,
                isDefault: imgAsset.isDefault,
              });
            });

            formData.append('imgAltTexts', JSON.stringify(imgAltTexts));
            const res = await fetch(url, {
              method: 'POST',
              credentials: 'include',
              body: formData,
            });

            const resData = await res.json();

            if (!res.ok) {
              throw new Error(resData.message);
            }

            return resData;
          } catch (error) {
            console.error(`Error creating product ${i}:`, error);
          }
        });
        const uploadTaskResults = await Promise.all(uploadTasks);
        finalData['data'] = uploadTaskResults;
        finalData['message'] =
          `Successfully uploaded ${uploadTaskResults.length} products!`;
      } else if (!isNewproducts) {
        console.log(`Updating product ${prodEdit.curProdEdit._id} ...`);
        const lastImgURLState =
          prodEdit.curProdEdit.lastStateMemoizer.get('imgurls');
        const url = `${import.meta.env.VITE_API_URL}/products/${prodEdit.curProdEdit._id}`;
        const updatedData = prodEdit.curProdEdit.getChanges();
        const formData = new FormData();
        const imgAlt = lastImgURLState[0].altText;
        const prodNo = imgAlt.match(/\d/)[0];

        if (Object.hasOwn(updatedData, 'imgurls')) {
          const { imgurls } = updatedData;
          const imgAltTexts = [];
          const imgUrls = imgurls
            .map((imgAsset) => {
              if (!imgAsset.isUploaded) {
                formData.append(
                  'images',
                  imgAsset.main,
                  `product-${prodNo}-image.webp`,
                );
                imgAltTexts.push({
                  altText: `ProductN°${prodNo} image`,
                  isDefault: imgAsset.isDefault,
                });
                return null;
              }
              return imgAsset;
            })
            .filter((url) => url);

          if (imgAltTexts.length) {
            formData.append('imgAltTexts', JSON.stringify(imgAltTexts));
          }

          const deletedImgs = lastImgURLState
            .map((lastUrls) => {
              const {
                _id,
                mainUrlAVIF,
                mainUrlWEBP,
                mainUrlJPEG,
                thumbnailUrlAVIF,
                thumbnailUrlWEBP,
                thumbnailUrlJPEG,
              } = lastUrls;

              if (!imgUrls.some((urls) => urls._id === _id)) {
                return [
                  mainUrlAVIF,
                  mainUrlWEBP,
                  mainUrlJPEG,
                  thumbnailUrlAVIF,
                  thumbnailUrlWEBP,
                  thumbnailUrlJPEG,
                ];
              }
              return null;
            })
            .filter((url) => url)
            .flat();

          formData.append('deletedImgs', JSON.stringify(deletedImgs));

          updatedData['imgurls'] = imgUrls;
        }

        formData.append('updates', JSON.stringify(updatedData));

        const res = await fetch(url, {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        });

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.message);
        }

        finalData['data'] = resData.updatedProduct;
        finalData['message'] =
          `Successfully updated product ${resData.updatedProduct.name}`;
      }

      console.log(finalData);
      await fetchProducts(setAllProducts);
      props.setIsLoading(false);
      setTimeout(() => {
        props.setOverlay(<OverlayMessage message={finalData.message} />);
      }, 100);
      setTimeout(() => {
        setProdEdit((prevState) => {
          if (!isNewproducts) {
            finalData.data.lastStateMemoizer = new Map();
            Object.setPrototypeOf(finalData.data, ProductClass.prototype);
            finalData.data.initializeLastState();
          }
          return {
            curProdEdit: !isNewproducts ? finalData.data : null,
            newProducts: [],
          };
        });
        props.setOverlay(null);
      }, 3000);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    setCanUpdate(
      Boolean(
        (prodEdit.curProdEdit &&
          prodEdit.curProdEdit.isReadyForUpdates() &&
          prodEdit.curProdEdit.hasStateChanged()) ||
        (prodEdit.newProducts.length &&
          prodEdit.newProducts.every((prod) => prod.isReadyForUpdates())),
      ),
    );
  }, [prodEdit]);

  useEffect(() => {
    let results =
      sortParams.curCat === 'All'
        ? products
        : products.filter((prod) => prod.category === sortParams.curCat);
    if (sortParams.curSubCat) {
      results =
        sortParams.curSubCat === 'All'
          ? results
          : results.filter((prod) => prod.subcategory === sortParams.curSubCat);
    }
    results =
      sortParams.curOption === 'All'
        ? results
        : sortParams.curOption === 'In stock'
          ? results.filter((prod) => prod.instock > 0)
          : results.filter((prod) => prod.instock === 0);

    results.sort((a, b) => {
      switch (sortParams.sortBy) {
        case 'Name':
          return a.name.localeCompare(b.name);
        case 'Date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'Stock':
          return a.instock - b.instock;
        case 'Sales':
          return b.sales - a.sales;
        default:
          break;
      }
    });
    setSortedProducts([...results]);
  }, [sortParams, products]);

  return (
    <section id="product_control" className="main">
      <section className="left_side">
        <div className="head">
          <div id="prod_control_select_boxes">
            <div>
              <label htmlFor="prod_control_cat_select">Category :</label>
              <select
                id="prod_control_cat_select"
                className="prod_control_select"
                onChange={handleSort}
                value={sortParams.curCat}
              >
                <option value="All">All</option>
                {Array.from(categories.keys()).map((key, i) => (
                  <option key={i} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {sortParams.curCat !== 'All' && (
              <div>
                <label htmlFor="prod_control_subcat_select">
                  Sub-category :
                </label>
                <select
                  id="prod_control_subcat_select"
                  className="prod_control_select"
                  onChange={handleSort}
                  value={sortParams.curSubCat}
                >
                  <option value="All">All</option>
                  {categories.get(sortParams.curCat).map((subCat, i) => (
                    <option key={i} value={subCat.subCatName}>
                      {subCat.subCatName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="prod_control_option_select"> Option :</label>
              <select
                id="prod_control_option_select"
                className="prod_control_select"
                onChange={handleSort}
                value={sortParams.curOption}
              >
                <option value="All">All</option>
                <option value="In stock">In stock</option>
                <option value="Out of stock">Out of stock</option>
              </select>
            </div>

            <div>
              <label htmlFor="prod_control_sort_select"> Sort by :</label>
              <select
                id="prod_control_sort_select"
                className="prod_control_select"
                onChange={handleSort}
                value={sortParams.sortBy}
              >
                <option value="Name">Name</option>
                <option value="Date">Date</option>
                <option value="Stock">Stock</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          <button className="btn_create_prod" onClick={createProduct}>
            <img src="/plus.png" alt="Plus icon" />
            Create product
          </button>
          <span style={{ fontWeight: '600' }}>
            | {sortedProducts.length} items
          </span>
        </div>

        <div className="product_prev_desc">
          <span></span>
          <span>Name</span>
          <span>Price</span>
          <span>Sales</span>
          <span>Stock</span>
          <span>Date created</span>
        </div>

        <ul className="container">
          {sortedProducts.length ? (
            sortedProducts.map((prod, i) => (
              <ProductPrev
                key={i}
                data={prod}
                editOb={{ prodEdit, setProdEdit }}
                index={i + 1}
                setOverlay={setOverlay}
              />
            ))
          ) : (
            <p
              style={{
                textAlign: 'center',
                marginTop: '20px',
                fontWeight: '600',
                color: '#3e035d89',
              }}
            >
              No products found :)
            </p>
          )}
        </ul>
      </section>
      <section className="control_side_display">
        <div id="prod_side_box">
          {prodEdit.newProducts.length || prodEdit.curProdEdit ? (
            <>
              {prodEdit.newProducts.length ? (
                <>
                  {prodEdit.newProducts.map((p, i) => (
                    <ProductEdit
                      key={i}
                      editOb={{
                        prodEdit,
                        setProdEdit,
                        data: p,
                        index: i,
                      }}
                      setOverlay={setOverlay}
                    />
                  ))}
                  <button
                    className="btn_create_prod"
                    id="btn_plus_prod"
                    onClick={createProduct}
                  >
                    <img src="/plus.png" alt="Plus icon" />
                  </button>
                </>
              ) : (
                <ProductEdit
                  editOb={{
                    prodEdit,
                    setProdEdit,
                    data: prodEdit.curProdEdit,
                    index: 0,
                  }}
                  setOverlay={props.setOverlay}
                />
              )}

              <button
                onClick={handleUpdates}
                id="prod_side_update_btn"
                disabled={!canUpdate}
              >
                {prodEdit.curProdEdit ? 'Update' : 'Upload'}
              </button>
            </>
          ) : (
            <p className="default_message">
              <span> Select a product </span>
              or
              <button className="btn_create_prod" onClick={createProduct}>
                <img src="/plus.png" alt="Plus icon" />
                Create product
              </button>
            </p>
          )}
        </div>
      </section>
      {}
    </section>
  );
}

function ProductEdit({ editOb, setOverlay }) {
  const { data } = editOb;
  const isProductExist = Boolean(editOb.prodEdit.curProdEdit);
  const fileInput = useRef(null);

  const deleteProduct = (e) => {
    editOb.setProdEdit((prevState) => {
      const updatedProducts = [...prevState.newProducts];
      !isProductExist && updatedProducts.splice(editOb.index, 1);
      return {
        curProdEdit: null,
        newProducts: updatedProducts,
      };
    });
  };

  const handleUpdates = (updatedData) => {
    Object.setPrototypeOf(updatedData, ProductClass.prototype);

    editOb.setProdEdit((prevState) => {
      return {
        curProdEdit: isProductExist ? updatedData : null,
        newProducts: isProductExist
          ? []
          : prevState.newProducts.map((p, i) =>
              i === editOb.index ? updatedData : p,
            ),
      };
    });
  };

  const handleEditData = (e) => {
    const target = e.target;
    const targetName = target.getAttribute('name');
    const value = target.value ?? '';
    let updatedData = { ...data };

    switch (targetName) {
      case 'category':
        updatedData.category = value;
        updatedData.subcategory = '';
        break;
      case 'subcategory':
        updatedData.subcategory = value;
        break;
      case 'name':
        updatedData.name = value;
        break;
      case 'price':
        if (/^\d+(\.(\d+)?)?$/.test(value)) {
          updatedData.price = value.endsWith('.') ? value : +value;
        } else {
          const lastValue = value.slice(0, value.length - 1);
          updatedData.price = value ? (lastValue ? +lastValue : '') : '';
        }
        break;
      case 'instock':
        if (/^(?!0)[0-9]+$/.test(value)) {
          updatedData.instock = +value;
        } else {
          const lastValue = value.slice(0, value.length - 1);
          updatedData.instock = value ? (lastValue ? +lastValue : '') : '';
        }
        break;
      case 'btn_add_desc':
        updatedData.description.push({
          property: '',
          value: '',
        });
        break;
      case 'description':
        const index = e.target.dataset.index;
        const type = e.target.dataset.type;
        updatedData.description[index][type] = value;
        break;
      case 'btn_delete_desc':
        const delIndex = e.target.dataset.index;
        updatedData.description.splice(delIndex, 1);
        break;
      case 'prod_img_edit':
        fileInput.current.click();
        break;
      default:
        break;
    }

    if (!updatedData.subcategory && !isProductExist) {
      const { category } = updatedData;
      updatedData = new ProductClass();
      updatedData.category = category;
    }

    handleUpdates(updatedData);
  };

  const processImages = (e) => {
    const updatedData = { ...data };
    const nameAttr = e.target.getAttribute('name');
    if (nameAttr === 'file') {
      const imgFiles = e.target.files;
      if (!imgFiles || !imgFiles.length) return;

      setOverlay(
        <ImagesProcessor
          files={imgFiles}
          limit={import.meta.env.VITE_MAX_PRODUCT_IMG - data.imgurls.length}
          setOverlay={setOverlay}
          inputTarget={fileInput.current}
          task={(imgAssets) => {
            updatedData.imgurls = [...data.imgurls, ...imgAssets];
            if (!updatedData.imgurls.some((url) => url.isDefault))
              updatedData.imgurls[0].isDefault = true;
            handleUpdates(updatedData);
            setOverlay(null);
          }}
        />,
      );
    } else {
      const index = +e.target.dataset.index;
      if (nameAttr === 'default_img') {
        updatedData.imgurls.forEach((urls, i) => {
          urls.isDefault = index === i ? true : false;
        });
      } else if (nameAttr === 'delete_img') {
        const [deletedUrl] = updatedData.imgurls.splice(index, 1);
        if (deletedUrl.isDefault) {
          if (updatedData.imgurls.length)
            updatedData.imgurls[0].isDefault = true;
        }
      }
      handleUpdates(updatedData);
    }
  };

  return (
    <div className="product_edit">
      <div className="prod_edit_bar">
        <span>
          {editOb.prodEdit.curProdEdit
            ? `${editOb.prodEdit.curProdEdit.name} / ${data.sales} sales`
            : `New Product ${
                editOb.index + 1 + '/' + editOb.prodEdit.newProducts.length
              }`}
        </span>
        <span className="close" onClick={deleteProduct}>
          <img
            src={`/${editOb.prodEdit.curProdEdit ? 'close' : 'delete'}.png`}
            alt="Close icon"
          />
        </span>
      </div>

      <div className="prod_edit_body">
        <span>
          <label htmlFor={`cat_select_edit_${editOb.index}`}>Category : </label>
          <select
            className="cat_select_edit"
            name="category"
            id={`cat_select_edit_${editOb.index}`}
            value={data.category}
            onChange={handleEditData}
            disabled={Boolean(editOb.prodEdit.curProdEdit?.sales)}
          >
            <option value="">--</option>
            {Array.from(categories.keys()).map((key, i) => (
              <option key={i} value={key}>
                {key}
              </option>
            ))}
          </select>
        </span>
        {data.category && (
          <span>
            <label htmlFor={`subcat_select_edit_${editOb.index}`}>
              Sub-category :{' '}
            </label>
            <select
              className="subcat_select_edit"
              name="subcategory"
              id={`subcat_select_edit_${editOb.index}`}
              value={data.subcategory}
              onChange={handleEditData}
              disabled={Boolean(editOb.prodEdit.curProdEdit?.sales)}
            >
              <option value="">--</option>
              {categories.get(data.category).map((subCat, i) => (
                <option key={i} value={subCat.subCatName}>
                  {subCat.subCatName}
                </option>
              ))}
            </select>
          </span>
        )}

        {(data.subcategory || isProductExist) && (
          <>
            <span>
              <label htmlFor={`prod_name_edit_${editOb.index}`}>Name : </label>
              <input
                type="text"
                className="prod_name_edit"
                name="name"
                id={`prod_name_edit_${editOb.index}`}
                value={data.name}
                disabled={Boolean(editOb.prodEdit.curProdEdit?.sales)}
                onChange={handleEditData}
              />
            </span>
            <span>
              <label htmlFor={`prod_price_edit_${editOb.index}`}>
                Price :{' '}
              </label>
              <input
                type="text"
                className="prod_price_edit"
                name="price"
                id={`prod_price_edit_${editOb.index}`}
                value={data.price}
                onChange={handleEditData}
              />
            </span>
            <span>
              <label htmlFor={`prod_stock_edit_${editOb.index}`}>
                In stock :{' '}
              </label>
              <input
                type="text"
                className="prod_stock_edit"
                name="instock"
                id={`prod_stock_edit_${editOb.index}`}
                value={data.instock}
                onChange={handleEditData}
              />
            </span>
            <div className="prod_desc_edit">
              <label htmlFor={`textDesc_${editOb.index}`}>Description : </label>
              <textarea
                data-index={0}
                data-type="value"
                id={`textDesc_${editOb.index}`}
                className="desc_edit"
                name="description"
                placeholder={`Type text here (${data.description.length !== 1 ? 'optional' : 'mandatory if no parameter is specified'})`}
                value={data.description[0].value}
                disabled={Boolean(editOb.prodEdit.curProdEdit?.sales)}
                onChange={handleEditData}
              />

              {data.description.map((d, i) => {
                const isDisabled = Boolean(
                  data.sales &&
                  data.lastStateMemoizer.get('description')[i] === d,
                );
                return i !== 0 ? (
                  <div
                    key={i}
                    className="param"
                    id={`param${i}_${editOb.index}`}
                  >
                    <input
                      data-index={i}
                      data-type="property"
                      id={`property_param${i}_${editOb.index}`}
                      className="desc_edit"
                      name="description"
                      placeholder="Property"
                      type="text"
                      value={d.property}
                      disabled={isDisabled}
                      onInput={handleEditData}
                    />
                    <span>:</span>
                    <input
                      data-index={i}
                      data-type="value"
                      id={`value_param${i}_${editOb.index}`}
                      className="desc_edit"
                      name="description"
                      placeholder="Value"
                      type="text"
                      value={d.value}
                      disabled={isDisabled}
                      onInput={handleEditData}
                    />
                    <span
                      data-index={i}
                      className="btn_delete_desc"
                      name="btn_delete_desc"
                      onClick={handleEditData}
                    >
                      <img
                        data-index={i}
                        name="btn_delete_desc"
                        src="/delete.png"
                        alt="Delete icon"
                      />
                    </span>
                  </div>
                ) : null;
              })}
              <span
                className="btn_add_desc"
                name="btn_add_desc"
                onClick={handleEditData}
              >
                Add a parameter
              </span>
            </div>
            <div>
              <label htmlFor={`prod_img_edit_${editOb.index}`}>
                Images (at least {import.meta.env.VITE_MIN_PRODUCT_IMG} & at
                most {import.meta.env.VITE_MAX_PRODUCT_IMG}):
              </label>
              <div
                className="prod_img_edit"
                id={`prod_img_edit_${editOb.index}`}
              >
                {data.imgurls.map((asset, i) => (
                  <div
                    key={i}
                    className={`prod_img_edit_item ${asset.isDefault ? 'default' : ''}`}
                  >
                    <img
                      src={
                        asset.isUploaded
                          ? asset.thumbnailUrlWEBP
                          : asset.objectURL
                      }
                      className={`${asset.isUploaded ? 'saved' : 'unsaved'}`}
                      alt="Image Preview"
                    />
                    <ul>
                      <li>
                        <button
                          data-index={i}
                          name="default_img"
                          className="btn_default"
                          onClick={processImages}
                          disabled={Boolean(data.sales)}
                        >
                          Set as default
                        </button>
                      </li>
                      <li>
                        <button
                          data-index={i}
                          name="delete_img"
                          className="btn_delete"
                          disabled={Boolean(
                            data.sales && data.imgurls[i].isUploaded,
                          )}
                          onClick={processImages}
                        >
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                ))}
                {data.imgurls.length < import.meta.env.VITE_MAX_PRODUCT_IMG && (
                  <img
                    className="upload_img_thumb"
                    src={`/upload-img.png`}
                    name="prod_img_edit"
                    alt={`Upload thumb${editOb.index}`}
                    onClick={handleEditData}
                  />
                )}
                <input
                  ref={fileInput}
                  type="file"
                  name="file"
                  accept=".jpg, .jpeg, .png, .svg, .webp, .avif, .gif, .bmp"
                  multiple
                  onChange={processImages}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <span
        className={`edit_confirm ${data.isReadyForUpdates() && 'confirmed'}`}
      >
        {data.isReadyForUpdates() ? 'Confirmed' : 'Unconfirmed'}
      </span>
    </div>
  );
}

function ProductPrev({ data, editOb, index, setOverlay }) {
  const {
    prodEdit: { curProdEdit, newProducts },
    setProdEdit,
  } = editOb;
  const handleEdit = (e) => {
    if (
      (curProdEdit &&
        curProdEdit._id !== data._id &&
        curProdEdit.hasStateChanged()) ||
      newProducts.length
    ) {
      setOverlay(
        <Warnning
          prodEdit={editOb.prodEdit}
          task={() => {
            setProdEdit({ curProdEdit: data, newProducts: [] });
          }}
          setOverlay={setOverlay}
        />,
      );
    } else {
      if (curProdEdit && curProdEdit._id === data._id) return;
      setProdEdit({ curProdEdit: data, newProducts: [] });
    }
  };

  // useEffect(() => {
  //   console.log(editOb.prodEdit.curProdEdit?.hasStateChanged());
  // }, [editOb.prodEdit]);

  return (
    <div
      aria-selected={data._id === curProdEdit?._id ? true : false}
      className="product_prev"
      onClick={handleEdit}
    >
      <span className="index">{index}</span>
      <span> {data.name}</span>
      <span>{data.price}</span>
      <span className="prod_id">{data.sales}</span>
      <span style={{ color: 'green' }}>{data.instock}</span>
      <span>
        {formatDate(data.createdAt, new Date().toISOString(), false, true)}
      </span>
    </div>
  );
}

function Warnning({ setOverlay, prodEdit, task }) {
  const { curProdEdit, newProducts } = prodEdit;
  return (
    <div
      style={{
        padding: '15px',
        background: 'white',
        borderRadius: '10px',
      }}
    >
      <p
        style={{
          textAlign: 'center',
          fontSize: '1.3rem',
          color: 'purple',
          marginBottom: '20px',
        }}
      >
        {curProdEdit
          ? `Are you sure you want to cancel changes applied to ${curProdEdit.name}?`
          : `You have ${newProducts.length} unregistered product${newProducts.length > 1 ? 's' : ''}! Are you sure you want to cancel?`}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        <button
          style={{
            border: '2px solid purple',
            fontWeight: 600,
            background: 'transparent',
            borderRadius: '3px',
            padding: '5px 8px',
            color: 'purple',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            setOverlay(null);
          }}
        >
          No
        </button>
        <button
          style={{
            border: '2px solid purple',
            fontWeight: 600,
            background: 'transparent',
            borderRadius: '3px',
            padding: '5px 8px',
            color: 'purple',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            task();
            setOverlay(null);
          }}
        >
          Yes
        </button>
      </div>
    </div>
  );
}
