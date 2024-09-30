import { OpenMaskEditor } from '@/utils/ai/maskeditor';
import Image from 'next/image';
import settings from '@/stores/imageStore'




type QrCardProps = {
  id: string;
  imageURL?: string;
  time: string;
};


const handleClick = () => {
  OpenMaskEditor();
}

export const QrCard: React.FC<QrCardProps> = ({ id, imageURL, time }) => {
  if (!imageURL) {
    return (
      <div>
        <p>Image URL not provided</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-center items-center gap-y-2 w-[510px] border border-gray-300 rounded shadow group p-2 mx-auto max-w-full">
      <Image
        id={id}
        src={imageURL}
        onClick={handleClick}
        className="rounded "
        alt="qr code"
        width={480}
        height={480}
      />
      {/* <p className="text-gray-400 text-sm italic">
         took {time} seconds to generate.
      </p> */}
    </div>
  );
};
