import { useEffect, useRef, useState } from 'react';
import { OverlayMessage, Spinner } from '../../../Dynamic';
import 'cropperjs';

export default function ImagesProcessor({
  files,
  limit,
  setOverlay,
  task,
  inputTarget,
}) {
  const [imgSrcs, setImgSrcs] = useState(null);
  const [croppedImgs, setCroppedImgs] = useState(null);
  const [curImg, setCurImg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const cropperRef = useRef(null);
  const imageRef = useRef(null);

  const handleRotate = () => {
    if (!imageRef || !curImg) return;
    imageRef.current.$rotate('90deg');
  };

  const handleCropper = async () => {
    if (!cropperRef || !curImg) return;
    try {
      setIsLoading(true);
      const blobAssets = {};
      const canvas1 = await cropperRef.current.$toCanvas({
        width: 1200,
        height: 1200,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      const canvas2 = await cropperRef.current.$toCanvas({
        width: 300,
        height: 300,
      });

      const handleCanvas = (canvas, type) => {
        canvas.toBlob(
          (blob) => {
            blobAssets[type] =
              type === 'main' ? blob : URL.createObjectURL(blob);

            if (Object.keys(blobAssets).length === 2) {
              blobAssets.isDefault = false;
              blobAssets.isUploaded = false;
              setCroppedImgs((prevState) => {
                const newState = [...prevState];
                newState.splice(curImg.index, 1, blobAssets);
                return newState;
              });

              imgSrcs[curImg.index + 1] &&
                setCurImg({
                  index: curImg.index + 1,
                  src: imgSrcs[curImg.index + 1],
                });
              setIsLoading(false);
            }
          },
          'image/webp',
          0.85,
        );
      };

      handleCanvas(canvas1, 'main');
      handleCanvas(canvas2, 'objectURL');
    } catch (error) {
      console.error('Cropping failed:', error);
    }
  };

  useEffect(() => {
    const imgFiles = [...files];
    let errorMessage = null;
    const readedFiles = [];

    if (imgFiles.length > limit) {
      errorMessage = `Please Upload at most ${limit} images!`;
    } else if (!imgFiles.every((file) => file.type.startsWith('image/'))) {
      errorMessage = 'Please Upload images only!';
    }
    if (!errorMessage) {
      for (const file of imgFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        // This once the file is fully processed
        reader.onload = (e) => {
          readedFiles.push(reader.result);

          if (readedFiles.length === imgFiles.length) {
            setImgSrcs(readedFiles);
            setCurImg({ src: readedFiles[0], index: 0 });
            setCroppedImgs(Array(imgFiles.length).fill(null));
          }
        };
      }
    } else {
      setOverlay(<OverlayMessage message={errorMessage} />);
      setTimeout(() => {
        setOverlay(null);
      }, 2000);
    }
  }, []);

  return (
    <section id="img_processor">
      {imgSrcs ? (
        <>
          <div id="original_imgs_preview">
            {imgSrcs.map((src, i) => (
              <span
                className="original_img_wrapper"
                aria-checked={Boolean(croppedImgs[i])}
                key={i}
              >
                <img
                  className="original_img"
                  aria-selected={curImg.index === i ? true : false}
                  src={src}
                  onClick={(e) => {
                    setCurImg({ src: e.target.getAttribute('src'), index: i });
                  }}
                />
              </span>
            ))}
          </div>

          <div id="cur_img_process">
            <cropper-canvas style={{ width: '100%', height: '400px' }}>
              <cropper-image
                ref={imageRef}
                src={curImg.src}
                rotatable
                scalable
                style={{
                  width: '400px',
                  height: '400px',
                }}
              ></cropper-image>
              <cropper-shade></cropper-shade>
              <cropper-selection
                ref={cropperRef}
                aspect-ratio="1"
                initial-coverage="1"
                resizable
                movable
              >
                <cropper-grid role="grid" covered></cropper-grid>
                <cropper-crosshair centered></cropper-crosshair>
                <cropper-handle action="move" theme="layer"></cropper-handle>
                <cropper-handle action="n-resize" theme="line"></cropper-handle>
                <cropper-handle action="e-resize" theme="line"></cropper-handle>
                <cropper-handle action="s-resize" theme="line"></cropper-handle>
                <cropper-handle action="w-resize" theme="line"></cropper-handle>
                <cropper-handle
                  action="ne-resize"
                  theme="corner"
                ></cropper-handle>
                <cropper-handle
                  action="se-resize"
                  theme="corner"
                ></cropper-handle>
                <cropper-handle
                  action="sw-resize"
                  theme="corner"
                ></cropper-handle>
                <cropper-handle
                  action="nw-resize"
                  theme="corner"
                ></cropper-handle>
              </cropper-selection>
            </cropper-canvas>
            <div className="control_btns top">
              <button className="btn_rotate" onClick={handleRotate}>
                Rotate 90°
              </button>
              <button className="btn_crop" onClick={handleCropper}>
                Crop
              </button>
            </div>
          </div>

          <div id="cropped_imgs_preview">
            {croppedImgs &&
              croppedImgs.map((blobs, i) => (
                <img
                  key={i}
                  className="cropped_img"
                  src={blobs?.objectURL ?? '/image.png'}
                  alt="Cropped preview"
                />
              ))}
          </div>

          <div className="control_btns bottom">
            <button
              className="btn_cancel"
              onClick={(e) => {
                inputTarget.value = null;
                setOverlay(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn_OK"
              onClick={(e) => {
                inputTarget.value = null;
                task(croppedImgs);
              }}
              disabled={!croppedImgs.every((blobs) => blobs)}
            >
              OK
            </button>
          </div>
        </>
      ) : (
        <Spinner />
      )}
      {isLoading && <div className="loading_overlay">{<Spinner />}</div>}
    </section>
  );
}
