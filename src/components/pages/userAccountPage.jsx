import { data, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  EmailVerificationBox,
  Overlay,
  Spinner,
  InputError,
  OverlayMessage,
} from '../Dynamic';
import { useState, useEffect, useRef } from 'react';
import {
  fetchUser,
  formatDate,
  formatTime,
  isInputValid,
  logoutUser,
} from '../helpers';

export default function AccountPage({ userOb }) {
  const navigate = useNavigate();
  const {
    currentUser: { userInfo: user },
  } = userOb;

  const dateLabMemo = new Map();
  const { pathname } = useLocation();
  const [inputErrors, setInputErrors] = useState({
    passwordErr: null,
    nameErr: null,
    emailErr: null,
  });

  const [editInputs, setEditInputs] = useState({
    name: user.username,
    email: user.email,
    oldPassword: '',
    newPassword: '',
  });

  const labels = {
    nameLabelRef: useRef(null),
    emailLabelRef: useRef(null),
    oldPasswordLabelRef: useRef(null),
    newPasswordLabelRef: useRef(null),
  };

  const [error, setError] = useState('');
  const [overlayContent, setOverlayContent] = useState('');
  const [openEdit, setOpenEdit] = useState({ main: false, passEdit: false });
  const [showPassword, setShowPassword] = useState({ old: false, new: false });
  const [userOrders, setUserOrders] = useState(null);
  const [ordersSotedBy, setOrdersSotedBy] = useState(null);

  const [digitInput, setDigitInput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (value, field, label, inpErrors = { ...inputErrors }) => {
    setError(null);
    const trimmedVal = value.trim();
    const upEditInputs = { ...editInputs };
    const type = field.includes('password') ? 'password' : field;
    if (field === 'name') {
      upEditInputs.name = trimmedVal;
    } else if (field === 'email') {
      upEditInputs.email = trimmedVal.toLowerCase();
    } else if (field === 'old password') {
      upEditInputs.oldPassword = trimmedVal;
    } else if (field === 'new password') {
      upEditInputs.newPassword = trimmedVal;
    }

    label.style.top = !trimmedVal ? '50%' : '-2px';

    isInputValid(type, trimmedVal, inpErrors);
    setEditInputs(upEditInputs);
    setInputErrors(inpErrors);
  };

  const sendUpdates = async (data) => {
    const url = `${import.meta.env.VITE_API_URL}/users/update`;
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }
  };

  const finalizeUpdates = (updates) => {
    setIsLoading(false);
    setOverlayContent(
      <UpdateInfosBox
        data={updates}
        task={async (password) => {
          try {
            setIsLoading(true);
            setOverlayContent(<Spinner />);
            const data = { updatedData: updates, password };
            await sendUpdates(data);
            await fetchUser(
              userOb.setCurrentUser,
              userOb.setHasFetchingUserFailed,
            );
            setIsLoading(false);
            setOverlayContent(
              <OverlayMessage message="Updates applied successfuly." />,
            );
            setTimeout(() => {
              setOpenEdit({ main: false, passEdit: false });
              setOverlayContent('');
            }, 3000);
          } catch (err) {
            setError(err.message);
            setIsLoading(false);
            setOverlayContent('');
          }
        }}
        setError={setError}
        setOverlayContent={setOverlayContent}
        setOpenEdit={setOpenEdit}
      />,
    );
  };

  const validateUpdates = async (data) => {
    const url = `${import.meta.env.VITE_API_URL}/users/validate-updates`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }

    return resData;
  };

  const sendOtp = async (data, task) => {
    const url = `${import.meta.env.VITE_API_URL}/otp/send-otp`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }

    setIsLoading(false);
    setOverlayContent(
      <div className="popup_box">
        <EmailVerificationBox
          message={`Enter the verification code sent to ${data.email} to approve email switching.`}
          task={task}
          setDigitInput={setDigitInput}
          setOverlayContent={setOverlayContent}
        />
      </div>,
    );
  };

  const verifyOtp = async (data) => {
    const url = `${import.meta.env.VITE_API_URL}/otp/verify-otp`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message);
    }
  };

  const emailAuthHandler = async (updates) => {
    const emails = updates['email'];
    const otp_message1 = `We are about to use ${emails.next} to replace ${emails.current} as new email account in our system.`;
    const data1 = {
      email: emails.next,
      process: 'auth_new',
      otp_message: otp_message1,
    };
    const task1 = async (
      digitCode,
      setError,
      clearInputs,
      setIsLoading,
      timer,
    ) => {
      try {
        setIsLoading(true);
        await verifyOtp({
          email: emails.next,
          otp: digitCode,
          process: 'auth_new',
        });
        clearInterval(timer);
        const otp_message2 = `The email ${emails.current} will no longer be use as email account in our system. The email ${emails.next} will be the new email account.`;
        const data2 = {
          email: emails.current,
          process: 'auth_current',
          otp_message: otp_message2,
        };
        await sendOtp(data2, task2);
        setIsLoading(false);
        clearInputs();
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
        clearInputs();
      }
    };

    const task2 = async (
      digitCode,
      setError,
      clearInputs,
      setIsLoading,
      timer,
    ) => {
      try {
        setIsLoading(true);
        await verifyOtp({
          email: emails.current,
          otp: digitCode,
          process: 'auth_current',
        });
        clearInterval(timer);
        finalizeUpdates(updates);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
        clearInputs();
      }
    };

    await sendOtp(data1, task1);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      let updates = new Map();
      const { name, email, oldPassword, newPassword } = editInputs;

      if (!name || !email) {
        throw new Error('Cannot update empty fields.');
      }

      if (name !== user.username) {
        if (!isInputValid('name', name, inputErrors)) {
          throw new Error('Invalid input.');
        }
        updates.set('username', {
          current: user.username,
          next: name,
        });
      }

      if (email !== user.email) {
        if (!isInputValid('email', email, inputErrors)) {
          throw new Error('Invalid input.');
        }
        updates.set('email', { current: user.email, next: email });
      }

      if (openEdit.passEdit && oldPassword && newPassword) {
        if (
          !isInputValid('password', oldPassword, inputErrors) ||
          !isInputValid('password', newPassword, inputErrors)
        ) {
          throw new Error('Invalid input.');
        } else if (oldPassword === newPassword) {
          throw new Error('Old password and New password must be different.');
        }
        updates.set('password', { current: oldPassword, next: newPassword });
      } else if (oldPassword || newPassword) {
        throw new Error(
          `Missing ${oldPassword ? 'new password' : 'old password'} field.`,
        );
      }

      if (updates.size === 0) {
        throw new Error('No updates detected.');
      }

      setIsLoading(true);
      setOverlayContent(<Spinner />);

      const data = Object.fromEntries(updates);
      await validateUpdates(data);

      if (updates.has('email')) {
        await emailAuthHandler(data);
      } else {
        finalizeUpdates(data);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      setOverlayContent('');
    }
  };

  const handleSortOrders = (e) => {
    const value = e.target.value;
    setOrdersSotedBy(value);
  };

  const handleLogout = async (e) => {
    try {
      await logoutUser(userOb.setCurrentUser);
      setOverlayContent('');
      navigate('/');
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    setError('');
    setShowPassword({ old: false, new: false });

    setEditInputs({
      name: openEdit.main ? editInputs.name : user.username,
      email: openEdit.main ? editInputs.email : user.email,
      oldPassword: '',
      newPassword: '',
    });
    setInputErrors({
      passwordErr: null,
      nameErr: null,
      emailErr: null,
    });
  }, [openEdit]);

  useEffect(() => {
    if (error) {
      setEditInputs({
        name: user.username,
        email: user.email,
        oldPassword: '',
        newPassword: '',
      });
    }
  }, [error]);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
    if (userOb.currentUser?.orders.length) {
      setUserOrders(
        userOb.currentUser.orders
          .map((order) => {
            const items = order.items.map((item) => {
              const {
                product_id: productId,
                product_name: name,
                unit_price: price,
                quantity,
                sub_total: subTotal,
                img_url: img,
              } = item;
              return { productId, name, price, img, quantity, subTotal };
            });
            const {
              total_amount: totalAmount,
              total_items_amount: totalItemsAmount,
              delivery_infos: {
                delivery_type: deliveryType,
                delivery_status: status,
                delivery_cost: deliveryCost,
                payment_method: paymentMethod,
              },
              total_items: totalItems,
              createdAt: date,
            } = order;
            return {
              items,
              totalAmount,
              totalItemsAmount,
              status,
              totalItems,
              deliveryType,
              deliveryCost,
              paymentMethod,
              date,
            };
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date)),
      );
      setOrdersSotedBy('date');
    }
  }, []);

  useEffect(() => {
    if (userOrders) {
      dateLabMemo.clear();
      switch (ordersSotedBy) {
        case 'amount':
          setUserOrders(
            [...userOrders].sort((a, b) => b.totalAmount - a.totalAmount),
          );
          break;
        case 'item':
          setUserOrders(
            [...userOrders].sort((a, b) => b.totalItems - a.totalItems),
          );
          break;

        default:
          setUserOrders(
            [...userOrders].sort((a, b) => new Date(b.date) - new Date(a.date)),
          );
          break;
      }
    }
  }, [ordersSotedBy]);

  return (
    <section id="account_page">
      <div id="profile_infos">
        <div id="profile_index">
          <span id="profile">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="User picture" />
            ) : (
              user?.username[0].toUpperCase()
            )}
          </span>
          <div id="user_infos">
            <p id="user_name">{user?.username}</p>
            <p id="user_email">{user?.email}</p>
          </div>
        </div>

        <div id="profile_edit">
          <span
            className="option"
            id="edit_option"
            onClick={(e) => {
              setOpenEdit((prevState) => ({
                main: !prevState.main,
                passEdit: false,
              }));
            }}
          >
            <img src="edit.png" alt="Edit icon" />
            Edit profile
            <span
              className="option_arr"
              style={{
                rotate: openEdit.main ? '270deg' : '90deg',
              }}
            >
              &#8250;
            </span>
          </span>

          {openEdit.main && (
            <form id="update_form" onSubmit={handleUpdate}>
              {error && <p className="error">{error}</p>}
              <span id="picture_edit">
                {user.profile_picture ? (
                  <img src={user?.profile_picture} alt="User picture" />
                ) : (
                  user.username.slice(0, 1).toUpperCase()
                )}
                <span id="pict_overlay">
                  <img src="edit.png" alt="Edit icon" />
                </span>
              </span>

              <div id="name_edit" className="edit_field">
                <div id="name_edit_field">
                  <label ref={labels.nameLabelRef} htmlFor="name_edit_input">
                    Edit name
                  </label>
                  <input
                    id="name_edit_input"
                    name="name"
                    type="text"
                    onInput={(e) => {
                      handleEdit(
                        e.target.value,
                        'name',
                        labels.nameLabelRef.current,
                      );
                    }}
                    value={editInputs.name}
                  />
                </div>
                {inputErrors.nameErr && (
                  <InputError err={inputErrors.nameErr} />
                )}
              </div>

              <div id="email_edit" className="edit_field">
                <div id="email_edit_field">
                  <label ref={labels.emailLabelRef} htmlFor="email_edit_input">
                    Edit email
                  </label>
                  <input
                    id="email_edit_input"
                    name="email"
                    type="email"
                    onInput={(e) => {
                      handleEdit(
                        e.target.value,
                        'email',
                        labels.emailLabelRef.current,
                      );
                    }}
                    value={editInputs.email}
                  />
                </div>
                {inputErrors.emailErr && (
                  <InputError err={inputErrors.emailErr} />
                )}
              </div>

              <div id="password_edit">
                <span
                  className="option"
                  onClick={(e) => {
                    setOpenEdit({
                      main: openEdit.main,
                      passEdit: !openEdit.passEdit,
                    });
                  }}
                >
                  Change password
                  <span
                    className="option_arr"
                    style={{
                      rotate: openEdit.passEdit ? '270deg' : '90deg',
                    }}
                  >
                    &#8250;
                  </span>
                </span>

                {openEdit.passEdit && (
                  <>
                    <div id="old_password" className="edit_field password_edit">
                      <label
                        ref={labels.oldPasswordLabelRef}
                        htmlFor="old_password_input"
                      >
                        Old password
                      </label>
                      <input
                        id="old_password_input"
                        type={showPassword.old ? 'text' : 'password'}
                        value={editInputs.oldPassword}
                        onInput={(e) => {
                          handleEdit(
                            e.target.value,
                            'old password',
                            labels.oldPasswordLabelRef.current,
                          );
                        }}
                      />
                      <span
                        className="password_eye"
                        onClick={(e) => {
                          setShowPassword({
                            old: !showPassword.old,
                            new: showPassword.new,
                          });
                        }}
                      >
                        <img
                          src={`eye_${
                            showPassword.old ? 'opened' : 'closed'
                          }.png`}
                          alt={`Eye  ${showPassword.old ? 'opened' : 'closed'}`}
                        />
                      </span>
                    </div>

                    <div id="new_password" className="edit_field password_edit">
                      <label
                        ref={labels.newPasswordLabelRef}
                        htmlFor="new_password_input"
                      >
                        New password
                      </label>
                      <input
                        id="new_password_input"
                        type={showPassword.new ? 'text' : 'password'}
                        value={editInputs.newPassword}
                        onInput={(e) => {
                          handleEdit(
                            e.target.value,
                            'new password',
                            labels.newPasswordLabelRef.current,
                          );
                        }}
                      />
                      <span
                        className="password_eye"
                        onClick={(e) => {
                          setShowPassword({
                            old: showPassword.old,
                            new: !showPassword.new,
                          });
                        }}
                      >
                        <img
                          src={`eye_${
                            showPassword.new ? 'opened' : 'closed'
                          }.png`}
                          alt={`Eye  ${showPassword.new ? 'opened' : 'closed'}`}
                        />
                      </span>
                    </div>

                    {inputErrors.passwordErr && (
                      <InputError err={inputErrors.passwordErr} />
                    )}
                  </>
                )}
              </div>

              <button type="submit">Update</button>
            </form>
          )}
        </div>
        <span
          className="option"
          id="btn_logout"
          onClick={(e) => {
            setOverlayContent(
              <div className="logout_warning">
                <p>Confirm login out</p>
                <div>
                  <span
                    onClick={(e) => {
                      setOverlayContent('');
                    }}
                  >
                    Cancel
                  </span>
                  <span onClick={handleLogout}>Confirm</span>
                </div>
              </div>,
            );
          }}
        >
          <img src="exit.png" alt="Logout icon" />
          Log out
        </span>
      </div>

      <div id="order_history">
        <div className="head">
          <h2>Order history</h2>
          <div id="sort_orders">
            <label htmlFor="select_type">Sort by : </label>
            <select id="select_type" onChange={handleSortOrders}>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="item">Item</option>
            </select>
          </div>

          <span>
            {userOrders?.length < 10 && userOrders?.length !== 0
              ? `${userOrders?.length}`.padStart(2, 0) + ' '
              : userOrders?.length + ' '}
            Order(s)
          </span>
        </div>
        <div id="orders_container">
          {userOrders?.length ? (
            userOrders.map((order, i) => (
              <Order
                key={i}
                data={order}
                dateLabMemo={dateLabMemo}
                ordersSotedBy={ordersSotedBy}
              />
            ))
          ) : (
            <p className="default_message">Your order history is empty</p>
          )}
        </div>
      </div>
      {overlayContent && (
        <Overlay
          content={overlayContent}
          isloading={isLoading}
          digitInput={digitInput}
        />
      )}
    </section>
  );
}

