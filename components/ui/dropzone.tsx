import React, { useCallback, useImperativeHandle } from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  onImageDropped: (file: File) => void;
  // predictions: any[];
  // userUploadedImage: boolean;
}

export interface DropzoneRef {
  open: () => void;
}

const Dropzone = React.forwardRef<DropzoneRef, DropzoneProps>((props, ref) => {
  //const { onImageDropped, predictions, userUploadedImage } = props;
  const { onImageDropped } = props;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageDropped(acceptedFiles[0]);
      }
    },
    [onImageDropped]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: false,
  });

  useImperativeHandle(ref, () => ({
    open,
  }));

  // 根据条件判断是否渲染组件
  // if (predictions.length) return null;
  // if (userUploadedImage) return null;

  return (
    <div
      className="space-y-2 z-50 flex w-full h-full text-gray-500 text-sm text-center cursor-pointer select-none w-full h-[500px] bg-gray-50 border-hairline"
      {...getRootProps()}
    >
      <div className="m-auto">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here ...</p>
        ) : (
          <p>Optional: Drag and drop a starting image here</p>
        )}
      </div>
    </div>
  );
});

export default Dropzone;