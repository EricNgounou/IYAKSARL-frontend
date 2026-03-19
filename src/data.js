import { generateId } from './components/helpers';
import { Cart, Product } from './bluePrints';
//// LOCAL STORAGE  ///////////////
const cart = new Cart();

const categories = new Map([
  [
    'Clothes',

    [
      { subCatName: `Men's`, img: './images/men_clothes.jpg' },
      { subCatName: `Women's`, img: './images/women_clothes.jpg' },
      { subCatName: `Men's / Women's`, img: './images/women_clothes.jpg' },
    ],
  ],
  [
    'Shoes',
    [
      { subCatName: `Men's`, img: './images/men_shoe.jpg' },
      { subCatName: `Women's`, img: './images/women_shoe.jpg' },
      { subCatName: `Men's / Women's`, img: './images/women_shoe.jpg' },
    ],
  ],
  [
    'Watchs',
    [
      { subCatName: `Men's`, img: './images/men_watch.jpg' },
      { subCatName: `Women's`, img: './images/women_watch.jpg' },
      { subCatName: `Men's / Women's`, img: './images/women_watch.jpg' },
    ],
  ],
  [
    'Jewelries',
    [
      { subCatName: `Men's`, img: './images/men_jew.jpg' },
      { subCatName: `Women's`, img: './images/women_jew.jpg' },
      { subCatName: `Men's / Women's`, img: './images/women_jew.jpg' },
    ],
  ],
  [
    'Decor kits',
    [
      { subCatName: 'Light strip', img: './images/room_light.jpg' },
      { subCatName: 'Bright form', img: './images/lightening_butterflies.jpg' },
    ],
  ],
  [
    'Multimedia kits',
    [
      { subCatName: 'Airpods', img: './images/airpods.jpg' },
      { subCatName: 'Headphone', img: './images/headphone.jpg' },
      { subCatName: 'Powerbank', img: './images/powerbank.jpg' },
      { subCatName: 'Phone charger', img: './images/phone_charger.jpg' },
    ],
  ],
]);

export const advantagesInfos = [
  {
    title: 'Free delivery',
    imgUrl: 'free-truck.png',
    text: 'Free delivery every Saturday and from a cerain amount, we offer free delivery.',
  },
  {
    title: 'Welcome discount',
    imgUrl: '10%-off.png',
    text: '10% off on your first order.',
  },
  {
    title: 'Loyality program',
    imgUrl: 'loyalty.png',
    text: 'Point can be accumulated with each purchase. From a certain number of points, you either get a gift or a discount.',
  },
  {
    title: 'Limited offer / Flash sales',
    imgUrl: 'flash-sales.png',
    text: 'We can reduce the price of certain items by up to 20% for a limited period.',
  },
  {
    title: 'Sponsorship discount',
    imgUrl: 'sponsor.png',
    text: 'Refer your friends and get your bonuses.',
  },
];
//// LOCAL STORAGE ///////////////

//--------------------------------//

export { cart, categories };

//// DATA BASE ///////////////
