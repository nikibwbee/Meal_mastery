'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Import signIn method from next-auth
import { useRouter } from 'next/navigation';
import ThemeToggle from './Toogle';
import { Header } from './Header';
import Button from './Button/Button';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email === "admin3214@gmail.com" && password === "1234") {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
        router.push('/chatbot');
      } catch (error) {
        console.error('Error during signup:', error);
      }
    } else {
      alert("Invalid email or password. Please try again.");
    }
  };

  return (
    <>
      <section className="bg-white py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex items-center justify-center px-4 py-2 bg-white sm:px-6 lg:px-8">
            <div className="xl:w-full xl:max-w-sm 2xl:max-w-md xl:mx-auto">
              <h2 className="text-[1.5xl] font-bold leading-tight text-black sm:text-2xl">Sign in to Celebration</h2>
              <p className="mt-2 text-[14px] text-gray-600">
                Don’t have an account? 
                <a href="#" title="" className="font-medium text-blue-600 transition-all duration-200 hover:text-blue-700 hover:underline focus:text-blue-700">Create a free account</a>
              </p>

              <form onSubmit={handleSubmit} className="mt-8">
                <div className="space-y-5">
                  <div>
                    <label className="text-[14px] font-medium text-gray-900"> Email address </label>
                    <div className="mt-2.5">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email to get started"
                        className="block text-[12px] w-full p-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[14px] font-medium text-gray-900"> Password </label>

                      <a href="#" title="" className="text-sm font-medium text-blue-600 hover:underline hover:text-blue-700 focus:text-blue-700"> Forgot password? </a>
                    </div>
                    <div className="mt-2.5">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="text-[12px] block w-full p-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <button type="submit" className="inline-flex items-center justify-center w-full px-4 py-3 text-[12px] font-semibold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-md focus:outline-none hover:bg-blue-700 focus:bg-blue-700">Log in</button>
                  </div>
                </div>
              </form>

              <div className="mt-3 space-y-3">
                {/* Sign in with Google */}
                <button
                  onClick={() => signIn('google', { callbackUrl: '/chatbot' })}
                  type="button"
                  className="relative inline-flex items-center justify-center w-full px-4 py-2 text-[12px] font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-200 rounded-md hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black focus:outline-none"
                >
                  <div className="absolute left-0 p-4">
                    <svg className="w-6 h-6 text-rose-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"
                      ></path>
                    </svg>
                  </div>
                  Sign in with Google
                </button>

                {/* Sign in with Facebook */}
                <button
                  onClick={() => signIn('facebook')}
                  type="button"
                  className="relative inline-flex items-center justify-center w-full px-4 py-2 text-[12px] font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-200 rounded-md hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black focus:outline-none"
                >
                  <div className="absolute left-0 p-4">
                    <svg className="w-6 h-6 text-[#2563EB]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"></path>
                    </svg>
                  </div>
                  Sign in with Facebook
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center content-center px-4">
            <div>
              <img className="w-full h-[70vh] mx-auto" src="./Healthy.png" alt="" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