// Orders component
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
function Order({ data, dateLabMemo, ordersSotedBy }) {
  const orderRef = useRef(null);
  const [labDate, setLabDate] = useState(null);
  const [openOrder, setOpenOrder] = useState(false);
  const now = new Date();

  useEffect(() => {
    const lab = formatDate(data.date, now.toISOString());
    if (!dateLabMemo.has(lab)) {
      setLabDate(lab);
      dateLabMemo.set(lab, lab);
    }
  }, []);

  return (
    <>
      {labDate && ordersSotedBy === 'date' && (
        <p className="lab_date">{labDate}</p>
      )}
      <div ref={orderRef} className="order">
        <div
          className="order_prev"
          onClick={(e) => {
            setOpenOrder(!openOrder);
          }}
        >
          <span className="items_count">{data.totalItems} item(s)</span>
          <span className="items_amount">{data.totalAmount} XAF</span>
          <span className="date">{formatTime(data.date)}</span>
          <span className="status_prev">{data.status}</span>
          <span
            className="down_arr"
            style={{ display: openOrder ? 'none' : 'block' }}
          ></span>
        </div>
        {openOrder && (
          <>
            <div className="order_infos">
              <span>
                <span className="label">Ordered on : </span>
                {formatDate(data.date, now.toISOString(), true)} at{' '}
                {formatTime(data.date, true)}
              </span>
              <span>
                <span className="label">Total items amount : </span>
                {data.totalItemsAmount} XAF
              </span>
              <span>
                <span className="label">Delivery cost : </span>
                {data.deliveryCost} XAF
              </span>
              <span>
                <span className="label">Total amount : </span>
                {data.totalAmount} XAF
              </span>
              <span>
                <span className="label">Payment method : </span>
                {data.paymentMethod}
              </span>
              <span>
                <span className="label">Status : </span> {data.status}
              </span>
              <span>
                <span className="label">Acquiring method : </span>
                {data.deliveryType}
              </span>
            </div>
            {data.items.map((item, i) => {
              const {
                thumbnailUrlAVIF,
                thumbnailUrlWEBP,
                thumbnailUrlJPEG,
                altText,
              } = item.img;
              return (
                <div className="items_infos">
                  <span className="item_index">
                    Product {`${i + 1}/${data.items.length}`}
                  </span>

                  <picture>
                    <source srcSet={thumbnailUrlAVIF} type="image/avif" />
                    <source srcSet={thumbnailUrlWEBP} type="image/webp" />
                    <img src={thumbnailUrlJPEG} loading="lazy" alt={altText} />
                  </picture>
                  <p>
                    <span className="label">Name : </span> {item.name}
                  </p>
                  <p>
                    <span className="label">Unit Price : </span> {item.price}
                    XAF
                  </p>
                  <p>
                    <span className="label">Quantity : </span> {item.quantity}
                  </p>
                  <p>
                    <span className="label">Sub-total : </span> {item.subTotal}
                    XAF
                  </p>
                  <Link to={`/products/${item.productId}`}>View Product</Link>
                </div>
              );
            })}
          </>
        )}

        {openOrder && (
          <span
            className="btn_close"
            onClick={(e) => {
              setOpenOrder(false);
            }}
          >
            Close
          </span>
        )}
      </div>
    </>
  );
}

