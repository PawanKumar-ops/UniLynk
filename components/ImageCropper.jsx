import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropper.css';

export default function ImageCropper({ image, onCropComplete, onCancel, aspectRatio = 1, cropShape = 'rect', targetWidth, targetHeight }) {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) {
      onCropComplete(image);
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    // Set canvas dimensions to target size if provided, otherwise use crop dimensions
    canvas.width = targetWidth || completedCrop.width;
    canvas.height = targetHeight || completedCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        onCropComplete(reader.result);
      };
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="cropper-header">
          <h3 className="cropper-title">Adjust Your Image</h3>
          <p className="cropper-subtitle">
            {cropShape === 'circle' 
              ? `Drag to position your logo (${targetWidth || '192'}x${targetHeight || '192'}px)` 
              : `Drag to position your banner (${targetWidth || '1513'}x${targetHeight || '400'}px)`}
          </p>
        </div>

        <div className="cropper-content">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={cropShape === 'circle'}
          >
            <img
              ref={imgRef}
              src={image}
              alt="Crop preview"
              className="cropper-image"
            />
          </ReactCrop>
        </div>

        <div className="cropper-actions">
          <button className="btn-cropper-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-cropper-apply" onClick={getCroppedImg}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}