
import React, { useState, useRef } from 'react';
import { UploadIcon, MicIcon, SendIcon } from './icons.tsx';

interface InputAreaProps {
  onProcess: (text: string, image: File | null) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onProcess, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text && !image) return;
    onProcess(text, image);
    setText('');
    handleRemoveImage();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <textarea
        className="flex-grow w-full p-3 bg-gray-700 text-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
        placeholder="메모를 입력하거나, 연락처를 붙여넣거나, 영수증을 설명하거나, 일정을 계획하세요..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />

      {imagePreview && (
        <div className="mt-4 relative">
          <img src={imagePreview} alt="Image preview" className="max-h-48 w-auto rounded-lg" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 focus:outline-none"
            aria-label="이미지 제거"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleUploadClick}
            className="p-2 text-gray-400 hover:text-cyan-400 disabled:opacity-50"
            aria-label="이미지 업로드"
            disabled={isLoading}
          >
            <UploadIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-cyan-400 disabled:opacity-50"
            aria-label="음성 녹음 (미구현)"
            disabled={true}
            title="음성 입력은 곧 제공될 예정입니다!"
          >
            <MicIcon className="h-6 w-6" />
          </button>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed"
          disabled={isLoading || (!text && !image)}
        >
          <SendIcon className="h-5 w-5" />
          처리
        </button>
      </div>
    </form>
  );
};
