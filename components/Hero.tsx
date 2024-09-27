'use client';

import Image from 'next/image';
import NavLink from './NavLink';

export default function Hero() {
  return (
    <section>
      <div className="custom-screen pt-28 text-gray-600">
        <div className="space-y-5 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl text-gray-800 font-extrabold mx-auto sm:text-6xl">
            Generate your next AI Image in seconds
          </h1>
          <p className="max-w-xl mx-auto">
           
          </p>
          <div className="flex items-center justify-center gap-x-3 font-medium text-sm">
            <NavLink
              href="/start"
              className="text-white bg-gray-800 hover:bg-gray-600 active:bg-gray-900 "
            >
              Generate your Image
            </NavLink>
          </div>
        </div>
      </div>
    </section>
  );
}
