import { generateId } from './components/helpers';

export class Cart {
  constructor() {
    this.order = {
      user_id: null,
      total_items: 0,
      total_items_amount: 0,
      total_amount: 0,
      delivery_infos: null, // Object
      customer_status: null, // Registered or Visitor
    };
    this.items = [];
  }

  resetCart() {
    this.order = {
      user_id: null,
      total_items: 0,
      total_items_amount: 0,
      total_amount: 0,
      delivery_infos: null, // Object
      customer_status: null, // Registered or Visitor
    };
    this.items = [];
  }
}

export class Product {
  lastStateMemoizer = new Map();
  constructor() {
    this.name = '';
    this.price = '';
    this.category = '';
    this.subcategory = '';
    this.imgurls = [];
    this.instock = '';
    this.description = [{ property: 'default', value: '' }];
    this.initializeLastState();
  }

  isReadyForUpdates() {
    // Checkink for valid description
    let isValidDescription = false;
    if (this.description.length === 1 && this.description[0].value) {
      isValidDescription = true;
    } else if (this.description.length > 1) {
      for (const desc of this.description) {
        if (desc.property === 'default') continue;
        if (!desc.property || !desc.value) {
          isValidDescription = false;
          break;
        } else {
          isValidDescription = true;
        }
      }
    }

    // Checkink name, price, category, subCategory, imgURLs, instock and description for any missing or invalid value
    if (
      !this.name ||
      this.name.length < 3 ||
      !this.price ||
      typeof this.price !== 'number' ||
      !this.category ||
      !this.subcategory ||
      this.imgurls.length === 0 ||
      !this.instock ||
      typeof this.instock !== 'number' ||
      !isValidDescription
    )
      return false;

    return true;
  }

  hasStateChanged() {
    return (
      this.name !== this.lastStateMemoizer.get('name') ||
      this.price !== this.lastStateMemoizer.get('price') ||
      this.category !== this.lastStateMemoizer.get('category') ||
      this.subcategory !== this.lastStateMemoizer.get('subcategory') ||
      this.imgurls.length !== this.lastStateMemoizer.get('imgurls').length ||
      this.imgurls.some(
        (url, i) =>
          url.isUploaded !==
            this.lastStateMemoizer.get('imgurls')[i]?.isUploaded ||
          url.isDefault !== this.lastStateMemoizer.get('imgurls')[i]?.isDefault,
      ) ||
      this.instock !== this.lastStateMemoizer.get('instock') ||
      this.description.length !==
        this.lastStateMemoizer.get('description').length ||
      this.description.some(
        (desc, i) =>
          desc.property !==
            this.lastStateMemoizer.get('description')[i].property ||
          desc.value !== this.lastStateMemoizer.get('description')[i].value,
      )
    );
  }

  initializeLastState() {
    this.lastStateMemoizer.set('name', this.name);
    this.lastStateMemoizer.set('price', this.price);
    this.lastStateMemoizer.set('category', this.category);
    this.lastStateMemoizer.set('subcategory', this.subcategory);
    this.lastStateMemoizer.set(
      'imgurls',
      this.imgurls.map((url) => ({ ...url })),
    );
    this.lastStateMemoizer.set('instock', this.instock);
    this.lastStateMemoizer.set(
      'description',
      this.description.map((desc) => ({ ...desc })),
    );
  }

  getChanges() {
    const trackedProps = [
      'name',
      'price',
      'category',
      'instock',
      'subcategory',
      'description',
      'imgurls',
    ];
    const changes = {};
    Object.keys(this).forEach((prop) => {
      if (!trackedProps.includes(prop)) return;
      let isChangesDetected = false;
      if (prop === 'description') {
        const lastState = this.lastStateMemoizer.get(prop);
        if (
          this.description.length !== lastState.length ||
          this.description.some(
            (desc, i) =>
              desc.property !== lastState[i].property ||
              desc.value !== lastState[i].value,
          )
        ) {
          isChangesDetected = true;
        }
      } else if (prop === 'imgurls') {
        const lastState = this.lastStateMemoizer.get(prop);
        if (
          this.imgurls.length !== lastState.length ||
          this.imgurls.some(
            (url, i) =>
              url.isUploaded !== lastState[i]?.isUploaded ||
              url.isDefault !== lastState[i]?.isDefault,
          )
        ) {
          isChangesDetected = true;
        }
      } else {
        if (this[prop] !== this.lastStateMemoizer.get(prop)) {
          isChangesDetected = true;
        }
      }
      if (isChangesDetected) changes[prop] = this[prop];
    });

    return changes;
  }
}
