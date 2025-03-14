import {React} from 'react'
import Logo from './Logo'

export const Header=()=>{
    return(
<header>
    <div class="relative bg-black">
        <div class="absolute inset-0">
            <img class="object-cover w-full h-full" src="https://cdn.rareblocks.xyz/collection/celebration/images/headers/3/coworking-space.jpg" alt="" />
        </div>

        <div class="absolute inset-0 bg-black/30"></div>

        <div class="relative px-4 mx-auto sm:px-6 lg:px-8">
            <nav class="flex items-center justify-between h-16 lg:h-20">
                <div class="flex-shrink-0">
                    <a href="#" title="" class="flex">
                       <Logo/>
                    </a>
                </div>

                <button type="button" class="inline-flex p-2 text-white transition-all duration-200 rounded-md lg:hidden focus:bg-gray-800 hover:bg-gray-800">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>

                <div class="hidden lg:flex lg:items-center lg:space-x-10">
                    <a href="/" title="" class="text-base font-medium text-white"> Home </a>

                 

                    <a href="#" title="" class="text-base font-medium text-white"> Resources </a>

                    <a href="/contact" title="" class="text-base font-medium text-white"> Contact </a>
                </div>

                <a href="#" title="" class="items-center justify-center hidden px-6 py-3 text-base font-semibold text-black transition-all duration-200 bg-yellow-400 border border-transparent rounded-full lg:inline-flex hover:bg-yellow-500 focus:bg-yellow-500" role="button"> Join Now </a>
            </nav>
        </div>
    </div>

    <nav class="hidden flex-col justify-between w-full max-w-xs min-h-screen px-4 py-10 bg-black sm:px-6 lg:hidden">
        <button type="button" class="inline-flex p-2 text-white transition-all duration-200 rounded-md focus:bg-gray-800 hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div class="flex flex-col flex-grow h-full">
            <nav class="flex flex-col flex-1 mt-10 space-y-2">
                <a href="/" title="" class="flex w-full py-2 font-medium text-white transition-all duration-200 focus:text-opacity-70"> Home </a>

                <a href="/chatbot" title="" class="flex w-full py-2 font-medium text-white transition-all duration-200 focus:text-opacity-70"> Chatbot </a>

                <a href="#" title="" class="flex w-full py-2 font-medium text-white transition-all duration-200 focus:text-opacity-70"> Resources </a>

                <a href="/contact" title="" class="flex w-full py-2 font-medium text-white transition-all duration-200 focus:text-opacity-70"> Contact </a>
            </nav>

            <div class="flex flex-col items-start">
                <a href="#" title="" class="inline-flex items-center justify-center w-auto px-6 py-3 mt-auto text-base font-semibold text-black transition-all duration-200 bg-yellow-400 border border-transparent rounded-full hover:bg-yellow-500 focus:bg-yellow-500" role="button"> Join Now </a>
            </div>
        </div>
    </nav>
</header>

    )
}
