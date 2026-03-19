import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchUser, isInputValid } from '../helpers';
import { EmailVerificationBox, Overlay } from '../Dynamic';
import { InputError, Spinner } from '../Dynamic';

export default function SignPage({ signOb }) {
  const { pathname } = useLocation();
  const [error, setError] = useState('');
  const [overlayContent, setOverlayContent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [inputErrors, setInpErrors] = useState({
    nameErr: null,
    emailErr: null,
    passwordErr: null,
  });

  const labels = {
    nameLabelRef: useRef(null),
    emailLabelRef: useRef(null),
    passwordLabelRef: useRef(null),
  };
  const labelsArr = [labels.emailLabelRef, labels.passwordLabelRef];

  const [digitInput, setDigitInput] = useState(null);
  const navigate = useNavigate();

  const inputsHandler = (
    type,
    value,
    label,
    inpErrors = { ...inputErrors },
  ) => {
    setError(null);
    const trimmedVal = value.trim();
    const upInputs = { ...inputs };
    if (type === 'name') {
      upInputs.name = trimmedVal;
    } else if (type === 'email') {
      upInputs.email = trimmedVal.toLowerCase();
    } else if (type === 'password') {
      upInputs.password = trimmedVal;
    }
    label.style.top = !trimmedVal ? '50%' : 0;
    label.style.background = !trimmedVal ? 'transparent' : 'white';
    label.style.padding = !trimmedVal ? 0 : '0 4px';
    isInputValid(type, trimmedVal, inpErrors);
    setInputs(upInputs);
    setInpErrors(inpErrors);
  };

  const manageAccount = async (process) => {
    try {
      const { name, email, password } = inputs;
      if (
        (name && !isInputValid('name', name, inputErrors)) ||
        !isInputValid('email', email, inputErrors) ||
        !isInputValid('password', password, inputErrors)
      ) {
        throw new Error('Invalid inputs');
      }

      const data = { ...inputs, process };
      let url = `${import.meta.env.VITE_API_URL}/otp/send-otp`;
      setError(null);
      setIsLoading(true);
      let res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message);
      }
      setIsLoading(false);
      url = `${import.meta.env.VITE_API_URL}/users/${process}`;
      setTimeout(() => {
        setOverlayContent(
          <EmailVerificationBox
            message={`A verification code has been sent to ${email}. Enter that code to ${process}.`}
            task={async (otp, setError, clearInputs, setIsLoading, timer) => {
              try {
                setIsLoading(true);
                res = await fetch(url, {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ ...inputs, otp, process }),
                });
                resData = await res.json();

                if (!res.ok) {
                  throw new Error(resData.message);
                }

                clearInterval(timer);
                if (process === 'login') {
                  await fetchUser(
                    signOb.setCurrentUser,
                    signOb.setHasFetchingUserFailed,
                  );
                } else {
                  setOverlayContent(
                    <strong> Account successfully created </strong>,
                  );
                }

                setTimeout(() => {
                  setOverlayContent(null);
                  navigate(
                    `/${process === 'register' ? 'login' : 'user-page'}`,
                  );
                }, 3000);
              } catch (err) {
                setError(err.message);
                setIsLoading(false);
                clearInputs();
              }
            }}
            setDigitInput={setDigitInput}
            setOverlayContent={setOverlayContent}
          />,
        );
      }, 100);
    } catch (err) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  useEffect(() => {
    setError('');
    labelsArr.forEach((l) => {
      l.current.style.top = '50%';
      l.current.style.background = 'transparent';
    });
    setInputs({
      name: '',
      email: '',
      password: '',
    });
    setInpErrors({
      nameErr: null,
      emailErr: null,
      passwordErr: null,
    });
  }, [pathname]);

  useEffect(() => {
    if (isLoading) setOverlayContent(<Spinner />);
    else setOverlayContent(null);
    if (signOb.currentUser) {
      navigate('/user-page');
    }
  }, [isLoading, signOb.currentUser]);

  return (
    <section id="sign-page">
      <span
        className="btn_back"
        onClick={(e) => {
          navigate(-1);
        }}
      >
        &larr;
      </span>
      <h2> {`Sign ${pathname === '/login' ? ' in' : 'up'}`} </h2>
      <form
        id="sign_form"
        onSubmit={(e) => {
          e.preventDefault();
          manageAccount(pathname === '/login' ? 'login' : 'register');
        }}
      >
        {error ? (
          <p className="error">{error}</p>
        ) : isLoading ? (
          <Spinner />
        ) : (
          <p className="sign_message">
            {pathname === '/login'
              ? 'Enter your email & password.'
              : 'Please fill this form to register. All fields are mandatory!'}
          </p>
        )}

        {pathname === '/register' && (
          <div className="input_field" id="name_field">
            <div>
              <label ref={labels.nameLabelRef} htmlFor="sign_username">
                Name (optional)
              </label>
              <input
                id="sign_username"
                name="username"
                type="text"
                value={inputs.name}
                onChange={(e) => {
                  inputsHandler(
                    'name',
                    e.target.value,
                    labels.nameLabelRef.current,
                  );
                }}
              />
            </div>
            {inputErrors.nameErr && <InputError err={inputErrors.nameErr} />}
          </div>
        )}

        <div className="input_field" id="email_field">
          <div>
            <label ref={labels.emailLabelRef} htmlFor="sign_email">
              Email
            </label>
            <input
              id="sign_email"
              type="email"
              name="email"
              value={inputs.email}
              required
              onChange={(e) => {
                inputsHandler(
                  'email',
                  e.target.value,
                  labels.emailLabelRef.current,
                );
              }}
            />
          </div>
          {inputErrors.emailErr && <InputError err={inputErrors.emailErr} />}
        </div>

        <div className="input_field" id="password_field">
          <div>
            <label ref={labels.passwordLabelRef} htmlFor="sign_password">
              Password
            </label>
            <input
              id="sign_password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={inputs.password}
              required
              onChange={(e) => {
                inputsHandler(
                  'password',
                  e.target.value,
                  labels.passwordLabelRef.current,
                );
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
                alt={showPassword ? 'Eye opened' : 'Eye closed'}
              />
            </span>
          </div>
          {inputErrors.passwordErr && (
            <InputError err={inputErrors.passwordErr} />
          )}
        </div>

        <button className={'btn_submit'}>
          {pathname === '/login' ? ' Login' : 'Register'}
        </button>
      </form>

      {pathname === '/login' ? (
        <p>
          Not having an account yet? <br />
          <Link to="/register" className="label_sign">
            Sign up
          </Link>
        </p>
      ) : (
        <Link to="/login" className="label_sign">
          Back to Login space
        </Link>
      )}
      {overlayContent && (
        <Overlay
          content=<div
            className={`sign_popup_box ${isLoading ? 'loading' : ''}`}
          >
            {overlayContent}
          </div>
          digitInput={digitInput}
          isloading={isLoading}
        />
      )}
    </section>
  );
}
