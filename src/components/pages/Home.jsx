import { Link } from 'react-router-dom';
import { advantagesInfos, categories } from '../../data';
import { useRef, useEffect } from 'react';

export const sectionRef = {
  section1: null,
  section2: null,
};

export default function Home({ updatesOb }) {
  sectionRef.section1 = useRef(null);
  sectionRef.section2 = useRef(null);
  return (
    <section className="home_page">
      <header>
        <picture>
          <source media="(width <= 480px)" srcSet="/head.bg.480w.jpg" />
          <source media="(width <= 980px)" srcSet="/head.bg.980w.jpg" />
          <img src="/head.bg.1920w.jpg" alt="Shopping bags" />
        </picture>

        <div className="head_side">
          <div>
            <h1>Just order, we'll take care of everything</h1>
            <p>Our priority is customer satisfaction</p>
          </div>
          {/* <h2>-10% on your first order</h2> */}
          <Link to="/shop" className="btn_shop">
            shop now
          </Link>
        </div>
      </header>

      <section ref={sectionRef.section1} id="section--1">
        <h2>Explore a wide variety of our products by categories</h2>
        <div id="categories_preview">
          {Array.from(categories.entries()).map((cat, i) => (
            <Category
              key={i}
              data={{
                category: cat[0],
                subCat: cat[1],
              }}
            />
          ))}
        </div>
      </section>

      <section ref={sectionRef.section2} id="section--2">
        <h2>Wy buy from us ?</h2>
        <div className="advantages">
          {advantagesInfos.map((ad) => (
            <Advantage infos={ad} />
          ))}
        </div>
      </section>
    </section>
  );
}

function Advantage({ infos }) {
  return (
    <div className="advantage_desc">
      <h3>{infos.title}</h3>
      <img src={infos.imgUrl} alt="Illustrative icon" />
      <p>{infos.text}</p>
    </div>
  );
}

function Category({ data }) {
  return (
    <div className="category_prev">
      <h3>{data.category} collection</h3>

      <div className="sub_cat">
        {data.subCat.map((sub, i) => (
          <div
            className="sub_cat_panel"
            // style={{
            //   gridColumn: `span ${
            //     i + 1 === data.subCat.length && (i + 1) % 2 !== 0 ? 2 : 1
            //   }`,
            // }}
          >
            <span className="label">
              <Link to={`/shop/${data.category.replaceAll(' ', '-')}`}>
                {sub.subCatName}
              </Link>
            </span>

            <Link to={`/shop/${data.category.replaceAll(' ', '-')}`}>
              <img src={sub.img} alt={`${sub.subCatName} sub-category image`} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
