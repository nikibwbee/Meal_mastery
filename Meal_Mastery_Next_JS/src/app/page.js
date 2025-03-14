import Image from "next/image";
import {Signup} from '../components/Signup'
import Footer from "../components/Footer";
import { Header } from "../components/Header";
export default function Home() {
  return (
    <div className=''>
<Header/>
   <Signup/>
 <Footer/>
    </div>
  );
}