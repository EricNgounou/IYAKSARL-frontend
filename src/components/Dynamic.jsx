// import { Link } from 'react-router-dom';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function EmailVerificationBox({
  message,
  task,
  setDigitInput,
  setOverlayContent,
}) {
  const [error, setError] = useState(null);
  const [digitCode, setDigitCode] = useState('');
  const [expTime, setExpTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  let timer;

  const digitInputsRef = {
    inputRef1: useRef(null),
    inputRef2: useRef(null),
    inputRef3: useRef(null),
    inputRef4: useRef(null),
    inputRef5: useRef(null),
    inputRef6: useRef(null),
  };

  const handleInput = (e) => {
    if (isNaN(+e.target.value)) {
      e.target.value = '';
      return;
    }
    setDigitCode(digitCode + e.target.value);
  };

  const handleErase = (e) => {
    if (e.key === 'Backspace') {
      setDigitCode(digitCode.slice(0, -1));
    }
  };

  const clearInputs = () => {
    setDigitCode('');
    Object.values(digitInputsRef).forEach((el) => (el.current.value = ''));
  };

  const setExpireTimer = () => {
    let delay = 5 * 60; // in seconds
    const tick = () => {
      if (delay === 0) {
        clearInterval(timer);
        setOverlayContent(null);
      }
      const min = String(Math.floor(delay / 60)).padStart(2, 0);
      const sec = String(delay % 60).padStart(2, 0);
      setExpTime(`${min}:${sec}`);

      delay--;
    };
    tick();
    timer = setInterval(tick, 1000);
  };

  useEffect(() => {
    setExpireTimer();
    setError(null);

    return () => {
      clearInterval(timer);
    };
  }, [message]);

  useEffect(() => {
    if (digitCode.length !== 6) {
      const focusedInp =
        digitInputsRef[`inputRef${digitCode.length + 1}`].current;
      focusedInp.value = '';
      focusedInp.focus();
      setDigitInput(focusedInp);
    } else {
      (async () => {
        await task(digitCode, setError, clearInputs, setIsLoading, timer);
      })();
    }
  }, [digitCode]);

  return (
    <>
      <p className="otp_message">{message}</p>

      <span className="label_time">Expire in {expTime}</span>

      <div className="code_fields">
        <input
          ref={digitInputsRef.inputRef1}
          id="digit_1"
          type="text"
          onChange={handleInput}
          readOnly={digitCode.length + 1 !== 1}
          spellCheck={false}
        />

        <input
          ref={digitInputsRef.inputRef2}
          id="digit_2"
          type="text"
          onChange={handleInput}
          onKeyDown={handleErase}
          readOnly={digitCode.length + 1 !== 2}
          spellCheck={false}
        />

        <input
          ref={digitInputsRef.inputRef3}
          id="digit_3"
          type="text"
          onChange={handleInput}
          onKeyDown={handleErase}
          readOnly={digitCode.length + 1 !== 3}
          spellCheck={false}
        />

        <input
          ref={digitInputsRef.inputRef4}
          id="digit_4"
          type="text"
          onChange={handleInput}
          onKeyDown={handleErase}
          readOnly={digitCode.length + 1 !== 4}
          spellCheck={false}
        />

        <input
          ref={digitInputsRef.inputRef5}
          id="digit_5"
          type="text"
          onChange={handleInput}
          onKeyDown={handleErase}
          readOnly={digitCode.length + 1 !== 5}
          spellCheck={false}
        />
        <input
          ref={digitInputsRef.inputRef6}
          id="digit_6"
          type="text"
          onChange={handleInput}
          onKeyDown={handleErase}
          disabled={digitCode.length + 1 !== 6}
          spellCheck={false}
        />
      </div>
      {isLoading ? <Spinner opClass="otp_spinner" /> : null}
      {error ? <p className="error">{error}</p> : null}
      <button
        className="cancel_btn"
        onClick={(e) => {
          setOverlayContent(null);
          clearInterval(timer);
        }}
      >
        Cancel
      </button>
    </>
  );
}

export function InputError({ err }) {
  return <span className="input_error">{err}</span>;
}

export function Spinner({ opClass }) {
  return (
    <span className={`loading_spinner ${opClass ? opClass : ''}`}>
      <img className="spinner" src="/spinner.png" alt="Loading spinner" />
    </span>
  );
}

export function Overlay({ content, setOverlay, digitInput, isloading }) {
  return (
    <div
      className={`overlay ${isloading ? 'loading' : ''}`}
      onClick={(e) => {
        setOverlay && setOverlay(false);
        digitInput && digitInput.focus();
      }}
    >
      {content}
    </div>
  );
}

export function PageLoadManager({
  pathOnfailed,
  page,
  targetState,
  hasFailed,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (hasFailed) {
      navigate(pathOnfailed);
    }
  }, [hasFailed]);
  return targetState ? (
    page
  ) : (
    <section id="page_load_manager">
      <Overlay content={<Spinner />} isloading={true} />
    </section>
  );
}

export const OverlayMessage = ({ message }) => (
  <div className="overlay_mess">
    <p>{message}</p>
  </div>
);
