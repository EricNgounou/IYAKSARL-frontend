import { Product } from '../bluePrints';
export const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function isInputValid(type, input, inpErrors) {
  if (type === 'name') {
    if (input) {
      if (input.length < 3 || input.length > 20) {
        inpErrors.nameErr =
          'Username must be between 3 and 16 characters long.';
        return false;
      }

      const pattern = /^[a-zA-Z0-9._]+$/;
      if (!pattern.test(input)) {
        inpErrors.nameErr =
          'Username can only contain letters, numbers, dots, and underscores.';
        return false;
      }

      if (input.startsWith('.') || input.startsWith('_')) {
        inpErrors.nameErr = 'Username cannot start with a dot or underscore.';
        return false;
      }
      if (input.endsWith('.') || input.endsWith('_')) {
        inpErrors.nameErr = 'Username cannot end with a dot or underscore.';
        return false;
      }
    }
    inpErrors.nameErr = null;
  }

  if (type === 'email') {
    if (!input.match(/^[A-Za-z\._\-0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)) {
      inpErrors.emailErr = 'Please enter a valid email.';
      if (input) return false;
    }

    inpErrors.emailErr = null;
  }

  if (type === 'password') {
    if (input.length < 8) {
      inpErrors.passwordErr =
        'The password must be at least 8 characters long.';
      if (input) return false;
    }
    inpErrors.passwordErr = null;
  }

  return true;
}

export function formatDate(
  date1,
  date2,
  fullDate = false,
  prodControlPrev = false,
) {
  function initialiseDate(str, init = true) {
    return new Date(
      init ? str.slice(0, str.indexOf('T')).replaceAll('-', ', ') : str,
    ).getTime();
  }

  const daysPassed =
    Math.abs(initialiseDate(date1) - initialiseDate(date2)) /
    (1000 * 60 * 60 * 24);

  const curDate = new Date(
    Math.min(initialiseDate(date1, false), initialiseDate(date2, false)),
  );

  let label;

  if (!fullDate) {
    if (daysPassed === 0) label = 'Today';

    if (daysPassed === 1) label = 'Yesterday';

    if (daysPassed >= 2 && daysPassed <= 6)
      label = days[curDate.getDay() === 0 ? 6 : curDate.getDay() - 1];
  }

  if (daysPassed > 6 || fullDate) {
    const date = `${curDate.getDate()}`.padStart(2, 0),
      month = curDate.getMonth(),
      year = curDate.getFullYear();
    label = !prodControlPrev
      ? `${months[+month]} ${date}, ${year}`
      : `${date}/${`${month + 1}`.padStart(2, 0)}/${year}`;
  }
  return label;
}

export function formatTime(dateStr, fullTime = false) {
  const date = new Date(dateStr);
  let time;
  const hours = `${date.getHours()}`.padStart(2, 0),
    minutes = `${date.getMinutes()}`.padStart(2, 0),
    seconds = `${date.getSeconds()}`.padStart(2, 0);

  if (fullTime) time = `${hours}h${minutes}min${seconds}s`;
  else time = `${hours}h${minutes}min`;
  return time;
}

export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

export async function fetchUser(setCurrentUser, setHasFetchingUserFailed) {
  try {
    const url = `${import.meta.env.VITE_API_URL}/users/current`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }
    setCurrentUser(resData);
    setHasFetchingUserFailed(false);
  } catch (err) {
    console.error(err);
    setHasFetchingUserFailed(true);
  }
}

export async function fetchProducts(setAllProducts) {
  try {
    const url = `${import.meta.env.VITE_API_URL}/products`;
    const res = await fetch(url);
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }
    resData.forEach((p) => {
      p.lastStateMemoizer = new Map();
      Object.setPrototypeOf(p, Product.prototype);
      p.initializeLastState();
    });
    setAllProducts(resData);
  } catch (err) {
    console.error(err);
    // throw err;
  }
}
export async function fetchOrders(setAllOrders) {
  try {
    const url = `${import.meta.env.VITE_API_URL}/orders`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }
    setAllOrders(resData);
  } catch (err) {
    console.error(err);
  }
}

export async function fetchAllUsers(setAllUsers) {
  try {
    const url = `${import.meta.env.VITE_API_URL}/admin/all-users`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }
    setAllUsers(resData);
  } catch (err) {
    console.error(err);
  }
}

export const logoutUser = async (setCurrentUser) => {
  try {
    const url = `${import.meta.env.VITE_API_URL}/users/logout`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Unable to logout.');
    }
    setCurrentUser(null);
  } catch (err) {
    console.error(err);
  }
};

const formatTel = (e) => {
  {
    /* <div className="phone_field">
          <input
            ref={phoneInpRef}
            id="phone"
            type="tel"
            name="phone"
            placeholder="phone"
            pattern="[0-9]{3} [0-9]{2} [0-9]{2} [0-9]{2}"
            onChange={formatTel}
            required
          />
        </div> */
  }

  let value = e.target.value;
  const length = value.length;
  const curVal = +value.slice(length - 1);
  const wrongFirstVal = length === 1 && !value.startsWith('6');
  const correctSecondVal =
    curVal === 5 || curVal === 7 || curVal === 8 || curVal === 9;

  if (wrongFirstVal) {
    e.target.value = '';
  }

  if (isNaN(curVal) || (length === 2 && !correctSecondVal)) {
    e.target.value = value.slice(0, length - 1);
  }

  switch (length) {
    case 9:
      const telformat = value
        .split('')
        .map((n, i) =>
          i % 2 === 0 && i !== length - 1 && i !== 0 ? n + ' ' : n,
        )
        .join('');
      e.target.value = telformat;
      break;
    case 11:
      const formatUnset = value
        .split('')
        .map((n) => (n === ' ' ? '' : n))
        .join('');
      e.target.value = formatUnset;
      break;
    case 13:
      e.target.value = value.slice(0, length - 1);
      break;
    default:
      return;
  }
};