function UpdateInfosBox({ data, task, setError, setOverlayContent }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const passwordInp = useRef(null);

  useEffect(() => {
    passwordInp.current.focus();
  }, []);

  return (
    <form
      id="confirm_updates_box"
      className="popup_box"
      onSubmit={(e) => {
        e.preventDefault();
        task(password);
      }}
    >
      <strong id="confirm_updates_message">
        Please enter your password to confirm updates
      </strong>
      {Object.entries(data).map((up) => {
        return (
          <div className="update_track">
            <label>{up[0]}</label>
            <p>
              <strong>{up[1].current}</strong> to <strong>{up[1].next}</strong>
            </p>
          </div>
        );
      })}
      <div className="password_input_field">
        <input
          ref={passwordInp}
          value={password}
          type={`${showPassword ? 'text' : 'password'}`}
          placeholder="Password"
          onInput={(e) => {
            setPassword(e.target.value);
          }}
        />
        <span
          className="password_eye"
          onClick={(e) => {
            setShowPassword(!showPassword);
          }}
        >
          <img
            src={`eye_${showPassword ? 'opened' : 'closed'}.png`}
            alt={`Eye ${showPassword ? 'opened' : 'closed'}`}
          />
        </span>
      </div>
      <button
        type="button"
        className="cancel_btn"
        onClick={(e) => {
          setError('Update cancelled.');
          setOverlayContent('');
        }}
      >
        Cancel
      </button>
      <button type="submit" className="confirm_btn">
        Confirm
      </button>
    </form>
  );
}
